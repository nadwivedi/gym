import express from 'express'
import { PAYMENT_MODES, addMonths, memberState, overlaps, todayStr } from '../../shared/domain.mjs'
import { checkPin, hashPin, makeToken, newSecret, verifyToken } from './auth.js'
import { toCsv } from './csv.js'
import { Member, Payment, Period, Plan, getSettings, logEntry, nextMemberNo, out } from './db.js'
import { loadSummaries, memberDetail, moneyFor } from './service.js'
import { buildYearStats } from './stats.js'
import { dateOf, fail, idOf, intOf, moneyOf, phoneOf, str } from './validate.js'

const MAX_PIN_FAILS = 5
const LOCK_MS = 60000

const pinOf = (v) => (typeof v === 'string' && /^\d{4,8}$/.test(v) ? v : fail(400, 'PIN must be 4 to 8 digits'))
const modeOf = (v) => (PAYMENT_MODES.includes(v) ? v : 'Cash')
const show = (v) => (v === '' || v == null ? 'none' : v)

// Money cannot have been received on a day that has not come yet.
function paidDateOf(v, name) {
  const date = dateOf(v, name)
  if (date > todayStr()) fail(400, `${name} cannot be in the future`)
  return date
}

const publicSettings = (s) => ({
  gymName: s.gymName,
  admissionFee: s.admissionFee,
  overdueDays: s.overdueDays,
  countryCode: s.countryCode,
})

async function getMember(id) {
  return (await Member.findById(idOf(id))) || fail(404, 'Member not found')
}

async function getPeriod(id) {
  return (await Period.findById(idOf(id))) || fail(404, 'Membership not found')
}

async function getPayment(id) {
  const pay = (await Payment.findById(idOf(id))) || fail(404, 'Payment not found')
  if (pay.voided) fail(409, 'This entry is already cancelled')
  return pay
}

async function checkDuplicatePhone(phone, force, exceptId) {
  if (!phone || force) return
  const dup = await Member.findOne({ phone, _id: { $ne: exceptId } }).lean()
  if (dup) fail(409, `${dup.name} already has this phone number`, { code: 'DUPLICATE', memberId: String(dup._id) })
}

// Validates an admission / renewal and returns the fields to store.
async function buildPeriod(body, existing, kind) {
  if (!body || typeof body !== 'object') fail(400, 'Membership details are missing')
  const plan = body.planId ? await Plan.findById(idOf(body.planId)).lean() : null
  if (body.planId && !plan) fail(400, 'Plan not found')
  const months = intOf(body.months ?? plan?.months, 'Months', 1, 60)
  const startDate = dateOf(body.startDate, 'Start date')
  const renewalDate = body.renewalDate ? dateOf(body.renewalDate, 'Renewal date') : addMonths(startDate, months)
  if (renewalDate <= startDate) fail(400, 'Renewal date must be after the start date')
  if (overlaps(existing, startDate, renewalDate)) {
    fail(409, 'These dates overlap a membership this member already has', { code: 'OVERLAP' })
  }
  return {
    planId: plan?._id,
    planName: plan?.name || `${months} month`,
    months,
    startDate,
    renewalDate,
    planPrice: plan?.price ?? 0,
    fee: moneyOf(body.fee ?? plan?.price ?? 0, 'Fee'),
    admissionFee: moneyOf(body.admissionFee ?? 0, 'Admission fee'),
    promisedDate: body.promisedDate ? dateOf(body.promisedDate, 'Promised date') : '',
    note: str(body.note, 500),
    kind,
  }
}

// Optional first payment taken together with an admission / renewal.
function buildPayment(body, total) {
  if (!body || body.amount === '' || body.amount == null || Number(body.amount) === 0) return null
  const amount = moneyOf(body.amount, 'Payment amount')
  if (amount > total) fail(400, 'Payment is more than the total fee')
  return { type: 'payment', amount, date: paidDateOf(body.date, 'Payment date'), mode: modeOf(body.mode), note: str(body.note, 300) }
}

