import { addDays, addMonths } from '../../shared/domain.mjs'

const round2 = (n) => Math.round(n * 100) / 100
const pad = (n) => String(n).padStart(2, '0')
const monthOf = (date) => Number(date.slice(5, 7)) - 1

const emptyTotals = () => ({
  collected: 0,
  refunded: 0,
  net: 0, // income: received minus refunds
  count: 0,
  byMode: {},
  expense: 0,
  expenseCount: 0,
  byCategory: {},
  profit: 0, // income minus expenses
  admissions: 0,
  renewals: 0,
})

function roundMap(map) {
  for (const key of Object.keys(map)) map[key] = round2(map[key])
}

// Month-by-month numbers for one calendar year.
// payments: non-voided payments dated inside the year. periods: every non-cancelled period.
// expenses: expenses dated inside the year, each with a `category` name.
export function buildYearStats({ year, today, payments, periods, expenses = [] }) {
  const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, ...emptyTotals(), active: null }))

  for (const p of payments) {
    const m = months[monthOf(p.date)]
    if (p.type === 'refund') m.refunded += p.amount
    else {
      m.collected += p.amount
      m.count += 1
      m.byMode[p.mode] = (m.byMode[p.mode] || 0) + p.amount
    }
  }

  for (const e of expenses) {
    const m = months[monthOf(e.date)]
    m.expense += e.amount
    m.expenseCount += 1
    m.byCategory[e.category] = (m.byCategory[e.category] || 0) + e.amount
  }

  for (const p of periods) {
    if (p.startDate.slice(0, 4) !== String(year)) continue
    const m = months[monthOf(p.startDate)]
    if (p.kind === 'renewal') m.renewals += 1
    else m.admissions += 1 // first admission or a rejoin
  }

  // Members with a running membership on the last day of each month (today, for the current month).
  for (const m of months) {
    const first = `${year}-${pad(m.month)}-01`
    if (first > today) continue
    const lastDay = addDays(addMonths(first, 1), -1)
    const day = lastDay > today ? today : lastDay
    const active = new Set()
    for (const p of periods) if (p.startDate <= day && p.renewalDate > day) active.add(String(p.memberId))
    m.active = active.size
  }

  const total = emptyTotals()
  for (const m of months) {
    for (const key of ['collected', 'refunded', 'count', 'expense', 'expenseCount', 'admissions', 'renewals']) total[key] += m[key]
    for (const [mode, amount] of Object.entries(m.byMode)) total.byMode[mode] = (total.byMode[mode] || 0) + amount
    for (const [cat, amount] of Object.entries(m.byCategory)) total.byCategory[cat] = (total.byCategory[cat] || 0) + amount
  }
  for (const t of [...months, total]) {
    t.collected = round2(t.collected)
    t.refunded = round2(t.refunded)
    t.expense = round2(t.expense)
    t.net = round2(t.collected - t.refunded)
    t.profit = round2(t.net - t.expense)
    roundMap(t.byMode)
    roundMap(t.byCategory)
  }
  return { months, total }
}
