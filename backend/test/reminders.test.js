// Renewal reminders: who gets one, that nobody gets more than two, and how sending behaves.
// Uses a separate database (gymsoft_test_wa) and a fake WhatsApp, so nothing is really sent.
import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import mongoose from 'mongoose'
import { addDays, addMonths, todayStr } from '../../shared/domain.mjs'
import { Member, Period, getSettings } from '../src/db.js'
import { useAccountForScript } from '../src/tenant.js'
import { config } from '../src/whatsapp/config.js'
import { WaRecipientError, WaUnavailableError } from '../src/whatsapp/errors.js'
import { Reminder } from '../src/whatsapp/models.js'
import { queueReminders, reminderDue, sendPending } from '../src/whatsapp/reminders.js'

const TEST_DB = process.env.MONGO_TEST_WA_URL || 'mongodb://127.0.0.1:27017/gymsoft_test_wa'
const today = todayStr()
const at = (hour, day = today) => new Date(`${day}T${String(hour).padStart(2, '0')}:00:00`)
const noWait = () => Promise.resolve()
// Queued just after midnight, so the tests behave the same at any hour of the day.
const queue = (wa) => queueReminders({ wa, now: at(0) })

function fakeWa({ linked = true, fail } = {}) {
  const wa = {
    sent: [],
    isLinked: linked,
    linked: async () => wa.isLinked,
    canSend: async () => ({ ok: wa.isLinked, reason: wa.isLinked ? 'disconnected' : 'needs_qr' }),
    send: async (number, text) => {
      const err = fail?.(number)
      if (err) throw err
      wa.sent.push({ number, text })
      return { messageId: `m${wa.sent.length}` }
    },
  }
  return wa
}

let memberNo = 0
// renewalInDays: 0 = renewal date is today, -2 = it was two days ago, 10 = still running.
async function member(name, renewalInDays, extra = {}) {
  const renewalDate = addDays(today, renewalInDays)
  const m = await Member.create({ memberNo: ++memberNo, name, phone: '9811100001', joinDate: addMonths(renewalDate, -1), ...extra })
  await Period.create({ memberId: m._id, planName: '1 Month', months: 1, startDate: addMonths(renewalDate, -1), renewalDate, fee: 1000 })
  return m
}
const reminders = async (filter = {}) => (await Reminder.find(filter).sort({ memberName: 1, kind: 1 }).lean()).map((r) => `${r.memberName}:${r.kind}:${r.status}`)

before(async () => {
  await mongoose.connect(TEST_DB)
  await mongoose.connection.dropDatabase()
  // The whole file works on one gym: the test database itself.
  await useAccountForScript({ id: 'test', dbName: mongoose.connection.name, waSessionId: 'test' })
  await Reminder.init() // build the unique index before the first insert
  const s = await getSettings()
  s.gymName = 'Iron Temple Gym'
  await s.save()
})

beforeEach(async () => {
  await Promise.all([Member.deleteMany({}), Period.deleteMany({}), Reminder.deleteMany({})])
  const s = await getSettings()
  s.waEnabled = true
  await s.save()
})

