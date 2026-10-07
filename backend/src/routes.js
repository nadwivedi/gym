import express from 'express'
import { PAYMENT_MODES, addMonths, memberAge, memberState, overlaps, todayStr } from '../../shared/domain.mjs'
import { checkPassword, hashPassword, makeToken, newSecret, verifyToken } from './auth.js'
import { toCsv } from './csv.js'
import {
  DEFAULT_STOCK_CATEGORIES,
  Expense,
  ExpenseCategory,
  ExpenseReceipt,
  Member,
  Payment,
  Period,
  Plan,
  Product,
  StockMove,
  getSettings,
  logEntry,
  nextMemberNo,
  out,
} from './db.js'
import { loadSummaries, memberDetail, moneyFor } from './service.js'
import { buildYearStats } from './stats.js'
import { dateOf, fail, idOf, intOf, moneyOf, phoneOf, str } from './validate.js'
import { whatsappRoutes } from './whatsapp/routes.js'

const MAX_LOGIN_FAILS = 5
const LOCK_MS = 60000

const passwordOf = (v) =>
  typeof v === 'string' && v.length >= 6 && v.length <= 100 ? v : fail(400, 'Password must be at least 6 characters')

// "+91 98765 43210", "098765 43210" and "9876543210" are all the same login.
function loginMobileOf(v) {
  let digits = String(v ?? '').replace(/[^\d]/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return digits.length === 10 ? digits : fail(400, 'Enter a 10-digit mobile number')
}

function setPassword(s, password) {
  const { salt, hash } = hashPassword(password)
  s.passSalt = salt
  s.passHash = hash
}
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
  loginMobile: s.loginMobile,
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

// Optional personal details of a member: address, date of birth, age.
// `current` is the member being edited (absent for a new admission).
function personalFields(b, current) {
  const today = todayStr()
  const f = {}
  if (b.address !== undefined) f.address = str(b.address, 300)
  if (b.dob === undefined && b.age === undefined) return f
  const dob = b.dob ? dateOf(b.dob, 'Date of birth') : ''
  if (dob && (dob > today || dob < '1900-01-01')) fail(400, 'Date of birth is not valid')
  f.dob = dob
  if (dob || b.age === '' || b.age == null) {
    // With a date of birth the age is worked out, never stored.
    f.age = null
    f.ageOn = ''
  } else {
    const age = intOf(b.age, 'Age', 1, 120)
    // Saving the form again without touching the age must not restart its clock.
    if (!current || current.dob || memberAge(current, today) !== age) {
      f.age = age
      f.ageOn = today
    }
  }
  return f
}

const loadCategories = () => ExpenseCategory.find().sort({ order: 1, createdAt: 1 }).lean()

async function getExpense(id) {
  return (await Expense.findById(idOf(id))) || fail(404, 'Expense not found')
}

async function categoryNameOf(v, exceptId) {
  const name = str(v, 40) || fail(400, 'Category name is required')
  const all = await ExpenseCategory.find({ _id: { $ne: exceptId } }, { name: 1 }).lean()
  if (all.some((c) => c.name.toLowerCase() === name.toLowerCase())) fail(409, `There is already a category called ${name}`)
  return name
}

// Fields of an expense that the request sets; every field is required when creating.
async function expenseFields(b, creating) {
  const f = {}
  if (creating || b.amount !== undefined) {
    f.amount = moneyOf(b.amount, 'Amount')
    if (f.amount <= 0) fail(400, 'Enter the amount')
  }
  if (creating || b.date !== undefined) f.date = paidDateOf(b.date, 'Expense date')
  if (creating || b.categoryId !== undefined) {
    const category = (await ExpenseCategory.findById(idOf(b.categoryId)).lean()) || fail(400, 'Choose a category')
    f.categoryId = category._id
  }
  if (b.mode !== undefined) f.mode = modeOf(b.mode)
  if (b.note !== undefined) f.note = str(b.note, 300)
  if (b.name !== undefined) f.name = str(b.name, 80)
  if (b.paidTo !== undefined) f.paidTo = str(b.paidTo, 80)
  if (b.invoiceNo !== undefined) f.invoiceNo = str(b.invoiceNo, 40)
  if (b.status !== undefined) f.status = b.status === 'pending' ? 'pending' : 'paid'
  return f
}

// A receipt is a photo or a PDF, sent as the body of the request.
const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const receiptBody = express.raw({ type: () => true, limit: '8mb' })

const round2 = (n) => Math.round(n * 100) / 100

async function getProduct(id) {
  return (await Product.findById(idOf(id))) || fail(404, 'Product not found')
}

// out: nothing left. low: at or below the owner's warning level.
const productOut = (p) => ({ ...out(p), status: p.stock <= 0 ? 'out' : p.stock <= p.lowStock ? 'low' : 'ok' })

// Fields of a product that the request sets. The stock count is changed only through stock moves.
async function productFields(b, current) {
  const f = {}
  if (!current || b.name !== undefined) {
    const name = str(b.name, 60) || fail(400, 'Product name is required')
    const others = await Product.find({ _id: { $ne: current?._id } }, { name: 1 }).lean()
    if (others.some((p) => p.name.toLowerCase() === name.toLowerCase())) fail(409, `There is already a product called ${name}`)
    f.name = name
  }
  if (!current || b.category !== undefined) f.category = str(b.category, 40) || 'Other'
  if (!current || b.sellPrice !== undefined) f.sellPrice = moneyOf(b.sellPrice ?? 0, 'Selling price')
  if (b.buyPrice !== undefined) f.buyPrice = moneyOf(b.buyPrice, 'Buying price')
  if (b.lowStock !== undefined) f.lowStock = intOf(b.lowStock, 'Low stock warning', 0, 100000)
  if (b.active !== undefined) f.active = !!b.active
  return f
}

const OPENING_STOCK = 'Opening stock'
const isOpening = (m) => m.type === 'adjust' && m.note === OPENING_STOCK

const stockCategories = (used) => [...new Set([...DEFAULT_STOCK_CATEGORIES, ...used])]

// Sets the stock count to what the owner counted, recording the difference (no money involved).
async function setStockCount(product, count, note) {
  const diff = count - product.stock
  if (!diff) return
  await StockMove.create({ productId: product._id, type: 'adjust', qty: diff, date: todayStr(), note })
  await Product.updateOne({ _id: product._id }, { $inc: { stock: diff } })
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
  // Wrong passwords lock the login for a minute after a few tries.
  let fails = 0
  let lockedUntil = 0
  const checkNotLocked = () => Date.now() < lockedUntil && fail(429, 'Too many wrong tries. Wait one minute and try again.')
  const wrongTry = (message) => {
    if (++fails >= MAX_LOGIN_FAILS) {
      fails = 0
      lockedUntil = Date.now() + LOCK_MS
    }
    fail(401, message)
  }

  r.get('/auth/status', async (req, res) => {
    const s = await getSettings()
    res.json({ accountSet: !!s.passHash, gymName: s.gymName })
  })

  // First visit: the mobile number and password typed become the login. A gym's old PIN is dropped.
  r.post('/auth/setup', async (req, res) => {
    const s = await getSettings()
    if (s.passHash) fail(409, 'An account already exists. Please log in.')
    s.loginMobile = loginMobileOf(req.body?.mobile)
    setPassword(s, passwordOf(req.body?.password))
    s.pinHash = ''
    s.pinSalt = ''
    await s.save()
    res.json({ token: makeToken(s.secret) })
  })

  r.post('/auth/login', async (req, res) => {
    checkNotLocked()
    const s = await getSettings()
    const mobile = loginMobileOf(req.body?.mobile)
    if (mobile !== s.loginMobile || !checkPassword(String(req.body?.password ?? ''), s.passSalt, s.passHash)) {
      wrongTry('Wrong mobile number or password')
    }
    fails = 0
    res.json({ token: makeToken(s.secret) })
  })

  // Everything below needs a valid login.
  r.use(async (req, res, next) => {
    const s = await getSettings()
    const token = (req.headers.authorization || '').replace(/^Bearer /, '')
    if (!s.passHash || !verifyToken(s.secret, token)) fail(401, 'Please log in')
    req.settings = s
    next()
  })

  // Change the login mobile number and/or password. Signs every other device out.
  r.post('/auth/change-login', async (req, res) => {
    const s = req.settings
    if (!checkPassword(String(req.body?.currentPassword ?? ''), s.passSalt, s.passHash)) fail(400, 'Current password is wrong')
    s.loginMobile = loginMobileOf(req.body?.mobile)
    if (req.body?.newPassword) setPassword(s, passwordOf(req.body.newPassword))
    s.secret = newSecret()
    await s.save()
    res.json({ token: makeToken(s.secret), loginMobile: s.loginMobile })
  })

  r.get('/bootstrap', async (req, res) => {
    const [plans, expenseCategories] = await Promise.all([Plan.find().sort({ months: 1, name: 1 }).lean(), loadCategories()])
    res.json({
      today: todayStr(),
      settings: publicSettings(req.settings),
      plans: plans.map(out),
      expenseCategories: expenseCategories.map(out),
      modes: PAYMENT_MODES,
    })
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
    const inYear = { $gte: `${year}-01-01`, $lt: `${year + 1}-01-01` }
    const shopMoves = { type: { $in: ['buy', 'sell'] } }
    const [payments, expenses, stockMoves, categories, firstExpense, firstShopMove, periods, rows, firstPayment, firstPeriod] = await Promise.all([
      Payment.find({ voided: { $ne: true }, date: inYear }).lean(),
      Expense.find({ date: inYear }).lean(),
      StockMove.find({ ...shopMoves, date: inYear }, { type: 1, amount: 1, date: 1, mode: 1 }).lean(),
      loadCategories(),
      Expense.findOne().sort({ date: 1 }).lean(),
      StockMove.findOne(shopMoves).sort({ date: 1 }).lean(),
      Period.find({ status: { $ne: 'cancelled' } }, { memberId: 1, startDate: 1, renewalDate: 1, kind: 1 }).lean(),
      loadSummaries(today),
      Payment.findOne({ voided: { $ne: true } }).sort({ date: 1 }).lean(),
      Period.findOne({ status: { $ne: 'cancelled' } }).sort({ startDate: 1 }).lean(),
    ])
    const names = new Map(categories.map((c) => [String(c._id), c.name]))
    for (const e of expenses) e.category = names.get(String(e.categoryId)) || 'Other'
    const stats = buildYearStats({ year, today, payments, periods, expenses, stockMoves })
    const active = rows.filter((s) => s.status === 'active' && !s.hidden).length
    // The current month shows the same count as the "active members" tile.
    if (year === thisYear) stats.months[Number(today.slice(5, 7)) - 1].active = active
    const dues = rows.filter((s) => s.balance > 0)
    const firstYear = Math.min(thisYear, ...[firstPayment?.date, firstPeriod?.startDate, firstExpense?.date, firstShopMove?.date].filter(Boolean).map((d) => Number(d.slice(0, 4))))
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
      ...personalFields(b),
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
    member.set(personalFields(b, member))
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

  // A membership entered by mistake: remove it completely, with every payment and refund recorded
  // on it. This is the one place money records are really deleted, so the word "delete" must be sent.
  r.delete('/periods/:id', async (req, res) => {
    const period = await getPeriod(req.params.id)
    if (String(req.body?.confirm ?? '').trim().toLowerCase() !== 'delete') fail(400, 'Type delete to confirm')
    const removed = await Payment.deleteMany({ periodId: period._id })
    await period.deleteOne()
    res.json({ ...(await memberDetail(period.memberId, todayStr())), deletedPayments: removed.deletedCount })
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

  // ---- Expenses ----

  // One month of expenses, newest first, with a total per category.
  r.get('/expenses', async (req, res) => {
    const month = typeof req.query.month === 'string' && /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : ''
    const from = dateOf(`${month}-01`, 'Month')
    const [items, categories] = await Promise.all([
      Expense.find({ date: { $gte: from, $lt: addMonths(from, 1) } }).sort({ date: -1, createdAt: -1 }).lean(),
      loadCategories(),
    ])
    const names = new Map(categories.map((c) => [String(c._id), c.name]))
    const totals = new Map()
    for (const e of items) totals.set(String(e.categoryId), (totals.get(String(e.categoryId)) || 0) + e.amount)
    const round = (n) => Math.round(n * 100) / 100
    res.json({
      month,
      total: round(items.reduce((sum, e) => sum + e.amount, 0)),
      byCategory: [...totals].map(([id, total]) => ({ id, name: names.get(id) || 'Other', total: round(total) })).sort((a, b) => b.total - a.total),
      items: items.map((e) => ({ ...out(e), category: names.get(String(e.categoryId)) || 'Other' })),
    })
  })

  r.post('/expenses', async (req, res) => {
    const expense = await Expense.create(await expenseFields(req.body || {}, true))
    res.status(201).json(out(expense))
  })

  r.patch('/expenses/:id', async (req, res) => {
    const expense = await getExpense(req.params.id)
    expense.set(await expenseFields(req.body || {}, false))
    await expense.save()
    res.json(out(expense))
  })

  r.delete('/expenses/:id', async (req, res) => {
    const expense = await getExpense(req.params.id)
    await ExpenseReceipt.deleteOne({ expenseId: expense._id })
    await expense.deleteOne()
    res.json({ ok: true })
  })

  // Attach a receipt to an expense, replacing the one already there. ?name= is the file's name.
  r.put('/expenses/:id/receipt', receiptBody, async (req, res) => {
    const expense = await getExpense(req.params.id)
    const mime = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase()
    if (!RECEIPT_TYPES.includes(mime)) fail(400, 'A receipt must be a JPG, PNG or WebP photo, or a PDF')
    if (!Buffer.isBuffer(req.body) || !req.body.length) fail(400, 'The receipt file is empty')
    await ExpenseReceipt.findOneAndUpdate({ expenseId: expense._id }, { mime, data: req.body }, { upsert: true })
    expense.receiptName = str(req.query.name, 120) || 'receipt'
    expense.receiptSize = req.body.length
    await expense.save()
    res.json(out(expense))
  })

  r.get('/expenses/:id/receipt', async (req, res) => {
    const expense = await getExpense(req.params.id)
    const receipt = (await ExpenseReceipt.findOne({ expenseId: expense._id }).lean()) || fail(404, 'This expense has no receipt')
    // lean() hands the file back as a BSON Binary, not a Buffer.
    res.type(receipt.mime).send(Buffer.isBuffer(receipt.data) ? receipt.data : receipt.data.buffer)
  })

  r.delete('/expenses/:id/receipt', async (req, res) => {
    const expense = await getExpense(req.params.id)
    await ExpenseReceipt.deleteOne({ expenseId: expense._id })
    expense.receiptName = ''
    expense.receiptSize = 0
    await expense.save()
    res.json(out(expense))
  })

  r.post('/expense-categories', async (req, res) => {
    const name = await categoryNameOf(req.body?.name)
    const last = await ExpenseCategory.findOne().sort({ order: -1 }).lean()
    const category = await ExpenseCategory.create({ name, order: (last?.order ?? -1) + 1 })
    res.status(201).json(out(category))
  })

  // Rename a category or switch it off. Categories are never deleted, so old expenses keep their name.
  r.patch('/expense-categories/:id', async (req, res) => {
    const category = (await ExpenseCategory.findById(idOf(req.params.id))) || fail(404, 'Category not found')
    const b = req.body || {}
    if (b.name !== undefined) category.name = await categoryNameOf(b.name, category._id)
    if (b.active !== undefined) category.active = !!b.active
    await category.save()
    res.json(out(category))
  })

  // ---- Stock: things the gym sells (protein, creatine, T-shirts …) ----

  r.get('/stock', async (req, res) => {
    const products = await Product.find().sort({ category: 1, name: 1 }).lean()
    const selling = products.filter((p) => p.active)
    const sum = (fn) => round2(selling.reduce((total, p) => total + fn(p), 0))
    res.json({
      products: products.map(productOut),
      categories: stockCategories(products.map((p) => p.category)),
      totals: {
        units: sum((p) => Math.max(p.stock, 0)),
        value: sum((p) => Math.max(p.stock, 0) * p.sellPrice),
        low: selling.filter((p) => p.stock > 0 && p.stock <= p.lowStock).length,
        out: selling.filter((p) => p.stock <= 0).length,
      },
    })
  })

  // Stock ledger of one product: every buy, sale and count change with the stock left after it, newest first.
  r.get('/stock/products/:id/ledger', async (req, res) => {
    const product = await getProduct(req.params.id)
    const [moves, used] = await Promise.all([
      StockMove.find({ productId: product._id }).sort({ date: 1, createdAt: 1 }).lean(),
      Product.distinct('category'),
    ])
    // Opening stock comes first even when an older bill is entered later.
    moves.sort((a, b) => isOpening(b) - isOpening(a))
    let balance = 0
    const rows = moves.map((m) => {
      balance += m.type === 'sell' ? -m.qty : m.qty
      return { ...out(m), product: product.name, balance }
    })
    const sells = moves.filter((m) => m.type === 'sell')
    const buys = moves.filter((m) => m.type === 'buy')
    const total = (list, fn) => round2(list.reduce((sum, m) => sum + fn(m), 0))
    res.json({
      product: productOut(product.toObject()),
      categories: stockCategories(used),
      totals: {
        boughtUnits: total(buys, (m) => m.qty),
        bought: total(buys, (m) => m.amount),
        soldUnits: total(sells, (m) => m.qty),
        sold: total(sells, (m) => m.amount),
        profit: total(sells, (m) => m.amount - m.unitCost * m.qty),
        adjusted: total(moves.filter((m) => m.type === 'adjust'), (m) => m.qty),
      },
      rows: rows.reverse(),
    })
  })

  // A new product. `stock` is what is already on the shelf (opening stock, no money).
  r.post('/stock/products', async (req, res) => {
    const b = req.body || {}
    const product = await Product.create(await productFields(b, null))
    if (b.stock !== undefined && b.stock !== '') await setStockCount(product, intOf(b.stock, 'Stock', 0, 100000), OPENING_STOCK)
    res.status(201).json(productOut(await Product.findById(product._id).lean()))
  })

  // Edit a product; a new `stock` value corrects the count (damaged, lost, miscounted).
  r.patch('/stock/products/:id', async (req, res) => {
    const b = req.body || {}
    const product = await getProduct(req.params.id)
    product.set(await productFields(b, product))
    await product.save()
    if (b.stock !== undefined && b.stock !== '') await setStockCount(product, intOf(b.stock, 'Stock', 0, 100000), 'Count corrected')
    res.json(productOut(await Product.findById(product._id).lean()))
  })

  // Buy stock (money out, stock up) or sell to a customer (money in, stock down).
  r.post('/stock/moves', async (req, res) => {
    const b = req.body || {}
    const type = b.type === 'buy' || b.type === 'sell' ? b.type : fail(400, 'Choose buy or sell')
    const product = await getProduct(b.productId)
    const qty = intOf(b.qty, 'Quantity', 1, 100000)
    const unitPrice = moneyOf(b.unitPrice, type === 'buy' ? 'Cost per piece' : 'Price per piece')
    const move = {
      productId: product._id,
      type,
      qty,
      unitPrice,
      amount: round2(qty * unitPrice),
      date: paidDateOf(b.date, 'Date'),
      mode: modeOf(b.mode),
      note: str(b.note, 300),
    }
    if (type === 'sell') {
      move.customer = str(b.customer, 60)
      move.unitCost = product.buyPrice
      // Takes the pieces only if they are there, even when two phones sell at the same time.
      const taken = await Product.findOneAndUpdate({ _id: product._id, stock: { $gte: qty } }, { $inc: { stock: -qty } })
      if (!taken) fail(409, product.stock > 0 ? `Only ${product.stock} ${product.name} left in stock` : `${product.name} is out of stock`)
    } else {
      await Product.updateOne({ _id: product._id }, { $inc: { stock: qty }, ...(unitPrice > 0 && { $set: { buyPrice: unitPrice } }) })
    }
    res.status(201).json(out(await StockMove.create(move)))
  })

  // Undo a wrong entry: its pieces go back (sell) or come off the shelf again (buy / count change).
  r.delete('/stock/moves/:id', async (req, res) => {
    const move = (await StockMove.findById(idOf(req.params.id))) || fail(404, 'Entry not found')
    const change = move.type === 'sell' ? move.qty : -move.qty
    if (change < 0) {
      const ok = await Product.findOneAndUpdate({ _id: move.productId, stock: { $gte: -change } }, { $inc: { stock: change } })
      if (!ok) fail(409, 'Some of these pieces are already sold, so this entry cannot be deleted. Correct the stock count on the product instead.')
    } else {
      await Product.updateOne({ _id: move.productId }, { $inc: { stock: change } })
    }
    await move.deleteOne()
    res.json({ ok: true })
  })

  // One month of buys, sells and count changes, newest first, with totals.
  r.get('/stock/moves', async (req, res) => {
    const month = typeof req.query.month === 'string' && /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : ''
    const from = dateOf(`${month}-01`, 'Month')
    const [items, products] = await Promise.all([
      StockMove.find({ date: { $gte: from, $lt: addMonths(from, 1) } }).sort({ date: -1, createdAt: -1 }).lean(),
      Product.find({}, { name: 1 }).lean(),
    ])
    const names = new Map(products.map((p) => [String(p._id), p.name]))
    const sells = items.filter((m) => m.type === 'sell')
    const buys = items.filter((m) => m.type === 'buy')
    const total = (list, fn) => round2(list.reduce((sum, m) => sum + fn(m), 0))
    res.json({
      month,
      totals: {
        sold: total(sells, (m) => m.amount),
        soldUnits: total(sells, (m) => m.qty),
        profit: total(sells, (m) => m.amount - m.unitCost * m.qty),
        noCost: sells.some((m) => !m.unitCost), // some sales have no cost price, so their profit is the full price
        bought: total(buys, (m) => m.amount),
        boughtUnits: total(buys, (m) => m.qty),
      },
      items: items.map((m) => ({ ...out(m), product: names.get(String(m.productId)) || 'Unknown product' })),
    })
  })

  // ---- Backup ----

  r.get('/export/members.csv', async (req, res) => {
    const today = todayStr()
    const [summaries, members] = await Promise.all([loadSummaries(today), Member.find({}, { address: 1, dob: 1, age: 1, ageOn: 1 }).lean()])
    const personal = new Map(members.map((m) => [String(m._id), m]))
    const rows = summaries.sort((a, b) => a.memberNo - b.memberNo)
    res.type('text/csv').send(
      toCsv(
        ['No', 'Name', 'Phone', 'Status', 'Plan', 'Renewal date', 'Balance due', 'Joined', 'Hidden', 'Hidden reason', 'Date of birth', 'Age', 'Address'],
        rows.map((s) => {
          const m = personal.get(s.id) || {}
          return [s.memberNo, s.name, s.phone, s.status, s.planName, s.renewalDate, s.balance, s.joinDate, s.hidden ? 'yes' : '', s.hiddenReason, m.dob, memberAge(m, today), m.address]
        }),
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

  r.get('/export/expenses.csv', async (req, res) => {
    const [expenses, categories] = await Promise.all([Expense.find().sort({ date: 1, createdAt: 1 }).lean(), loadCategories()])
    const names = new Map(categories.map((c) => [String(c._id), c.name]))
    res.type('text/csv').send(
      toCsv(
        ['Date', 'Category', 'Amount', 'Mode', 'Note', 'Name', 'Paid to', 'Invoice no', 'Status', 'Receipt'],
        expenses.map((e) => [e.date, names.get(String(e.categoryId)) || 'Other', e.amount, e.mode, e.note, e.name, e.paidTo, e.invoiceNo, e.status || 'paid', e.receiptName ? 'yes' : '']),
      ),
    )
  })

  r.get('/export/stock.csv', async (req, res) => {
    const [moves, products] = await Promise.all([StockMove.find().sort({ date: 1, createdAt: 1 }).lean(), Product.find().lean()])
    const byId = new Map(products.map((p) => [String(p._id), p]))
    const kind = { buy: 'Bought', sell: 'Sold', adjust: 'Count change' }
    res.type('text/csv').send(
      toCsv(
        ['Date', 'Type', 'Product', 'Category', 'Quantity', 'Price per piece', 'Amount', 'Mode', 'Customer', 'Note'],
        moves.map((m) => {
          const p = byId.get(String(m.productId))
          const money = m.type !== 'adjust'
          return [m.date, kind[m.type], p?.name, p?.category, m.qty, money ? m.unitPrice : '', money ? m.amount : '', money ? m.mode : '', m.customer, m.note]
        }),
      ),
    )
  })

  r.get('/export/backup.json', async (req, res) => {
    const [members, periods, payments, plans, expenses, expenseCategories, products, stockMoves] = await Promise.all([
      Member.find().lean(),
      Period.find().lean(),
      Payment.find().lean(),
      Plan.find().lean(),
      Expense.find().lean(),
      ExpenseCategory.find().lean(),
      Product.find().lean(),
      StockMove.find().lean(),
    ])
    res.json({
      exportedAt: new Date().toISOString(),
      settings: publicSettings(req.settings),
      members,
      periods,
      payments,
      plans,
      expenses,
      expenseCategories,
      products,
      stockMoves,
    })
  })

  r.use('/whatsapp', whatsappRoutes())

  r.use((req, res) => res.status(404).json({ error: 'Not found' }))
  return r
}
