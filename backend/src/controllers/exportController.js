import { memberAge, todayStr } from '../../../shared/domain.mjs'
import { Expense, ExpenseCategory, Member, Payment, Period, Plan, Product, StockMove, publicSettings } from '../models/index.js'
import { expensePaid, loadCategories } from '../services/expenseService.js'
import { loadSummaries } from '../services/memberService.js'
import { toCsv } from '../utils/csv.js'

export async function membersCsv(req, res) {
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
}

export async function paymentsCsv(req, res) {
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
}

export async function expensesCsv(req, res) {
  const [expenses, categories] = await Promise.all([Expense.find().sort({ date: 1, createdAt: 1 }).lean(), loadCategories()])
  const names = new Map(categories.map((c) => [String(c._id), c.name]))
  res.type('text/csv').send(
    toCsv(
      ['Date', 'Category', 'Amount', 'Paid', 'Mode', 'Note', 'Name', 'Paid to', 'Invoice no', 'Status', 'Receipt'],
      expenses.map((e) => [e.date, names.get(String(e.categoryId)) || 'Other', e.amount, expensePaid(e), e.mode, e.note, e.name, e.paidTo, e.invoiceNo, e.status || 'paid', e.receiptName ? 'yes' : '']),
    ),
  )
}

export async function stockCsv(req, res) {
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
}

export async function backupJson(req, res) {
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
}