after(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

test('which reminder is due on which day', () => {
  const none = {}
  assert.equal(reminderDue(1, none, today), null) // not due yet
  assert.equal(reminderDue(0, none, today), 'due') // on the renewal date
  assert.equal(reminderDue(-1, none, today), 'due') // PC was off yesterday: one day late
  assert.equal(reminderDue(-2, none, today), 'after') // the due-date one was missed completely
  assert.equal(reminderDue(-4, none, today), 'after')
  assert.equal(reminderDue(-5, none, today), null) // too late for anything
  const dueSent = { due: addDays(today, -2) }
  assert.equal(reminderDue(-1, dueSent, today), null) // waiting for day 2
  assert.equal(reminderDue(-2, dueSent, today), 'after')
  assert.equal(reminderDue(-2, { due: today }, today), null) // never two on the same day
  assert.equal(reminderDue(-3, { due: addDays(today, -3), after: addDays(today, -1) }, today), null) // both sent: nothing more
  assert.equal(reminderDue(-9, dueSent, today), null)
})

test('queues only the members who need a reminder, once', async () => {
  await member('A Due Today', 0)
  await member('B One Day Late', -1)
  await member('C Two Days After', -2)
  await member('D Five Days After', -5)
  await member('E Still Active', 10)
  await member('F Hidden', 0, { hidden: true })
  await member('G No Phone', 0, { phone: '' })
  const wa = fakeWa()

  assert.equal(await queue(wa), 3)
  assert.deepEqual(await reminders(), ['A Due Today:due:pending', 'B One Day Late:due:pending', 'C Two Days After:after:pending'])
  // Running the job again (it runs every few minutes) queues nothing new.
  assert.equal(await queue(wa), 0)
  assert.equal(await Reminder.countDocuments(), 3)
})

test('nothing is queued while WhatsApp is not linked or reminders are switched off', async () => {
  await member('A Due Today', 0)
  assert.equal(await queue(fakeWa({ linked: false })), 0)
  const s = await getSettings()
  s.waEnabled = false
  await s.save()
  assert.equal(await queue(fakeWa()), 0)
  assert.equal(await Reminder.countDocuments(), 0)
})

test('sends the message text with name, gym and date, to the number with country code', async () => {
  const m = await member('Rohit Sharma', 0)
  const wa = fakeWa()
  await queue(wa)
  await sendPending({ wa, now: at(10), wait: noWait })
  assert.equal(wa.sent.length, 1)
  assert.equal(wa.sent[0].number, '919811100001')
  assert.match(wa.sent[0].text, /^Hi Rohit Sharma, your membership at Iron Temple Gym ended on \d{1,2} [A-Z][a-z]{2} \d{4}\. Please renew to continue your workouts\. Thank you!$/)
  const [r] = await Reminder.find({ memberId: m._id }).lean()
  assert.deepEqual([r.status, r.waMessageId, !!r.sentAt], ['sent', 'm1', true])
  // A second run sends nothing again.
  await sendPending({ wa, now: at(10), wait: noWait })
  assert.equal(wa.sent.length, 1)
})

test('a member gets exactly two reminders: on the due date and two days after', async () => {
  await member('Anjali Verma', 0)
  const wa = fakeWa()
  const day = (n) => ({ wa, today: addDays(today, n), now: at(10, addDays(today, n)), wait: noWait })

  for (let n = 0; n <= 8; n++) {
    // The job runs many times a day.
    for (let i = 0; i < 3; i++) {
      await queueReminders(day(n))
      await sendPending(day(n))
    }
    const expected = n < 2 ? 1 : 2
    assert.equal(wa.sent.length, expected, `messages sent by day ${n}`)
  }
  assert.deepEqual(await reminders(), ['Anjali Verma:after:sent', 'Anjali Verma:due:sent'])
  // Both reminders carry the same fixed text.
  assert.equal(wa.sent[0].text, wa.sent[1].text)
  assert.match(wa.sent[0].text, /^Hi Anjali Verma, your membership at Iron Temple Gym ended on /)
})

test('a reminder is cancelled, not sent, when the member renews first', async () => {
  const m = await member('Renewed Riya', 0)
  await member('Waiting Wasim', 0)
  const wa = fakeWa()
  await queue(wa)
  // Riya renews before the message goes out.
  await Period.create({ memberId: m._id, planName: '1 Month', months: 1, startDate: today, renewalDate: addMonths(today, 1), fee: 1000 })
  await sendPending({ wa, now: at(10), wait: noWait })
  assert.deepEqual(await reminders(), ['Renewed Riya:due:cancelled', 'Waiting Wasim:due:sent'])
  assert.equal(wa.sent.length, 1)
  // And she gets no follow-up either.
  assert.equal(await queueReminders({ wa, today: addDays(today, 2), now: at(10, addDays(today, 2)) }), 1) // only Wasim
  assert.equal(await Reminder.countDocuments({ memberName: 'Renewed Riya' }), 1)
})

test('nothing is sent at night; it goes out in the morning', async () => {
  await member('Night Neha', 0)
  const wa = fakeWa()
  await queue(wa)
  await sendPending({ wa, now: at(23), wait: noWait })
  await sendPending({ wa, now: at(6), wait: noWait })
  assert.equal(wa.sent.length, 0)
  await sendPending({ wa, now: at(config.sendWindowStartHour), wait: noWait })
  assert.equal(wa.sent.length, 1)
})

test('WhatsApp offline keeps messages pending; a bad number fails; limits are respected', async () => {
  // Limits count messages by the real time they went out, so this test runs on the real clock
  // with the night-time window switched off.
  const realNow = () => ({ now: new Date(), force: true, wait: noWait })
  await member('A', 0, { phone: '9811100001' })
  await member('B', 0, { phone: '9811100002' })
  await member('C', 0, { phone: '9811100003' })
  const offline = fakeWa({ fail: () => new WaUnavailableError('WhatsApp is not connected right now.') })
  await queue(offline)
  await sendPending({ wa: offline, ...realNow() })
  assert.deepEqual(await reminders(), ['A:due:pending', 'B:due:pending', 'C:due:pending'])
  assert.equal((await Reminder.findOne({ memberName: 'A' }).lean()).attempts, 0) // offline is not an attempt

  // Not linked any more: the job does not even try to connect.
  const unlinked = fakeWa({ linked: false })
  await sendPending({ wa: unlinked, ...realNow() })
  assert.equal(unlinked.sent.length, 0)

  const limit = config.maxPerHour
  config.maxPerHour = 2
  try {
    const wa = fakeWa({ fail: (number) => (number.endsWith('2') ? new WaRecipientError('not on WhatsApp') : null) })
    await sendPending({ wa, ...realNow() })
    // A sent, B failed for good (bad number), C still waiting: only 2 tries in this run.
    assert.deepEqual(await reminders(), ['A:due:sent', 'B:due:failed', 'C:due:pending'])
    await sendPending({ wa, ...realNow() })
    assert.deepEqual(await reminders(), ['A:due:sent', 'B:due:failed', 'C:due:sent'])
    // The hourly limit of 2 is now used up: D has to wait for the next hour.
    await member('D', 0, { phone: '9811100004' })
    await queue(wa)
    await sendPending({ wa, ...realNow() })
    assert.equal((await Reminder.findOne({ memberName: 'D' }).lean()).status, 'pending')
    await sendPending({ wa, ...realNow(), now: new Date(Date.now() + 3600 * 1000) })
    assert.equal((await Reminder.findOne({ memberName: 'D' }).lean()).status, 'sent')
  } finally {
    config.maxPerHour = limit
  }
})

test('an unexpected error is retried later and gives up after three tries', async () => {
  await member('Flaky Farhan', 0)
  const wa = fakeWa({ fail: () => new Error('something odd') })
  await queue(wa)
  for (let i = 1; i <= 3; i++) {
    await Reminder.updateMany({ status: 'pending' }, { scheduledFor: at(9) }) // the retry delay has passed
    await sendPending({ wa, now: at(10), wait: noWait })
    const r = await Reminder.findOne().lean()
    assert.deepEqual([r.attempts, r.status], [i, i < 3 ? 'pending' : 'failed'])
  }
})
