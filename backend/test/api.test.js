// End-to-end API tests. They use a separate database (gymsoft_test) that is wiped on every run.
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import mongoose from 'mongoose'
import { addDays, addMonths, todayStr } from '../../shared/domain.mjs'
import { createApp } from '../src/app.js'
import { seedPlans } from '../src/db.js'

const TEST_DB = process.env.MONGO_TEST_URL || 'mongodb://127.0.0.1:27017/gymsoft_test'
const today = todayStr()
let server
let base
let token = ''
let plans

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  return { status: res.status, data: res.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text }
}

async function ok(method, path, body) {
  const res = await call(method, path, body)
  assert.ok(res.status < 300, `${method} ${path} -> ${res.status} ${JSON.stringify(res.data)}`)
  return res.data
}

const plan = (months) => plans.find((p) => p.months === months)

async function admit(name, { months = 1, startDate = today, fee = 1000, admissionFee = 0, paid, phone = '' } = {}) {
  return ok('POST', '/members', {
    name,
    phone,
    membership: { planId: plan(months).id, startDate, fee, admissionFee },
    payment: paid ? { amount: paid, date: today, mode: 'Cash' } : undefined,
  })
}

before(async () => {
  await mongoose.connect(TEST_DB)
  await mongoose.connection.dropDatabase()
  await seedPlans()
  server = createApp().listen(0)
  base = `http://127.0.0.1:${server.address().port}/api`
})

