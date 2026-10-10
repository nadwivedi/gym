import { todayStr } from '../../../shared/domain.mjs'
import { Expense, Payment, Period, StockMove } from '../models/index.js'
import { loadCategories } from '../services/expenseService.js'
import { loadSummaries } from '../services/memberService.js'
import { buildYearStats } from '../services/statsService.js'
import { intOf } from '../utils/validate.js'

export async function dashboard(req, res) {
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
}

// Numbers behind the dashboard charts: one calendar year, month by month.
export async function stats(req, res) {
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
  const result = buildYearStats({ year, today, payments, periods, expenses, stockMoves })
  const active = rows.filter((s) => s.status === 'active' && !s.hidden).length
  // The current month shows the same count as the "active members" tile.
  if (year === thisYear) result.months[Number(today.slice(5, 7)) - 1].active = active
  const dues = rows.filter((s) => s.balance > 0)
  const firstYear = Math.min(thisYear, ...[firstPayment?.date, firstPeriod?.startDate, firstExpense?.date, firstShopMove?.date].filter(Boolean).map((d) => Number(d.slice(0, 4))))
  res.json({
    year,
    today,
    firstYear,
    lastYear: thisYear,
    ...result,
    members: { active, total: rows.length },
    dues: { count: dues.length, total: Math.round(dues.reduce((sum, s) => sum + s.balance, 0) * 100) / 100 },
  })
}