export function api() {
  const r = express.Router()
  let pinFails = 0
  let lockedUntil = 0

  r.get('/auth/status', async (req, res) => {
    const s = await getSettings()
    res.json({ pinSet: !!s.pinHash, gymName: s.gymName })
  })

  r.post('/auth/setup', async (req, res) => {
    const s = await getSettings()
    if (s.pinHash) fail(409, 'A PIN is already set')
    const { salt, hash } = hashPin(pinOf(req.body?.pin))
    s.pinSalt = salt
    s.pinHash = hash
    s.gymName = str(req.body?.gymName, 60) || s.gymName
    await s.save()
    res.json({ token: makeToken(s.secret) })
  })

  r.post('/auth/login', async (req, res) => {
    if (Date.now() < lockedUntil) fail(429, 'Too many wrong tries. Wait one minute and try again.')
    const s = await getSettings()
    if (!checkPin(String(req.body?.pin ?? ''), s.pinSalt, s.pinHash)) {
      if (++pinFails >= MAX_PIN_FAILS) {
        pinFails = 0
        lockedUntil = Date.now() + LOCK_MS
      }
      fail(401, 'Wrong PIN')
    }
    pinFails = 0
    res.json({ token: makeToken(s.secret) })
  })

  // Everything below needs a valid login.
  r.use(async (req, res, next) => {
    const s = await getSettings()
    const token = (req.headers.authorization || '').replace(/^Bearer /, '')
    if (!s.pinHash || !verifyToken(s.secret, token)) fail(401, 'Please enter your PIN')
    req.settings = s
    next()
  })

  r.post('/auth/change-pin', async (req, res) => {
    const s = req.settings
    if (!checkPin(String(req.body?.oldPin ?? ''), s.pinSalt, s.pinHash)) fail(400, 'Current PIN is wrong')
    const { salt, hash } = hashPin(pinOf(req.body?.newPin))
    s.pinSalt = salt
    s.pinHash = hash
    s.secret = newSecret() // signs every other device out
    await s.save()
    res.json({ token: makeToken(s.secret) })
  })

  r.get('/bootstrap', async (req, res) => {
    const plans = await Plan.find().sort({ months: 1, name: 1 }).lean()
    res.json({ today: todayStr(), settings: publicSettings(req.settings), plans: plans.map(out), modes: PAYMENT_MODES })
  })

  r.patch('/settings', async (req, res) => {
    const s = req.settings
    const b = req.body || {}
    if (b.gymName !== undefined) s.gymName = str(b.gymName, 60) || fail(400, 'Gym name is required')
    if (b.admissionFee !== undefined) s.admissionFee = moneyOf(b.admissionFee, 'Admission fee')
    if (b.overdueDays !== undefined) s.overdueDays = intOf(b.overdueDays, 'Days', 1, 365)
    if (b.countryCode !== undefined) {
      s.countryCode = /^\d{1,4}$/.test(String(b.countryCode)) ? String(b.countryCode) : fail(400, 'Country code is not valid')
    }
    await s.save()
    res.json(publicSettings(s))
  })

  // ---- Plans ----

  r.post('/plans', async (req, res) => {
    const b = req.body || {}
    const plan = await Plan.create({
      name: str(b.name, 60) || fail(400, 'Plan name is required'),
      months: intOf(b.months, 'Months', 1, 60),
      price: moneyOf(b.price ?? 0, 'Price'),
    })
    res.status(201).json(out(plan))
  })

  r.patch('/plans/:id', async (req, res) => {
    const plan = (await Plan.findById(idOf(req.params.id))) || fail(404, 'Plan not found')
    const b = req.body || {}
    if (b.name !== undefined) plan.name = str(b.name, 60) || fail(400, 'Plan name is required')
    if (b.months !== undefined) plan.months = intOf(b.months, 'Months', 1, 60)
    if (b.price !== undefined) plan.price = moneyOf(b.price, 'Price')
    if (b.active !== undefined) plan.active = !!b.active
    await plan.save()
    res.json(out(plan))
  })

  // ---- Dashboard and lists ----

  r.get('/dashboard', async (req, res) => {
    const today = todayStr()
    const rows = await loadSummaries(today)
    const buckets = { overdue: [], today: [], week: [], starting: [], hidden: [] }
    for (const s of rows) buckets[s.bucket]?.push(s)
    const byName = (a, b) => a.name.localeCompare(b.name)
    buckets.overdue.sort((a, b) => b.daysLeft - a.daysLeft || byName(a, b)) // most recently expired first
    buckets.today.sort(byName)
    buckets.week.sort((a, b) => a.daysLeft - b.daysLeft || byName(a, b))
    buckets.starting.sort((a, b) => (a.startsOn < b.startsOn ? -1 : 1))
    buckets.hidden.sort((a, b) => (a.hiddenAt < b.hiddenAt ? 1 : -1))
    const dues = rows.filter((s) => s.balance > 0)
    res.json({
      today,
      buckets,
      stats: {
        active: rows.filter((s) => s.status === 'active' && !s.hidden).length,
        total: rows.length,
        duesCount: dues.length,
        duesTotal: dues.reduce((sum, s) => sum + s.balance, 0),
      },
    })
  })

  // Numbers behind the dashboard charts: one calendar year, month by month.
  r.get('/stats', async (req, res) => {
    const today = todayStr()
    const thisYear = Number(today.slice(0, 4))
    const year = req.query.year === undefined ? thisYear : intOf(req.query.year, 'Year', 2000, 2100)
    const [payments, periods, rows, firstPayment, firstPeriod] = await Promise.all([
      Payment.find({ voided: { $ne: true }, date: { $gte: `${year}-01-01`, $lt: `${year + 1}-01-01` } }).lean(),
      Period.find({ status: { $ne: 'cancelled' } }, { memberId: 1, startDate: 1, renewalDate: 1, kind: 1 }).lean(),
      loadSummaries(today),
      Payment.findOne({ voided: { $ne: true } }).sort({ date: 1 }).lean(),
      Period.findOne({ status: { $ne: 'cancelled' } }).sort({ startDate: 1 }).lean(),
    ])
    const stats = buildYearStats({ year, today, payments, periods })
    const active = rows.filter((s) => s.status === 'active' && !s.hidden).length
    // The current month shows the same count as the "active members" tile.
    if (year === thisYear) stats.months[Number(today.slice(5, 7)) - 1].active = active
    const dues = rows.filter((s) => s.balance > 0)
    const firstYear = Math.min(thisYear, ...[firstPayment?.date, firstPeriod?.startDate].filter(Boolean).map((d) => Number(d.slice(0, 4))))
    res.json({
      year,
      today,
      firstYear,
      lastYear: thisYear,
      ...stats,
      members: { active, total: rows.length },
      dues: { count: dues.length, total: Math.round(dues.reduce((sum, s) => sum + s.balance, 0) * 100) / 100 },
    })
  })

  r.get('/members', async (req, res) => {
    const rows = await loadSummaries(todayStr())
    res.json(rows.sort((a, b) => a.name.localeCompare(b.name)))
  })

  // ---- Members ----

  r.post('/members', async (req, res) => {
    const b = req.body || {}
    const name = str(b.name, 80) || fail(400, 'Name is required')
    const phone = phoneOf(b.phone)
    await checkDuplicatePhone(phone, b.force)
    const periodData = await buildPeriod(b.membership, [], 'admission')
    const payData = buildPayment(b.payment, periodData.fee + periodData.admissionFee)
    const member = await Member.create({
      memberNo: await nextMemberNo(),
      name,
      phone,
      gender: str(b.gender, 20),
      notes: str(b.notes, 500),
      joinDate: b.joinDate ? dateOf(b.joinDate, 'Join date') : periodData.startDate,
    })
    try {
      const period = await Period.create({ ...periodData, memberId: member._id })
      if (payData) await Payment.create({ ...payData, memberId: member._id, periodId: period._id })
    } catch (err) {
      // No transactions on a single MongoDB server, so undo by hand.
      await Promise.all([Period.deleteMany({ memberId: member._id }), Member.deleteOne({ _id: member._id })])
      throw err
    }
    res.status(201).json(await memberDetail(member._id, todayStr()))
  })

  r.get('/members/:id', async (req, res) => {
    res.json(await memberDetail(idOf(req.params.id), todayStr()))
  })

  r.patch('/members/:id', async (req, res) => {
    const member = await getMember(req.params.id)
    const b = req.body || {}
    if (b.name !== undefined) member.name = str(b.name, 80) || fail(400, 'Name is required')
    if (b.phone !== undefined) {
      const phone = phoneOf(b.phone)
      if (phone !== member.phone) await checkDuplicatePhone(phone, b.force, member._id)
      member.phone = phone
    }
    if (b.gender !== undefined) member.gender = str(b.gender, 20)
    if (b.notes !== undefined) member.notes = str(b.notes, 500)
    if (b.joinDate !== undefined) member.joinDate = dateOf(b.joinDate, 'Join date')
    await member.save()
    res.json(await memberDetail(member._id, todayStr()))
  })

  r.delete('/members/:id', async (req, res) => {
    const member = await getMember(req.params.id)
    if (await Payment.exists({ memberId: member._id, voided: { $ne: true } })) {
      fail(409, 'This member has payments, so they cannot be deleted. Hide them instead.')
    }
    await Promise.all([Payment.deleteMany({ memberId: member._id }), Period.deleteMany({ memberId: member._id })])
    await member.deleteOne()
    res.json({ ok: true })
  })

  r.post('/members/:id/hide', async (req, res) => {
    const member = await getMember(req.params.id)
    member.hidden = true
    member.hiddenReason = str(req.body?.reason, 200)
    member.hiddenAt = todayStr()
    await member.save()
    res.json(await memberDetail(member._id, todayStr()))
  })

  r.post('/members/:id/unhide', async (req, res) => {
    const member = await getMember(req.params.id)
    member.hidden = false
    await member.save()
    res.json(await memberDetail(member._id, todayStr()))
  })

  // Renew or rejoin: adds a new period and brings a hidden member back.
  r.post('/members/:id/periods', async (req, res) => {
    const member = await getMember(req.params.id)
    const b = req.body || {}
    const existing = await Period.find({ memberId: member._id }).lean()
    const periodData = await buildPeriod(b, existing, member.hidden ? 'rejoin' : 'renewal')
    const payData = buildPayment(b.payment, periodData.fee + periodData.admissionFee)
    const period = await Period.create({ ...periodData, memberId: member._id })
    if (payData) await Payment.create({ ...payData, memberId: member._id, periodId: period._id })
    if (member.hidden) {
      member.hidden = false
      await member.save()
    }
    res.status(201).json(await memberDetail(member._id, todayStr()))
  })

  // ---- Membership periods ----

  r.patch('/periods/:id', async (req, res) => {
    const period = await getPeriod(req.params.id)
    if (period.status === 'cancelled') fail(409, 'This membership is cancelled')
    const b = req.body || {}
    const changes = []
    const set = (field, value, label) => {
      if (value === period[field]) return
      changes.push(`${label}: ${show(period[field])} → ${show(value)}`)
      period[field] = value
    }
    const before = { startDate: period.startDate, months: period.months }

    if (b.planId !== undefined && String(b.planId) !== String(period.planId || '')) {
      const plan = (await Plan.findById(idOf(b.planId)).lean()) || fail(400, 'Plan not found')
      set('planName', plan.name, 'Plan')
      period.planId = plan._id
      period.planPrice = plan.price
      period.months = plan.months
    }
    if (b.startDate !== undefined) set('startDate', dateOf(b.startDate, 'Start date'), 'Start date')
    if (b.renewalDate !== undefined) set('renewalDate', dateOf(b.renewalDate, 'Renewal date'), 'Renewal date')
    else if (period.startDate !== before.startDate || period.months !== before.months) {
      set('renewalDate', addMonths(period.startDate, period.months), 'Renewal date')
    }
    if (b.fee !== undefined) set('fee', moneyOf(b.fee, 'Fee'), 'Fee')
    if (b.admissionFee !== undefined) set('admissionFee', moneyOf(b.admissionFee, 'Admission fee'), 'Admission fee')
    if (b.promisedDate !== undefined) {
      set('promisedDate', b.promisedDate ? dateOf(b.promisedDate, 'Promised date') : '', 'Promised date')
    }
    if (b.note !== undefined) period.note = str(b.note, 500)

    if (period.renewalDate <= period.startDate) fail(400, 'Renewal date must be after the start date')
    const siblings = await Period.find({ memberId: period.memberId }).lean()
    if (overlaps(siblings, period.startDate, period.renewalDate, period._id)) {
      fail(409, 'These dates overlap another membership of this member', { code: 'OVERLAP' })
    }
    period.waived = Math.min(period.waived, period.fee + period.admissionFee)
    if (changes.length) {
      const reason = str(b.reason, 200)
      period.history.push(logEntry(changes.join('; ') + (reason ? ` (${reason})` : '')))
    }
    await period.save()
    res.json(await memberDetail(period.memberId, todayStr()))
  })

  r.post('/periods/:id/cancel', async (req, res) => {
    const period = await getPeriod(req.params.id)
    if (period.status === 'cancelled') fail(409, 'This membership is already cancelled')
    const m = await moneyFor(period)
    if (m.netPaid > 0) fail(409, 'This membership has payments. Refund them, or move them to the right member, first.')
    period.status = 'cancelled'
    const reason = str(req.body?.reason, 200)
    period.history.push(logEntry(`Cancelled${reason ? ` (${reason})` : ''}`))
    await period.save()
    res.json(await memberDetail(period.memberId, todayStr()))
  })

  r.post('/periods/:id/refund', async (req, res) => {
    const period = await getPeriod(req.params.id)
    if (period.status === 'cancelled') fail(409, 'This membership is cancelled')
    const b = req.body || {}
    const amount = moneyOf(b.amount, 'Refund amount')
    if (amount <= 0) fail(400, 'Enter the refund amount')
    const date = paidDateOf(b.date, 'Refund date')
    const m = await moneyFor(period)
    if (amount > m.netPaid) fail(400, `Only ${m.netPaid} has been received, so that is the most you can refund`)
    const today = todayStr()
    await Payment.create({
      memberId: period.memberId,
      periodId: period._id,
      type: 'refund',
      amount,
      date,
      mode: modeOf(b.mode),
      note: str(b.note, 300),
    })
    if (b.after === 'end') {
      // Not started yet: cancel it completely. Already running: it stops today.
      if (period.startDate >= today) period.status = 'cancelled'
      else {
        period.status = 'ended'
        if (period.renewalDate > today) period.renewalDate = today
      }
      period.history.push(logEntry(`Membership ended after refund of ${amount}`))
      await period.save()
      const rest = await Period.find({ memberId: period.memberId }).lean()
      const stillMember = ['active', 'upcoming'].includes(memberState({}, rest, today).status)
      if (!stillMember) {
        await Member.updateOne({ _id: period.memberId }, { hidden: true, hiddenReason: 'Refunded and left', hiddenAt: today })
      }
    }
    res.json(await memberDetail(period.memberId, today))
  })

  r.post('/periods/:id/waive', async (req, res) => {
    const period = await getPeriod(req.params.id)
    if (period.status !== 'ok') fail(409, 'This membership is closed')
    const b = req.body || {}
    if (b.undo) {
      period.history.push(logEntry(`Waiver of ${period.waived} removed`))
      period.waived = 0
    } else {
      const m = await moneyFor(period)
      if (m.balance <= 0) fail(409, 'There is no balance to waive')
      const amount = b.amount == null || b.amount === '' ? m.balance : moneyOf(b.amount, 'Amount')
      if (amount <= 0 || amount > m.balance) fail(400, `Amount must be between 1 and ${m.balance}`)
      period.waived += amount
      const note = str(b.note, 200)
      period.history.push(logEntry(`Balance of ${amount} waived${note ? ` (${note})` : ''}`))
    }
    await period.save()
    res.json(await memberDetail(period.memberId, todayStr()))
  })

  // ---- Payments ----

  r.get('/payments', async (req, res) => {
    const pays = await Payment.find().sort({ date: -1, createdAt: -1 }).limit(300).lean()
    const members = await Member.find({ _id: { $in: pays.map((p) => p.memberId) } }, { name: 1, memberNo: 1 }).lean()
    const names = new Map(members.map((m) => [String(m._id), m]))
    res.json(
      pays.map((p) => ({
        ...out(p),
        memberName: names.get(String(p.memberId))?.name || 'Deleted member',
        memberNo: names.get(String(p.memberId))?.memberNo,
      })),
    )
  })

  r.post('/payments', async (req, res) => {
    const b = req.body || {}
    const period = await getPeriod(b.periodId)
    if (period.status !== 'ok') fail(409, 'This membership is closed, so it cannot take a payment')
    const amount = moneyOf(b.amount, 'Amount')
    if (amount <= 0) fail(400, 'Enter the amount')
    const date = paidDateOf(b.date, 'Payment date')
    const m = await moneyFor(period)
    if (amount > m.balance && !b.force) {
      fail(409, `This is more than the balance of ${m.balance}`, { code: 'OVERPAY', balance: m.balance })
    }
    // When the rest of the balance is promised for a later day.
    if (b.promisedDate !== undefined) {
      period.promisedDate = b.promisedDate ? dateOf(b.promisedDate, 'Promised date') : ''
      await period.save()
    }
    await Payment.create({
      memberId: period.memberId,
      periodId: period._id,
      type: 'payment',
      amount,
      date,
      mode: modeOf(b.mode),
      note: str(b.note, 300),
    })
    res.status(201).json(await memberDetail(period.memberId, todayStr()))
  })

  r.patch('/payments/:id', async (req, res) => {
    const pay = await getPayment(req.params.id)
    const b = req.body || {}
    const changes = []
    const set = (field, value, label) => {
      if (value === pay[field]) return
      changes.push(`${label}: ${show(pay[field])} → ${show(value)}`)
      pay[field] = value
    }
    if (b.amount !== undefined) {
      const amount = moneyOf(b.amount, 'Amount')
      if (amount <= 0) fail(400, 'Enter the amount')
      const period = await getPeriod(String(pay.periodId))
      const others = await moneyFor(period, pay._id)
      if (pay.type === 'refund' && amount > others.netPaid) fail(400, `Refund cannot be more than ${others.netPaid}`)
      if (pay.type === 'payment' && others.netPaid + amount < 0) {
        fail(400, 'A refund was already given against this payment, so it cannot be this small')
      }
      set('amount', amount, 'Amount')
    }
    if (b.date !== undefined) set('date', paidDateOf(b.date, 'Date'), 'Date')
    if (b.mode !== undefined) set('mode', modeOf(b.mode), 'Mode')
    if (b.note !== undefined) pay.note = str(b.note, 300)
    if (changes.length) pay.history.push(logEntry(changes.join('; ')))
    await pay.save()
    res.json(await memberDetail(pay.memberId, todayStr()))
  })

  // Payment was recorded against the wrong member (or the wrong membership).
  r.post('/payments/:id/move', async (req, res) => {
    const pay = await getPayment(req.params.id)
    if (pay.type !== 'payment') fail(400, 'Only payments can be moved')
    const b = req.body || {}
    const target = await getMember(b.memberId)
    const source = await getPeriod(String(pay.periodId))
    if ((await moneyFor(source, pay._id)).netPaid < 0) {
      fail(409, 'A refund was given against this payment. Cancel the refund first.')
    }
    const periods = await Period.find({ memberId: target._id, status: 'ok' }).sort({ startDate: 1 }).lean()
    if (!periods.length) fail(409, `${target.name} has no membership to put this payment against`)
    let dest = b.periodId ? periods.find((p) => String(p._id) === String(b.periodId)) : null
    if (b.periodId && !dest) fail(400, 'Membership not found for that member')
    if (!dest) {
      for (const p of periods) {
        if ((await moneyFor(p)).balance > 0) {
          dest = p
          break
        }
      }
      dest ??= periods.at(-1)
    }
    if (String(dest._id) === String(pay.periodId)) fail(409, 'The payment is already recorded there')
    const from = await Member.findById(pay.memberId).lean()
    pay.history.push(logEntry(`Moved from ${from?.name || 'another member'} to ${target.name}`))
    pay.memberId = target._id
    pay.periodId = dest._id
    await pay.save()
    res.json({ ok: true, memberId: String(target._id) })
  })

  r.post('/payments/:id/void', async (req, res) => {
    const pay = await getPayment(req.params.id)
    if (pay.type === 'payment') {
      const period = await getPeriod(String(pay.periodId))
      if ((await moneyFor(period, pay._id)).netPaid < 0) {
        fail(409, 'A refund was given against this payment. Cancel the refund first.')
      }
    }
    pay.voided = true
    pay.voidReason = str(req.body?.reason, 200)
    pay.history.push(logEntry(`Entry cancelled${pay.voidReason ? ` (${pay.voidReason})` : ''}`))
    await pay.save()
    res.json(await memberDetail(pay.memberId, todayStr()))
  })

  // ---- Backup ----

  r.get('/export/members.csv', async (req, res) => {
    const rows = (await loadSummaries(todayStr())).sort((a, b) => a.memberNo - b.memberNo)
    res.type('text/csv').send(
      toCsv(
        ['No', 'Name', 'Phone', 'Status', 'Plan', 'Renewal date', 'Balance due', 'Joined', 'Hidden', 'Hidden reason'],
        rows.map((s) => [s.memberNo, s.name, s.phone, s.status, s.planName, s.renewalDate, s.balance, s.joinDate, s.hidden ? 'yes' : '', s.hiddenReason]),
      ),
    )
  })

  r.get('/export/payments.csv', async (req, res) => {
    const [pays, members] = await Promise.all([Payment.find().sort({ date: 1, createdAt: 1 }).lean(), Member.find().lean()])
    const byId = new Map(members.map((m) => [String(m._id), m]))
    res.type('text/csv').send(
      toCsv(
        ['Date', 'Member no', 'Member', 'Type', 'Amount', 'Mode', 'Note', 'Cancelled'],
        pays.map((p) => {
          const m = byId.get(String(p.memberId))
          return [p.date, m?.memberNo, m?.name, p.type, p.amount, p.mode, p.note, p.voided ? 'yes' : '']
        }),
      ),
    )
  })

  r.get('/export/backup.json', async (req, res) => {
    const [members, periods, payments, plans] = await Promise.all([
      Member.find().lean(),
      Period.find().lean(),
      Payment.find().lean(),
      Plan.find().lean(),
    ])
    res.json({ exportedAt: new Date().toISOString(), settings: publicSettings(req.settings), members, periods, payments, plans })
  })

  r.use((req, res) => res.status(404).json({ error: 'Not found' }))
  return r
}
