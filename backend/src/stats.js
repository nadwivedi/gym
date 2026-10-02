import { addDays, addMonths } from '../../shared/domain.mjs'

const round2 = (n) => Math.round(n * 100) / 100
const pad = (n) => String(n).padStart(2, '0')

const emptyTotals = () => ({ collected: 0, refunded: 0, net: 0, count: 0, byMode: {}, admissions: 0, renewals: 0 })

// Month-by-month numbers for one calendar year.
// payments: non-voided payments dated inside the year. periods: every non-cancelled period.
export function buildYearStats({ year, today, payments, periods }) {
  const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, ...emptyTotals(), active: null }))

  for (const p of payments) {
    const m = months[Number(p.date.slice(5, 7)) - 1]
    if (p.type === 'refund') m.refunded += p.amount
    else {
      m.collected += p.amount
      m.count += 1
      m.byMode[p.mode] = (m.byMode[p.mode] || 0) + p.amount
    }
  }

  for (const p of periods) {
    if (p.startDate.slice(0, 4) !== String(year)) continue
    const m = months[Number(p.startDate.slice(5, 7)) - 1]
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
    m.collected = round2(m.collected)
    m.refunded = round2(m.refunded)
    m.net = round2(m.collected - m.refunded)
    for (const key of ['collected', 'refunded', 'count', 'admissions', 'renewals']) total[key] += m[key]
    for (const [mode, amount] of Object.entries(m.byMode)) {
      m.byMode[mode] = round2(amount)
      total.byMode[mode] = round2((total.byMode[mode] || 0) + amount)
    }
  }
  total.collected = round2(total.collected)
  total.refunded = round2(total.refunded)
  total.net = round2(total.collected - total.refunded)
  return { months, total }
}