after(async () => {
  server.close()
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

test('PIN: setup, wrong PIN, login, and locked routes', async () => {
  assert.equal((await call('GET', '/members')).status, 401)
  assert.equal((await call('POST', '/auth/setup', { pin: '12' })).status, 400)
  token = (await ok('POST', '/auth/setup', { pin: '1234', gymName: 'Test Gym' })).token
  assert.equal((await call('POST', '/auth/setup', { pin: '9999' })).status, 409)
  assert.equal((await call('POST', '/auth/login', { pin: '0000' })).status, 401)
  token = (await ok('POST', '/auth/login', { pin: '1234' })).token
  const boot = await ok('GET', '/bootstrap')
  plans = boot.plans
  assert.equal(boot.settings.gymName, 'Test Gym')
  assert.equal(plans.length, 4)
})

test('admission: start date in the future, part payment, then more part payments', async () => {
  const start = addDays(today, 5)
  const d = await admit('Future Fiona', { startDate: start, fee: 3000, admissionFee: 500, paid: 1000, months: 3 })
  assert.equal(d.summary.status, 'upcoming')
  assert.equal(d.summary.bucket, 'starting')
  assert.equal(d.summary.renewalDate, addMonths(start, 3))
  assert.equal(d.summary.balance, 2500)
  assert.equal(d.payments[0].date, today) // payment date differs from the start date

  const periodId = d.periods[0].id
  // Part payment, with the rest promised for a later day.
  const promised = addDays(today, 7)
  let r = await ok('POST', '/payments', { periodId, amount: 1500, date: today, mode: 'UPI', promisedDate: promised })
  assert.equal(r.summary.balance, 1000)
  assert.equal(r.summary.promisedDate, promised)
  const over = await call('POST', '/payments', { periodId, amount: 5000, date: today })
  assert.equal(over.status, 409)
  assert.equal(over.data.code, 'OVERPAY')
  r = await ok('POST', '/payments', { periodId, amount: 1000, date: today })
  assert.equal(r.summary.balance, 0)
  assert.equal(r.payments.length, 3)
})

test('admission: no payment at all, then the balance is waived', async () => {
  const d = await admit('Nopay Nikhil', { fee: 1200 })
  assert.equal(d.summary.balance, 1200)
  assert.equal(d.summary.status, 'active')
  const w = await ok('POST', `/periods/${d.periods[0].id}/waive`, { note: 'will not pay' })
  assert.equal(w.summary.balance, 0)
  assert.equal(w.periods[0].waived, 1200)
  const undo = await ok('POST', `/periods/${d.periods[0].id}/waive`, { undo: true })
  assert.equal(undo.summary.balance, 1200)
})

test('duplicate phone is flagged, and can be forced', async () => {
  await admit('Phone One', { phone: '98765 43210' })
  const dup = await call('POST', '/members', { name: 'Phone Two', phone: '9876543210', membership: { planId: plan(1).id, startDate: today, fee: 1 } })
  assert.equal(dup.status, 409)
  assert.equal(dup.data.code, 'DUPLICATE')
  const forced = await ok('POST', '/members', { name: 'Phone Two', phone: '9876543210', force: true, membership: { planId: plan(1).id, startDate: today, fee: 1 } })
  assert.equal(forced.member.phone, '9876543210')
})

test('joining date changed after payment: renewal date moves, payment stays', async () => {
  const d = await admit('Shift Shreya', { fee: 1000, paid: 1000 })
  const newStart = addDays(today, 10)
  const e = await ok('PATCH', `/periods/${d.periods[0].id}`, { startDate: newStart, reason: 'asked to start later' })
  assert.equal(e.periods[0].startDate, newStart)
  assert.equal(e.periods[0].renewalDate, addMonths(newStart, 1))
  assert.equal(e.payments[0].date, today)
  assert.equal(e.summary.balance, 0)
  assert.equal(e.periods[0].history.length, 1)

  // Renewal date changed by hand.
  const manual = addDays(newStart, 45)
  const m = await ok('PATCH', `/periods/${d.periods[0].id}`, { renewalDate: manual, reason: 'holiday' })
  assert.equal(m.summary.renewalDate, manual)
  const bad = await call('PATCH', `/periods/${d.periods[0].id}`, { renewalDate: newStart })
  assert.equal(bad.status, 400)
})

test('renew before expiry continues from the renewal date; overlap is blocked', async () => {
  const start = addDays(today, -20)
  const d = await admit('Early Esha', { startDate: start, fee: 1000, paid: 1000 })
  const renewal = d.summary.renewalDate
  const overlap = await call('POST', `/members/${d.member.id}/periods`, { planId: plan(6).id, startDate: today, fee: 5000 })
  assert.equal(overlap.status, 409)
  assert.equal(overlap.data.code, 'OVERLAP')
  const r = await ok('POST', `/members/${d.member.id}/periods`, {
    planId: plan(6).id,
    startDate: renewal,
    fee: 5000,
    payment: { amount: 5000, date: today, mode: 'UPI' },
  })
  assert.equal(r.summary.status, 'active')
  assert.equal(r.summary.renewalDate, addMonths(renewal, 6))
  assert.equal(r.periods.length, 2)

  // Renews early but asks to start later: a gap is allowed.
  const later = addDays(r.summary.renewalDate, 14)
  const g = await ok('POST', `/members/${d.member.id}/periods`, { planId: plan(1).id, startDate: later, fee: 1000 })
  assert.equal(g.summary.renewalDate, addMonths(later, 1))
})

test('late renewal: from the old date or from today; then hide and rejoin', async () => {
  const start = addDays(today, -50)
  const d = await admit('Late Lokesh', { startDate: start, fee: 1000, paid: 1000 })
  const old = d.summary.renewalDate
  assert.equal(d.summary.bucket, 'overdue')
  assert.ok(d.summary.daysLeft < 0)

  const dash = await ok('GET', '/dashboard')
  assert.ok(dash.buckets.overdue.some((s) => s.id === d.member.id))

  const h = await ok('POST', `/members/${d.member.id}/hide`, { reason: 'not coming' })
  assert.equal(h.summary.bucket, 'hidden')
  const dash2 = await ok('GET', '/dashboard')
  assert.ok(!dash2.buckets.overdue.some((s) => s.id === d.member.id))
  assert.ok(dash2.buckets.hidden.some((s) => s.id === d.member.id))

  // Rejoin with a new join date brings them back.
  const r = await ok('POST', `/members/${d.member.id}/periods`, { planId: plan(1).id, startDate: today, fee: 1000 })
  assert.equal(r.member.hidden, false)
  assert.equal(r.summary.status, 'active')
  assert.equal(r.periods[0].kind, 'rejoin')
  assert.equal(r.summary.renewalDate, addMonths(today, 1))

  // Another late member renews from the OLD date instead.
  const d2 = await admit('Late Lata', { startDate: start, fee: 1000, paid: 1000 })
  const r2 = await ok('POST', `/members/${d2.member.id}/periods`, { planId: plan(1).id, startDate: old, fee: 1000 })
  assert.equal(r2.summary.renewalDate, addMonths(old, 1))
})

test('payment on the wrong member is moved; wrong date and amount are corrected', async () => {
  const a = await admit('Wrong Wasim', { fee: 1000, paid: 1000 })
  const b = await admit('Right Riya', { fee: 1000 })
  const payId = a.payments[0].id
  const moved = await ok('POST', `/payments/${payId}/move`, { memberId: b.member.id })
  assert.equal(moved.memberId, b.member.id)
  assert.equal((await ok('GET', `/members/${a.member.id}`)).summary.balance, 1000)
  const right = await ok('GET', `/members/${b.member.id}`)
  assert.equal(right.summary.balance, 0)
  assert.match(right.payments[0].history[0].text, /Moved from Wrong Wasim to Right Riya/)

  const fixed = await ok('PATCH', `/payments/${payId}`, { date: addDays(today, -3), amount: 800 })
  assert.equal(fixed.payments[0].date, addDays(today, -3))
  assert.equal(fixed.summary.balance, 200)
  assert.equal(fixed.payments[0].history.length, 2)

  const voided = await ok('POST', `/payments/${payId}/void`, { reason: 'entered twice' })
  assert.equal(voided.summary.balance, 1000)
  assert.equal(voided.payments[0].voided, true)
  assert.equal((await call('POST', `/payments/${payId}/void`)).status, 409)
})

test('full refund ends the membership and hides the member', async () => {
  const d = await admit('Refund Rahul', { startDate: addDays(today, -10), fee: 2000, paid: 2000, months: 3 })
  const pid = d.periods[0].id
  assert.equal((await call('POST', `/periods/${pid}/refund`, { amount: 2500, date: today })).status, 400)
  assert.equal((await call('POST', `/periods/${pid}/cancel`)).status, 409) // has payments
  const r = await ok('POST', `/periods/${pid}/refund`, { amount: 2000, date: today, after: 'end' })
  assert.equal(r.periods[0].status, 'ended')
  assert.equal(r.periods[0].renewalDate, today)
  assert.equal(r.periods[0].netPaid, 0)
  assert.equal(r.summary.balance, 0)
  assert.equal(r.member.hidden, true)
  assert.equal((await call('POST', '/payments', { periodId: pid, amount: 100, date: today })).status, 409)
})

test('partial refund: membership can continue with no new due', async () => {
  const d = await admit('Partial Priya', { fee: 3000, paid: 3000, months: 3 })
  const r = await ok('POST', `/periods/${d.periods[0].id}/refund`, { amount: 500, date: today, after: 'continue', note: 'goodwill' })
  assert.equal(r.periods[0].status, 'ok')
  assert.equal(r.periods[0].refunded, 500)
  assert.equal(r.periods[0].netPaid, 2500)
  assert.equal(r.summary.balance, 0)
  assert.equal(r.summary.status, 'active')
  assert.equal(r.member.hidden, false)
  // The payment cannot be cancelled while a refund depends on it.
  const pay = r.payments.find((p) => p.type === 'payment')
  assert.equal((await call('POST', `/payments/${pay.id}/void`)).status, 409)
})

test('refund before the start date cancels the membership', async () => {
  const d = await admit('Never Neha', { startDate: addDays(today, 7), fee: 1500, paid: 500 })
  const r = await ok('POST', `/periods/${d.periods[0].id}/refund`, { amount: 500, date: today, after: 'end' })
  assert.equal(r.periods[0].status, 'cancelled')
  assert.equal(r.summary.status, 'none')
  assert.equal(r.summary.balance, 0)
})

test('members can be deleted only when they have no payments', async () => {
  const paid = await admit('Keep Kiran', { paid: 500 })
  assert.equal((await call('DELETE', `/members/${paid.member.id}`)).status, 409)
  const typo = await admit('Typo Tina')
  await ok('DELETE', `/members/${typo.member.id}`)
  assert.equal((await call('GET', `/members/${typo.member.id}`)).status, 404)
})

test('bad input is rejected', async () => {
  const m = { planId: plan(1).id, startDate: today, fee: 100 }
  assert.equal((await call('POST', '/members', { name: '', membership: m })).status, 400)
  assert.equal((await call('POST', '/members', { name: 'X', membership: { ...m, startDate: '2026-02-31' } })).status, 400)
  assert.equal((await call('POST', '/members', { name: 'X', membership: { ...m, fee: -5 } })).status, 400)
  assert.equal((await call('POST', '/members', { name: 'X', membership: m, payment: { amount: 500, date: today } })).status, 400)
  for (const phone of ['98765432101', '987654321']) {
    const res = await call('POST', '/members', { name: 'X', phone, membership: m })
    assert.equal(res.status, 400)
    assert.match(res.data.error, /10 digits/)
  }
  const future = await call('POST', '/members', { name: 'X', membership: m, payment: { amount: 50, date: addDays(today, 1) } })
  assert.equal(future.status, 400)
  assert.match(future.data.error, /Payment date cannot be in the future/)
  assert.equal((await call('GET', '/members/not-an-id')).status, 400)
  assert.equal((await call('POST', '/payments', { periodId: { $ne: null }, amount: 5, date: today })).status, 400)
})

test('dashboard stats follow payments and refunds', async () => {
  const month = Number(today.slice(5, 7)) - 1
  const before = await ok('GET', '/stats')
  assert.equal(before.year, Number(today.slice(0, 4)))
  assert.equal(before.months.length, 12)
  assert.equal(before.members.active, (await ok('GET', '/dashboard')).stats.active)
  assert.equal(before.months[month].active, before.members.active)

  const d = await admit('Stats Sita', { fee: 2000 })
  await ok('POST', '/payments', { periodId: d.periods[0].id, amount: 777, date: today, mode: 'UPI' })
  await ok('POST', `/periods/${d.periods[0].id}/refund`, { amount: 100, date: today, after: 'continue' })
  const after = await ok('GET', '/stats')
  const [b, a] = [before.months[month], after.months[month]]
  assert.equal(a.collected - b.collected, 777)
  assert.equal(a.refunded - b.refunded, 100)
  assert.equal(a.net - b.net, 677)
  assert.equal(a.count - b.count, 1)
  assert.equal(a.byMode.UPI - (b.byMode.UPI || 0), 777)
  assert.equal(a.admissions - b.admissions, 1)
  assert.equal(after.total.net - before.total.net, 677)
  assert.equal(after.members.active - before.members.active, 1)
  assert.equal(after.dues.total - before.dues.total, 1223)

  const lastYear = await ok('GET', `/stats?year=${before.year - 1}`)
  assert.equal(lastYear.total.collected, 0)
  assert.equal((await call('GET', '/stats?year=abc')).status, 400)
})

test('exports and settings', async () => {
  const csv = await ok('GET', '/export/members.csv')
  assert.match(csv, /No,Name,Phone/)
  assert.match(csv, /Future Fiona/)
  assert.match(await ok('GET', '/export/payments.csv'), /Date,Member no/)
  const s = await ok('PATCH', '/settings', { admissionFee: 300, overdueDays: 20 })
  assert.deepEqual([s.admissionFee, s.overdueDays], [300, 20])
  const p = await ok('PATCH', `/plans/${plan(1).id}`, { price: 1500 })
  assert.equal(p.price, 1500)
  // Changing PIN signs the old token out.
  const oldToken = token
  token = (await ok('POST', '/auth/change-pin', { oldPin: '1234', newPin: '4321' })).token
  const saved = token
  token = oldToken
  assert.equal((await call('GET', '/members')).status, 401)
  token = saved
  assert.equal((await call('GET', '/members')).status, 200)
})
