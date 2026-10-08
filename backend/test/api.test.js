// End-to-end API tests. They use a separate database (gymsoft_test) that is wiped on every run.
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import mongoose from 'mongoose'
import { addDays, addMonths, todayStr } from '../../shared/domain.mjs'
import { createApp } from '../src/app.js'
import { hashPassword } from '../src/auth.js'
import { getSettings, seedDefaults } from '../src/db.js'

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
  await seedDefaults()
  server = createApp().listen(0)
  base = `http://127.0.0.1:${server.address().port}/api`
})

after(async () => {
  server.close()
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

test('login: first mobile + password (old PIN dropped), wrong tries, and locked routes', async () => {
  // A gym from before mobile + password logins has only a PIN.
  const s = await getSettings()
  const { salt, hash } = hashPassword('1234')
  Object.assign(s, { pinSalt: salt, pinHash: hash, gymName: 'Test Gym' })
  await s.save()
  assert.deepEqual(await ok('GET', '/auth/status'), { accountSet: false, gymName: 'Test Gym' })
  assert.equal((await call('GET', '/members')).status, 401)

  const account = { mobile: '+91 98765 43210', password: 'secret12' }
  assert.equal((await call('POST', '/auth/setup', { ...account, password: 'abc' })).status, 400)
  assert.equal((await call('POST', '/auth/setup', { ...account, mobile: '12345' })).status, 400)
  token = (await ok('POST', '/auth/setup', account)).token
  assert.equal((await getSettings()).pinHash, '')
  assert.deepEqual(await ok('GET', '/auth/status'), { accountSet: true, gymName: 'Test Gym' })
  assert.equal((await call('POST', '/auth/setup', account)).status, 409)

  assert.equal((await call('POST', '/auth/login', { mobile: '9876543210', password: 'wrong-pass' })).status, 401)
  assert.equal((await call('POST', '/auth/login', { mobile: '9876500000', password: 'secret12' })).status, 401)
  token = (await ok('POST', '/auth/login', { mobile: '09876543210', password: 'secret12' })).token
  const boot = await ok('GET', '/bootstrap')
  assert.equal(boot.settings.loginMobile, '9876543210')
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

test('a membership made by mistake can be deleted, with its payments, after typing delete', async () => {
  // Two memberships: the first is right, the renewal was a mistake and already has a payment and a refund.
  const start = addDays(today, -20)
  const d = await admit('Mistake Meera', { startDate: start, fee: 1000, paid: 1000 })
  const good = d.periods[0]
  const r = await ok('POST', `/members/${d.member.id}/periods`, {
    planId: plan(3).id,
    startDate: d.summary.renewalDate,
    fee: 3000,
    payment: { amount: 2000, date: today, mode: 'UPI' },
  })
  const wrong = r.periods.find((p) => p.id !== good.id)
  await ok('POST', `/periods/${wrong.id}/refund`, { amount: 500, date: today, after: 'continue' })
  const before = await ok('GET', '/stats')
  const month = Number(today.slice(5, 7)) - 1

  // The word must be typed; anything else is refused and nothing is removed.
  for (const confirm of [undefined, '', 'yes', 'delet']) {
    assert.equal((await call('DELETE', `/periods/${wrong.id}`, { confirm })).status, 400)
  }
  assert.equal((await ok('GET', `/members/${d.member.id}`)).periods.length, 2)

  const after = await ok('DELETE', `/periods/${wrong.id}`, { confirm: ' Delete ' })
  assert.equal(after.deletedPayments, 2) // the payment and the refund
  assert.deepEqual(after.periods.map((p) => p.id), [good.id])
  assert.deepEqual(after.payments.map((p) => p.amount), [1000]) // the first membership's payment is untouched
  assert.equal(after.summary.renewalDate, good.renewalDate)
  assert.equal(after.summary.balance, 0)
  // The deleted money is gone from the dashboard too: 2000 received and 500 refunded.
  const stats = await ok('GET', '/stats')
  assert.equal(before.months[month].collected - stats.months[month].collected, 2000)
  assert.equal(before.months[month].refunded - stats.months[month].refunded, 500)
  assert.equal((await call('DELETE', `/periods/${wrong.id}`, { confirm: 'delete' })).status, 404)

  // It also works after cancelling, and for a member's only membership.
  const only = await admit('Only Omar', { fee: 500 })
  await ok('POST', `/periods/${only.periods[0].id}/cancel`, {})
  const gone = await ok('DELETE', `/periods/${only.periods[0].id}`, { confirm: 'delete' })
  assert.deepEqual([gone.periods.length, gone.summary.status, gone.member.name], [0, 'none', 'Only Omar'])
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

test('optional personal details: address, date of birth and age', async () => {
  const m = { planId: plan(1).id, startDate: today, fee: 100 }
  // None of them is required.
  const plain = await ok('POST', '/members', { name: 'Plain Pooja', membership: m })
  assert.deepEqual([plain.member.address, plain.member.dob, plain.member.age], ['', '', null])

  // With a date of birth the age is worked out, not stored.
  const dob = `${Number(today.slice(0, 4)) - 25}-01-01`
  const withDob = await ok('POST', '/members', { name: 'Dob Deepa', address: '12 MG Road\nBhopal', dob, age: '99', notes: 'morning batch', membership: m })
  assert.deepEqual([withDob.member.address, withDob.member.dob, withDob.member.age, withDob.member.notes], ['12 MG Road\nBhopal', dob, null, 'morning batch'])

  // Only an age: it is kept with the day it was entered.
  const withAge = await ok('POST', '/members', { name: 'Age Arjun', age: '32', membership: m })
  assert.deepEqual([withAge.member.dob, withAge.member.age, withAge.member.ageOn], ['', 32, today])

  // Editing: change the address, then replace the typed age with a date of birth, then clear everything.
  let e = await ok('PATCH', `/members/${withAge.member.id}`, { address: 'New Colony', age: '32' })
  assert.deepEqual([e.member.address, e.member.age, e.member.ageOn], ['New Colony', 32, today])
  e = await ok('PATCH', `/members/${withAge.member.id}`, { dob, age: '' })
  assert.deepEqual([e.member.dob, e.member.age, e.member.ageOn], [dob, null, ''])
  e = await ok('PATCH', `/members/${withAge.member.id}`, { address: '', dob: '', age: '' })
  assert.deepEqual([e.member.address, e.member.dob, e.member.age], ['', '', null])
  // A change that does not mention them leaves them alone.
  e = await ok('PATCH', `/members/${withDob.member.id}`, { name: 'Dob Deepa K' })
  assert.deepEqual([e.member.address, e.member.dob], ['12 MG Road\nBhopal', dob])

  for (const bad of [{ dob: addDays(today, 1) }, { dob: '1850-01-01' }, { dob: '2001-02-30' }, { age: '0' }, { age: '150' }, { age: 'abc' }]) {
    assert.equal((await call('POST', '/members', { name: 'Bad', membership: m, ...bad })).status, 400, JSON.stringify(bad))
  }
  const csv = await ok('GET', '/export/members.csv')
  assert.match(csv, /Date of birth,Age,Address/)
  assert.match(csv, new RegExp(`Dob Deepa K.*${dob},25,"12 MG Road\\nBhopal"`, 's'))
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

test('expenses: default categories, add, edit, delete, and the dashboard profit', async () => {
  const month = Number(today.slice(5, 7)) - 1
  const boot = await ok('GET', '/bootstrap')
  assert.deepEqual(
    boot.expenseCategories.map((c) => c.name),
    ['Electricity', 'Cleaning', 'Maintenance', 'Repair', 'Other'],
  )
  const cat = (name) => boot.expenseCategories.find((c) => c.name === name).id

  // A new category; the same name again (any letter case) is refused.
  const rent = await ok('POST', '/expense-categories', { name: 'Rent', icon: 'building' })
  // The picture is optional: the standard categories have none.
  assert.deepEqual([rent.icon, boot.expenseCategories[0].icon], ['building', ''])
  assert.equal((await call('POST', '/expense-categories', { name: 'rent' })).status, 409)
  assert.equal((await call('POST', '/expense-categories', { name: ' ' })).status, 400)
  assert.equal((await ok('GET', '/bootstrap')).expenseCategories.at(-1).name, 'Rent')

  const before = await ok('GET', '/stats')
  const sumBefore = (await ok('GET', `/expenses?month=${today.slice(0, 7)}`)).summary
  const e1 = await ok('POST', '/expenses', { amount: 1500, date: today, categoryId: cat('Electricity'), mode: 'UPI', note: 'October bill' })
  await ok('POST', '/expenses', { amount: 8000, date: today, categoryId: rent.id })
  const e3 = await ok('POST', '/expenses', { amount: 250, date: today, categoryId: cat('Cleaning') })

  let list = await ok('GET', `/expenses?month=${today.slice(0, 7)}`)
  assert.equal(list.total, 9750)
  // The page's tiles: every month together, and today alone. Another month's list carries the same figures.
  assert.deepEqual([list.summary.allTime - sumBefore.allTime, list.summary.today - sumBefore.today], [9750, 9750])
  assert.deepEqual((await ok('GET', '/expenses?month=2020-01')).summary, list.summary)
  assert.deepEqual(
    list.byCategory.map((c) => [c.name, c.total]),
    [['Rent', 8000], ['Electricity', 1500], ['Cleaning', 250]],
  )
  assert.equal(list.items.length, 3)
  assert.equal(list.items.find((e) => e.id === e1.id).category, 'Electricity')

  let after = await ok('GET', '/stats')
  assert.equal(after.months[month].expense - before.months[month].expense, 9750)
  assert.equal(after.months[month].profit, after.months[month].net - after.months[month].expense)
  assert.equal(before.months[month].profit - after.months[month].profit, 9750)
  assert.equal(after.months[month].byCategory.Rent, 8000)
  assert.equal(after.total.expense - before.total.expense, 9750)

  // Fix the amount, delete a wrong entry, rename and switch off a category.
  await ok('PATCH', `/expenses/${e1.id}`, { amount: 1800, categoryId: cat('Repair') })
  await ok('DELETE', `/expenses/${e3.id}`)
  await ok('PATCH', `/expense-categories/${rent.id}`, { name: 'Building rent', active: false })
  list = await ok('GET', `/expenses?month=${today.slice(0, 7)}`)
  assert.equal(list.total, 9800)
  assert.deepEqual(
    list.byCategory.map((c) => [c.name, c.total]),
    [['Building rent', 8000], ['Repair', 1800]],
  )
  after = await ok('GET', '/stats')
  assert.equal(after.months[month].expense - before.months[month].expense, 9800)
  assert.equal((await ok('GET', '/bootstrap')).expenseCategories.at(-1).active, false)

  // Bad input.
  const base = { amount: 100, date: today, categoryId: cat('Other') }
  assert.equal((await call('POST', '/expenses', { ...base, amount: 0 })).status, 400)
  assert.equal((await call('POST', '/expenses', { ...base, date: addDays(today, 1) })).status, 400)
  assert.equal((await call('POST', '/expenses', { ...base, categoryId: undefined })).status, 400)
  assert.equal((await call('POST', '/expenses', { ...base, categoryId: e1.id })).status, 400) // not a category
  assert.equal((await call('GET', '/expenses?month=2026-13')).status, 400)
  assert.equal((await call('GET', '/expenses')).status, 400)
  assert.equal((await call('DELETE', `/expenses/${e3.id}`)).status, 404)
  assert.match(await ok('GET', '/export/expenses.csv'), /Date,Category,Amount/)
})

test('expenses: bill details and the receipt file', async () => {
  const boot = await ok('GET', '/bootstrap')
  const categoryId = boot.expenseCategories[0].id
  const month = today.slice(0, 7)
  const before = await ok('GET', '/stats')
  const unpaid = async () => (await ok('GET', `/expenses?month=${month}`)).summary
  const unpaidBefore = await unpaid()

  // The details are optional; an unknown status is saved as paid.
  const plain = await ok('POST', '/expenses', { amount: 100, date: today, categoryId })
  assert.deepEqual([plain.name, plain.paidTo, plain.invoiceNo, plain.status, plain.receiptName], ['', '', '', 'paid', ''])
  assert.equal((await ok('POST', '/expenses', { amount: 100, date: today, categoryId, status: 'whatever' })).status, 'paid')
  const bill = await ok('POST', '/expenses', { amount: 4200, date: today, categoryId, name: ' October power bill ', paidTo: 'City Power', invoiceNo: 'INV-88', status: 'pending', note: 'Meter 2' })
  assert.deepEqual([bill.name, bill.paidTo, bill.invoiceNo, bill.status], ['October power bill', 'City Power', 'INV-88', 'pending'])
  // A pending expense still counts in the month.
  assert.equal((await ok('GET', '/stats')).total.expense - before.total.expense, 4400)
  // ...and is counted among the unpaid bills until it is marked paid.
  let sum = await unpaid()
  assert.deepEqual([sum.pendingCount - unpaidBefore.pendingCount, sum.pendingTotal - unpaidBefore.pendingTotal], [1, 4200])
  const edited = await ok('PATCH', `/expenses/${bill.id}`, { status: 'paid', paidTo: 'City Power Ltd' })
  sum = await unpaid()
  assert.deepEqual([sum.pendingCount, sum.pendingTotal], [unpaidBefore.pendingCount, unpaidBefore.pendingTotal])

  // Part payment: what is left is pending, and paying the rest clears it. More than the amount is refused.
  const part = await ok('POST', '/expenses', { amount: 900, paidAmount: 600, date: today, categoryId })
  assert.deepEqual([part.paidAmount, part.status], [600, 'pending'])
  sum = await unpaid()
  assert.deepEqual([sum.pendingCount - unpaidBefore.pendingCount, sum.pendingTotal - unpaidBefore.pendingTotal], [1, 300])
  assert.equal((await ok('GET', `/expenses?month=${month}`)).items.find((e) => e.id === part.id).paidAmount, 600)
  assert.equal((await call('PATCH', `/expenses/${part.id}`, { paidAmount: 901 })).status, 400)
  assert.equal((await call('POST', '/expenses', { amount: 100, paidAmount: 101, date: today, categoryId })).status, 400)
  // Fixing only the amount keeps what was paid; an expense paid in full stays paid in full.
  assert.deepEqual(await ok('PATCH', `/expenses/${part.id}`, { amount: 1000 }).then((e) => [e.paidAmount, e.status]), [600, 'pending'])
  assert.deepEqual(await ok('PATCH', `/expenses/${part.id}`, { paidAmount: 1000 }).then((e) => [e.paidAmount, e.status]), [1000, 'paid'])
  assert.deepEqual(await ok('PATCH', `/expenses/${part.id}`, { amount: 1200 }).then((e) => [e.paidAmount, e.status]), [1200, 'paid'])
  assert.deepEqual([plain.paidAmount, bill.paidAmount, edited.paidAmount], [100, 0, 4200])
  await ok('DELETE', `/expenses/${part.id}`)
  assert.deepEqual([edited.status, edited.paidTo, edited.name], ['paid', 'City Power Ltd', 'October power bill'])
  assert.match(await ok('GET', '/export/expenses.csv'), /Meter 2,October power bill,City Power Ltd,INV-88,paid,\r\n/)

  // The receipt travels as the raw file, not as JSON.
  const send = (id, type, bytes, name = 'bill.pdf') =>
    fetch(`${base}/expenses/${id}/receipt?name=${encodeURIComponent(name)}`, { method: 'PUT', headers: { 'Content-Type': type, Authorization: `Bearer ${token}` }, body: bytes })
  const pdf = Buffer.from('%PDF-1.4 a small receipt')
  let res = await send(bill.id, 'application/pdf', pdf)
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json().then((e) => [e.receiptName, e.receiptSize]), ['bill.pdf', pdf.length])
  assert.deepEqual(
    (await ok('GET', `/expenses?month=${month}`)).items.find((e) => e.id === bill.id).receiptName,
    'bill.pdf',
  )
  res = await fetch(`${base}/expenses/${bill.id}/receipt`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(res.headers.get('content-type'), 'application/pdf')
  assert.deepEqual(Buffer.from(await res.arrayBuffer()), pdf)
  // A new file replaces the old one.
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])
  assert.equal((await send(bill.id, 'image/png', png, 'photo.png')).status, 200)
  res = await fetch(`${base}/expenses/${bill.id}/receipt`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(res.headers.get('content-type'), 'image/png')
  assert.deepEqual(Buffer.from(await res.arrayBuffer()), png)
  assert.match(await ok('GET', '/export/expenses.csv'), /INV-88,paid,yes\r\n/)

  // Refused: not a photo or PDF, an empty file, a file over 8 MB, no login, an expense that is not there.
  assert.equal((await send(bill.id, 'text/html', Buffer.from('<b>hi</b>'))).status, 400)
  assert.equal((await send(bill.id, 'application/pdf', Buffer.alloc(0))).status, 400)
  assert.equal((await send(bill.id, 'image/jpeg', Buffer.alloc(8 * 1024 * 1024 + 1))).status, 413)
  assert.equal((await fetch(`${base}/expenses/${bill.id}/receipt`)).status, 401)
  assert.equal((await call('GET', `/expenses/${plain.id}/receipt`)).status, 404)

  // Taking the receipt off, and deleting an expense together with its receipt.
  assert.deepEqual(await ok('DELETE', `/expenses/${bill.id}/receipt`).then((e) => [e.receiptName, e.receiptSize]), ['', 0])
  assert.equal((await call('GET', `/expenses/${bill.id}/receipt`)).status, 404)
  assert.equal((await send(bill.id, 'application/pdf', pdf)).status, 200)
  await ok('DELETE', `/expenses/${bill.id}`)
  assert.equal(await mongoose.connection.db.collection('expensereceipts').countDocuments(), 0)
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
  // Changing the login signs the old token out.
  const oldToken = token
  assert.equal((await call('POST', '/auth/change-login', { currentPassword: 'nope', mobile: '9876543210' })).status, 400)
  const changed = await ok('POST', '/auth/change-login', { currentPassword: 'secret12', mobile: '9123456780', newPassword: 'newpass99' })
  assert.equal(changed.loginMobile, '9123456780')
  token = changed.token
  assert.equal((await call('POST', '/auth/login', { mobile: '9123456780', password: 'secret12' })).status, 401)
  await ok('POST', '/auth/login', { mobile: '9123456780', password: 'newpass99' })
  const saved = token
  token = oldToken
  assert.equal((await call('GET', '/members')).status, 401)
  token = saved
  assert.equal((await call('GET', '/members')).status, 200)
})

test('stock: products, buy, sell, no selling more than in stock, undo, count changes, and the dashboard', async () => {
  const monthIndex = Number(today.slice(5, 7)) - 1
  const before = (await ok('GET', '/stats')).months[monthIndex]

  const whey = await ok('POST', '/stock/products', { name: 'Whey Protein 1 kg', category: 'Protein', sellPrice: 2400, stock: 2 })
  assert.deepEqual([whey.stock, whey.status, whey.sellPrice], [2, 'low', 2400]) // warns at 2 or fewer by default
  assert.equal((await call('POST', '/stock/products', { name: 'whey protein 1 KG' })).status, 409)
  assert.equal((await call('POST', '/stock/products', { name: '' })).status, 400)

  await ok('POST', '/stock/moves', { type: 'buy', productId: whey.id, qty: 10, unitPrice: 1800, date: today, mode: 'UPI' })
  const sale = await ok('POST', '/stock/moves', { type: 'sell', productId: whey.id, qty: 3, unitPrice: 2300, date: today, customer: 'Rahul' })
  assert.equal(sale.amount, 6900)
  const tooMany = await call('POST', '/stock/moves', { type: 'sell', productId: whey.id, qty: 10, unitPrice: 2400, date: today })
  assert.deepEqual([tooMany.status, tooMany.data.error], [409, 'Only 9 Whey Protein 1 kg left in stock'])
  assert.equal((await call('POST', '/stock/moves', { type: 'sell', productId: whey.id, qty: 0, unitPrice: 2400, date: today })).status, 400)
  assert.equal((await call('POST', '/stock/moves', { type: 'sell', productId: whey.id, qty: 1, unitPrice: 2400, date: addDays(today, 1) })).status, 400)

  const stock = await ok('GET', '/stock')
  const p = stock.products.find((x) => x.id === whey.id)
  assert.deepEqual([p.stock, p.buyPrice, p.status], [9, 1800, 'ok'])
  assert.ok(stock.categories.includes('Creatine'))
  assert.deepEqual(stock.totals, { units: 9, value: 21600, low: 0, out: 0 })

  const month = await ok('GET', `/stock/moves?month=${today.slice(0, 7)}`)
  assert.deepEqual(month.totals, { sold: 6900, soldUnits: 3, profit: 1500, bought: 18000, boughtUnits: 10, noCost: false })
  assert.deepEqual(month.items.map((m) => m.type).sort(), ['adjust', 'buy', 'sell']) // opening stock is a count change
  assert.equal(month.items[0].product, 'Whey Protein 1 kg')

  // On the dashboard the sale is income and the purchase is an expense.
  const after = (await ok('GET', '/stats')).months[monthIndex]
  assert.equal(after.shopSales - before.shopSales, 6900)
  assert.equal(after.net - before.net, 6900)
  assert.equal(after.expense - before.expense, 18000)
  assert.equal(after.byCategory['Stock bought'], 18000)

  // Undo the sale: the 3 pieces come back.
  await ok('DELETE', `/stock/moves/${sale.id}`)
  assert.equal((await ok('GET', '/stock')).products.find((x) => x.id === whey.id).stock, 12)

  // Correct the count and the price.
  const fixed = await ok('PATCH', `/stock/products/${whey.id}`, { stock: 5, sellPrice: 2500, lowStock: 5 })
  assert.deepEqual([fixed.stock, fixed.sellPrice, fixed.status], [5, 2500, 'low'])
  // The purchase of 10 cannot be undone now that only 5 are left.
  const buy = month.items.find((m) => m.type === 'buy')
  assert.equal((await call('DELETE', `/stock/moves/${buy.id}`)).status, 409)
  assert.match(await ok('GET', '/export/stock.csv'), /Bought,Whey Protein 1 kg,Protein,10,1800,18000,UPI/)

  // Ledger: opening 2, bought 10, (sale undone), count set to 5 => balance 2, 12, 5; newest first.
  const ledger = await ok('GET', `/stock/products/${whey.id}/ledger`)
  assert.deepEqual(
    ledger.rows.map((m) => [m.type, m.qty, m.balance]),
    [['adjust', -7, 5], ['buy', 10, 12], ['adjust', 2, 2]],
  )
  assert.equal(ledger.rows[0].balance, ledger.product.stock)
  assert.deepEqual(ledger.totals, { boughtUnits: 10, bought: 18000, soldUnits: 0, sold: 0, profit: 0, adjusted: -5 })
  assert.ok(ledger.categories.includes('Protein'))

  // A bill dated before the product was added still comes after the opening stock in the ledger.
  await ok('POST', '/stock/moves', { type: 'buy', productId: whey.id, qty: 4, unitPrice: 1800, date: addDays(today, -30) })
  const older = await ok('GET', `/stock/products/${whey.id}/ledger`)
  assert.deepEqual(
    older.rows.map((m) => [m.type, m.balance]),
    [['adjust', 9], ['buy', 16], ['buy', 6], ['adjust', 2]],
  )
})
