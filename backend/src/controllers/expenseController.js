import { EXPENSE_ICONS, addMonths, todayStr } from '../../../shared/domain.mjs'
import { Expense, ExpenseCategory, ExpenseReceipt } from '../models/index.js'
import { expensePaid, loadCategories } from '../services/expenseService.js'
import { out } from '../utils/helpers.js'
import { dateOf, fail, idOf, modeOf, moneyOf, paidDateOf, str } from '../utils/validate.js'

// A receipt is a photo or a PDF, sent as the body of the request.
const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

async function getExpense(id) {
  return (await Expense.findById(idOf(id))) || fail(404, 'Expense not found')
}

async function categoryNameOf(v, exceptId) {
  const name = str(v, 40) || fail(400, 'Category name is required')
  const all = await ExpenseCategory.find({ _id: { $ne: exceptId } }, { name: 1 }).lean()
  if (all.some((c) => c.name.toLowerCase() === name.toLowerCase())) fail(409, `There is already a category called ${name}`)
  return name
}

// Fields of an expense that the request sets; every field is required when creating. old: the expense being edited.
async function expenseFields(b, old) {
  const creating = !old
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
  // The paid amount decides the status. A paid / pending label sent alone still means all or nothing.
  const amount = f.amount ?? old.amount
  if (b.paidAmount !== undefined) {
    f.paidAmount = moneyOf(b.paidAmount, 'Paid amount')
    if (f.paidAmount > amount) fail(400, 'Paid amount cannot be more than the amount')
  } else if (b.status !== undefined) f.paidAmount = b.status === 'pending' ? 0 : amount
  // Neither sent: an expense paid in full stays paid in full when its amount is fixed.
  else f.paidAmount = creating || expensePaid(old) >= old.amount ? amount : Math.min(expensePaid(old), amount)
  f.status = f.paidAmount < amount ? 'pending' : 'paid'
  return f
}

// One month of expenses, newest first, with a total per category.
export async function listExpenses(req, res) {
  const month = typeof req.query.month === 'string' && /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : ''
  const from = dateOf(`${month}-01`, 'Month')
  const today = todayStr()
  // The unpaid part of each expense (the same reading as expensePaid).
  const unpaid = { $subtract: ['$amount', { $ifNull: ['$paidAmount', { $cond: [{ $eq: ['$status', 'pending'] }, 0, '$amount'] }] }] }
  const [items, categories, [sums = {}]] = await Promise.all([
    Expense.find({ date: { $gte: from, $lt: addMonths(from, 1) } }).sort({ date: -1, createdAt: -1 }).lean(),
    loadCategories(),
    // The tiles at the top of the page: these cover every month, not only the one asked for.
    Expense.aggregate([
      {
        $group: {
          _id: null,
          allTime: { $sum: '$amount' },
          today: { $sum: { $cond: [{ $eq: ['$date', today] }, '$amount', 0] } },
          pendingTotal: { $sum: unpaid },
          pendingCount: { $sum: { $cond: [{ $gt: [unpaid, 0] }, 1, 0] } },
        },
      },
    ]),
  ])
  const names = new Map(categories.map((c) => [String(c._id), c.name]))
  const totals = new Map()
  for (const e of items) totals.set(String(e.categoryId), (totals.get(String(e.categoryId)) || 0) + e.amount)
  const round = (n) => Math.round(n * 100) / 100
  res.json({
    month,
    summary: {
      allTime: round(sums.allTime || 0),
      today: round(sums.today || 0),
      pendingTotal: round(sums.pendingTotal || 0),
      pendingCount: sums.pendingCount || 0,
    },
    total: round(items.reduce((sum, e) => sum + e.amount, 0)),
    byCategory: [...totals].map(([id, total]) => ({ id, name: names.get(id) || 'Other', total: round(total) })).sort((a, b) => b.total - a.total),
    items: items.map((e) => ({ ...out(e), paidAmount: expensePaid(e), category: names.get(String(e.categoryId)) || 'Other' })),
  })
}

export async function createExpense(req, res) {
  const expense = await Expense.create(await expenseFields(req.body || {}))
  res.status(201).json(out(expense))
}

export async function updateExpense(req, res) {
  const expense = await getExpense(req.params.id)
  expense.set(await expenseFields(req.body || {}, expense))
  await expense.save()
  res.json(out(expense))
}

export async function deleteExpense(req, res) {
  const expense = await getExpense(req.params.id)
  await ExpenseReceipt.deleteOne({ expenseId: expense._id })
  await expense.deleteOne()
  res.json({ ok: true })
}

// Attach a receipt to an expense, replacing the one already there. ?name= is the file's name.
export async function uploadReceipt(req, res) {
  const expense = await getExpense(req.params.id)
  const mime = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase()
  if (!RECEIPT_TYPES.includes(mime)) fail(400, 'A receipt must be a JPG, PNG or WebP photo, or a PDF')
  if (!Buffer.isBuffer(req.body) || !req.body.length) fail(400, 'The receipt file is empty')
  await ExpenseReceipt.findOneAndUpdate({ expenseId: expense._id }, { mime, data: req.body }, { upsert: true })
  expense.receiptName = str(req.query.name, 120) || 'receipt'
  expense.receiptSize = req.body.length
  await expense.save()
  res.json(out(expense))
}

export async function getReceipt(req, res) {
  const expense = await getExpense(req.params.id)
  const receipt = (await ExpenseReceipt.findOne({ expenseId: expense._id }).lean()) || fail(404, 'This expense has no receipt')
  // lean() hands the file back as a BSON Binary, not a Buffer.
  res.type(receipt.mime).send(Buffer.isBuffer(receipt.data) ? receipt.data : receipt.data.buffer)
}

export async function deleteReceipt(req, res) {
  const expense = await getExpense(req.params.id)
  await ExpenseReceipt.deleteOne({ expenseId: expense._id })
  expense.receiptName = ''
  expense.receiptSize = 0
  await expense.save()
  res.json(out(expense))
}

export async function createCategory(req, res) {
  const name = await categoryNameOf(req.body?.name)
  const last = await ExpenseCategory.findOne().sort({ order: -1 }).lean()
  const icon = EXPENSE_ICONS.includes(req.body?.icon) ? req.body.icon : ''
  const category = await ExpenseCategory.create({ name, icon, order: (last?.order ?? -1) + 1 })
  res.status(201).json(out(category))
}

// Rename a category or switch it off. Categories are never deleted, so old expenses keep their name.
export async function updateCategory(req, res) {
  const category = (await ExpenseCategory.findById(idOf(req.params.id))) || fail(404, 'Category not found')
  const b = req.body || {}
  if (b.name !== undefined) category.name = await categoryNameOf(b.name, category._id)
  if (b.active !== undefined) category.active = !!b.active
  await category.save()
  res.json(out(category))
}
