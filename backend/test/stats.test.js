import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildYearStats } from '../src/services/statsService.js'

const pay = (date, amount, mode = 'Cash', type = 'payment') => ({ date, amount, mode, type })
const period = (memberId, startDate, renewalDate, kind = 'admission') => ({ memberId, startDate, renewalDate, kind })

test('year stats: collection, refunds and modes per month', () => {
  const { months, total } = buildYearStats({
    year: 2026,
    today: '2026-10-02',
    payments: [pay('2026-01-05', 1000), pay('2026-01-20', 500, 'UPI'), pay('2026-03-01', 2000, 'UPI'), pay('2026-03-15', 300, 'Cash', 'refund')],
    periods: [],
  })
  assert.equal(months.length, 12)
  assert.deepEqual([months[0].collected, months[0].refunded, months[0].net, months[0].count], [1500, 0, 1500, 2])
  assert.deepEqual(months[0].byMode, { Cash: 1000, UPI: 500 })
  assert.deepEqual([months[2].collected, months[2].refunded, months[2].net, months[2].count], [2000, 300, 1700, 1])
  assert.equal(months[1].net, 0)
  assert.deepEqual([total.collected, total.refunded, total.net, total.count], [3500, 300, 3200, 3])
  assert.deepEqual(total.byMode, { Cash: 1000, UPI: 2500 })
})

test('year stats: admissions, renewals and active members at each month end', () => {
  const { months, total } = buildYearStats({
    year: 2026,
    today: '2026-10-02',
    payments: [],
    periods: [
      period('a', '2026-01-10', '2026-04-10'), // 3 months
      period('a', '2026-04-10', '2026-05-10', 'renewal'),
      period('b', '2026-02-28', '2026-03-28'),
      period('c', '2025-12-15', '2026-12-15'), // started last year: active all year, not a 2026 admission
      period('d', '2026-09-20', '2026-10-01'), // ended the day before "today"
      period('e', '2026-10-05', '2026-11-05', 'rejoin'), // starts after today
    ],
  })
  assert.deepEqual(
    months.map((m) => m.active),
    [2, 3, 2, 2, 1, 1, 1, 1, 2, 1, null, null], // Mar 31: b has lapsed; Oct uses today, e has not started
  )
  assert.deepEqual([months[0].admissions, months[1].admissions, months[3].renewals, months[9].admissions], [1, 1, 1, 1])
  assert.deepEqual([total.admissions, total.renewals], [4, 1])
})

test('year stats: expenses by category and profit, including a loss month', () => {
  const expense = (date, amount, category) => ({ date, amount, category })
  const { months, total } = buildYearStats({
    year: 2026,
    today: '2026-10-02',
    payments: [pay('2026-01-05', 5000), pay('2026-02-10', 1000), pay('2026-02-12', 200, 'Cash', 'refund')],
    periods: [],
    expenses: [expense('2026-01-03', 1200.5, 'Electricity'), expense('2026-01-20', 800, 'Cleaning'), expense('2026-01-25', 300, 'Electricity'), expense('2026-02-01', 2500, 'Repair')],
  })
  assert.deepEqual([months[0].net, months[0].expense, months[0].profit, months[0].expenseCount], [5000, 2300.5, 2699.5, 3])
  assert.deepEqual(months[0].byCategory, { Electricity: 1500.5, Cleaning: 800 })
  assert.deepEqual([months[1].net, months[1].expense, months[1].profit], [800, 2500, -1700]) // spent more than earned
  assert.deepEqual([months[2].expense, months[2].profit], [0, 0])
  assert.deepEqual([total.net, total.expense, total.profit, total.expenseCount], [5800, 4800.5, 999.5, 4])
  assert.deepEqual(total.byCategory, { Electricity: 1500.5, Cleaning: 800, Repair: 2500 })
})

test('year stats: a past year is filled for all twelve months', () => {
  const { months } = buildYearStats({ year: 2025, today: '2026-10-02', payments: [], periods: [period('c', '2025-12-15', '2026-12-15')] })
  assert.equal(months[10].active, 0)
  assert.equal(months[11].active, 1)
})

test('year stats: shop sales are income and stock bought is an expense', () => {
  const { months, total } = buildYearStats({
    year: 2026,
    today: '2026-10-02',
    payments: [pay('2026-02-01', 1000)],
    periods: [],
    expenses: [{ date: '2026-02-03', amount: 200, category: 'Rent' }],
    stockMoves: [
      { type: 'buy', amount: 1800, date: '2026-02-05', mode: 'Cash' },
      { type: 'sell', amount: 2400, date: '2026-02-10', mode: 'UPI' },
      { type: 'sell', amount: 900, date: '2026-03-01', mode: 'Cash' },
    ],
  })
  const feb = months[1]
  assert.deepEqual([feb.collected, feb.shopSales, feb.net, feb.shopBuys, feb.expense, feb.profit], [1000, 2400, 3400, 1800, 2000, 1400])
  assert.deepEqual(feb.byCategory, { Rent: 200, 'Stock bought': 1800 })
  assert.deepEqual([feb.count, feb.shopSalesCount, feb.expenseCount], [1, 1, 2])
  assert.deepEqual(feb.byMode, { Cash: 1000, UPI: 2400 }) // shop sales count in the money received by each mode
  assert.deepEqual([total.shopSales, total.net, total.expense, total.profit], [3300, 4300, 2000, 2300])
})
