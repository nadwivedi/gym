import { todayStr } from '../../../shared/domain.mjs'
import { getSettings } from '../db.js'
import { loadSummaries } from '../service.js'
import { config } from './config.js'
import { WaRecipientError, WaUnavailableError } from './errors.js'
import { log } from './index.js'
import { Reminder } from './models.js'

// The one reminder text, used for both messages. It is fixed on purpose: the owner does not edit it.
export const MESSAGE = 'Hi {name}, your membership at {gym} ended on {date}. Please renew to continue your workouts. Thank you!'

// A member gets at most two reminders per renewal date:
//   'due'   on the renewal date itself (or one day late, if the PC was off that day)
//   'after' two days after it (up to four days after, for the same reason)
// and never both on the same day. After that nothing more is sent.
const DUE_DAYS = [0, -1]
const AFTER_DAYS = [-2, -3, -4]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const niceDate = (s) => `${Number(s.slice(8))} ${MONTHS[Number(s.slice(5, 7)) - 1]} ${s.slice(0, 4)}`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function render(template, vars) {
  return template.replace(/\{(name|gym|date)\}/g, (_, key) => vars[key] ?? '')
}

// Member phones are stored as 10 digits; WhatsApp needs the country code in front.
export const fullNumber = (phone, countryCode) => (phone.length === 10 ? `${countryCode}${phone}` : phone)

// Which reminder is due today for one renewal date, or null.
// daysLeft: 0 on the renewal date, negative after it.
// already: { due: 'YYYY-MM-DD' | undefined, after: ... } = the day each reminder was queued.
export function reminderDue(daysLeft, already, today) {
  if (already.after) return null
  if (already.due) return AFTER_DAYS.includes(daysLeft) && already.due !== today ? 'after' : null
  if (DUE_DAYS.includes(daysLeft)) return 'due'
  // The renewal date itself was missed completely: only the follow-up goes out.
  return AFTER_DAYS.includes(daysLeft) ? 'after' : null
}

// Members who still need a reminder: not hidden, membership ended, not renewed, with a phone number.
const needsReminder = (s) => !s.hidden && s.status === 'expired' && !!s.phone

// Look for members whose reminder is due and put the messages in the queue. Safe to call
// as often as you like: the unique key makes sure nothing is queued twice.
export async function queueReminders({ wa, today = todayStr(), now = new Date() }) {
  const settings = await getSettings()
  if (!settings.waEnabled) return 0
  // No point queueing while no WhatsApp number is linked: the messages would only go stale.
  if (!(await wa.linked())) return 0

  const rows = (await loadSummaries(today)).filter((s) => needsReminder(s) && s.daysLeft <= 0 && s.daysLeft >= AFTER_DAYS.at(-1))
  if (!rows.length) return 0

  const existing = await Reminder.find({ memberId: { $in: rows.map((s) => s.id) }, kind: { $in: ['due', 'after'] } }, { key: 1, createdAt: 1 }).lean()
  const queuedOn = new Map(existing.map((r) => [r.key, todayStr(r.createdAt)]))

  let queued = 0
  for (const s of rows) {
    const base = `${s.id}:${s.renewalDate}`
    const kind = reminderDue(s.daysLeft, { due: queuedOn.get(`${base}:due`), after: queuedOn.get(`${base}:after`) }, today)
    if (!kind) continue
    try {
      await Reminder.create({
        key: `${base}:${kind}`,
        memberId: s.id,
        memberName: s.name,
        phone: s.phone,
        kind,
        renewalDate: s.renewalDate,
        body: render(MESSAGE, { name: s.name, gym: settings.gymName, date: niceDate(s.renewalDate) }),
        scheduledFor: now,
      })
      queued++
    } catch (err) {
      if (err?.code !== 11000) throw err // 11000 = already queued by a run that overlapped this one
    }
  }
  if (queued) log.info('QUEUED', `${queued} reminder(s)`)
  return queued
}

// One run at a time. A second call while one is running makes it run once more afterwards,
// so a message queued in between is not left waiting and nothing is ever sent twice.
const run = { active: false, again: false }

