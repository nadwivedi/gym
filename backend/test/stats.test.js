import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildYearStats } from '../src/stats.js'

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

test('year stats: a past year is filled for all twelve months', () => {
  const { months } = buildYearStats({ year: 2025, today: '2026-10-02', payments: [], periods: [period('c', '2025-12-15', '2026-12-15')] })
  assert.equal(months[10].active, 0)
  assert.equal(months[11].active, 1)
})