export async function sendPending(options) {
  if (run.active) {
    run.again = true
    return
  }
  run.active = true
  try {
    do {
      run.again = false
      await sendBatch(options)
    } while (run.again)
  } catch (err) {
    log.error('SENDER_ERROR', err.message)
  } finally {
    run.active = false
  }
}

async function sendBatch({ wa, now = new Date(), today = todayStr(now), force = false, wait = sleep }) {
  const hour = now.getHours()
  if (!force && (hour < config.sendWindowStartHour || hour >= config.sendWindowEndHour)) return

  const settings = await getSettings()
  if (!settings.waEnabled) return

  const pending = await Reminder.find({ status: 'pending', scheduledFor: { $lte: now } }).sort({ scheduledFor: 1 })
  if (!pending.length) return

  // A reminder is pointless once the member has renewed, was hidden, or the date has moved.
  const members = new Map((await loadSummaries(today)).map((s) => [s.id, s]))
  const batch = []
  for (const r of pending) {
    const s = members.get(String(r.memberId))
    if (s && needsReminder(s) && s.renewalDate === r.renewalDate && s.daysLeft >= AFTER_DAYS.at(-1) - 1) batch.push(r)
    else {
      r.status = 'cancelled'
      r.errorReason = 'No longer needed (renewed, hidden or too late)'
      await r.save()
    }
  }
  if (!batch.length) return

  // Don't open a connection when nothing can be sent (not linked, waiting for a QR scan).
  // The messages stay pending and go out once WhatsApp is linked again.
  const { ok, reason } = await wa.canSend()
  if (!ok) return log.info('SKIP', `WhatsApp not available (${reason}): ${batch.length} message(s) stay pending`)

  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
  const [sentToday, sentThisHour] = await Promise.all([
    Reminder.countDocuments({ status: 'sent', sentAt: { $gte: dayStart } }),
    Reminder.countDocuments({ status: 'sent', sentAt: { $gte: hourStart } }),
  ])
  const quota = Math.min(config.maxPerDay - sentToday, config.maxPerHour - sentThisHour)
  if (quota <= 0) return log.info('SKIP', `Limit reached (${sentToday}/${config.maxPerDay} today, ${sentThisHour}/${config.maxPerHour} this hour)`)

  const toSend = batch.slice(0, quota)
  log.info('SENDING', `${toSend.length} reminder(s)`)
  for (let i = 0; i < toSend.length; i++) {
    const r = toSend[i]
    try {
      const result = await wa.send(fullNumber(r.phone, settings.countryCode), r.body)
      r.status = 'sent'
      r.sentAt = new Date()
      r.waMessageId = result.messageId
      r.errorReason = ''
      await r.save()
    } catch (err) {
      if (err instanceof WaUnavailableError) {
        // WhatsApp is offline: keep this and the rest pending, try again on the next run.
        r.errorReason = err.message
        await r.save()
        return log.warn('STOPPED_BATCH', err.message)
      }
      r.attempts += 1
      r.errorReason = err.message
      if (err instanceof WaRecipientError || r.attempts >= config.maxAttempts) r.status = 'failed'
      else r.scheduledFor = new Date(Date.now() + config.retryDelayMs)
      await r.save()
      log.warn('MSG_FAILED', `${r.phone}: ${err.message}`)
    }
    if (i < toSend.length - 1) await wait(config.sendGapMs())
  }
}

// Close the connection once the batch is done and nothing else was sent for a while.
export function closeWhenIdle(wa) {
  setTimeout(() => wa.closeIfIdle().catch(() => {}), config.idleCloseMs + 1000).unref?.()
}

// Starts the background job: every few minutes queue what is due, send it, then disconnect.
export function startReminderJob(wa) {
  // As soon as WhatsApp connects (QR scan or background start), send what is pending.
  wa.setReadyHandler(async () => {
    await sendPending({ wa })
    closeWhenIdle(wa)
  })
  const tick = async () => {
    try {
      await queueReminders({ wa })
      await sendPending({ wa })
    } catch (err) {
      log.error('JOB_ERROR', err.message)
    }
  }
  const first = setTimeout(tick, 20000)
  const timer = setInterval(tick, config.jobIntervalMs)
  first.unref?.()
  timer.unref?.()
  return () => {
    clearTimeout(first)
    clearInterval(timer)
  }
}
