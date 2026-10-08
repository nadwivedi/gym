import crypto from 'node:crypto'
import mongoose from 'mongoose'

const { Schema, model } = mongoose
const opts = { versionKey: false, timestamps: { createdAt: true, updatedAt: false } }
const history = [{ _id: false, at: String, text: String }]

export const Member = model(
  'Member',
  new Schema(
    {
      memberNo: { type: Number, index: true },
      name: { type: String, required: true },
      phone: { type: String, default: '', index: true },
      gender: { type: String, default: '' },
      joinDate: String,
      notes: { type: String, default: '' },
      // Optional personal details. `age` is kept only when there is no date of birth,
      // together with the day it was entered so it can be moved forward each year.
      address: { type: String, default: '' },
      dob: { type: String, default: '' },
      age: { type: Number, default: null },
      ageOn: { type: String, default: '' },
      hidden: { type: Boolean, default: false },
      hiddenReason: { type: String, default: '' },
      hiddenAt: { type: String, default: '' },
    },
    opts,
  ),
)

// One row per admission / renewal. Covers startDate up to (not including) renewalDate.
export const Period = model(
  'Period',
  new Schema(
    {
      memberId: { type: Schema.Types.ObjectId, required: true, index: true },
      planId: Schema.Types.ObjectId,
      planName: String,
      months: Number,
      startDate: { type: String, required: true },
      renewalDate: { type: String, required: true },
      planPrice: { type: Number, default: 0 },
      fee: { type: Number, default: 0 },
      admissionFee: { type: Number, default: 0 },
      waived: { type: Number, default: 0 },
      promisedDate: { type: String, default: '' },
      status: { type: String, enum: ['ok', 'cancelled', 'ended'], default: 'ok' },
      kind: { type: String, default: 'renewal' },
      note: { type: String, default: '' },
      history,
    },
    opts,
  ),
)

export const Payment = model(
  'Payment',
  new Schema(
    {
      memberId: { type: Schema.Types.ObjectId, required: true, index: true },
      periodId: { type: Schema.Types.ObjectId, required: true, index: true },
      type: { type: String, enum: ['payment', 'refund'], default: 'payment' },
      amount: { type: Number, required: true },
      date: { type: String, required: true },
      mode: { type: String, default: 'Cash' },
      note: { type: String, default: '' },
      voided: { type: Boolean, default: false },
      voidReason: { type: String, default: '' },
      history,
    },
    opts,
  ),
)

export const Plan = model(
  'Plan',
  new Schema({ name: String, months: Number, price: { type: Number, default: 0 }, active: { type: Boolean, default: true } }, opts),
)

export const ExpenseCategory = model(
  'ExpenseCategory',
  // icon: one of EXPENSE_ICONS, or empty for the picture the page picks from the name.
  new Schema({ name: { type: String, required: true }, icon: { type: String, default: '' }, order: { type: Number, default: 0 }, active: { type: Boolean, default: true } }, opts),
)

// Money the gym spends: rent, electricity, repairs and so on.
export const Expense = model(
  'Expense',
  new Schema(
    {
      categoryId: { type: Schema.Types.ObjectId, required: true, index: true },
      amount: { type: Number, required: true },
      date: { type: String, required: true, index: true },
      mode: { type: String, default: 'Cash' },
      note: { type: String, default: '' },
      // Optional details of the bill. Expenses from before these existed simply do not have them.
      name: { type: String, default: '' },
      paidTo: { type: String, default: '' },
      invoiceNo: { type: String, default: '' },
      // How much of it has been paid so far. Expenses from before this existed do not have it: routes.js reads their status instead.
      paidAmount: { type: Number },
      // 'pending' while part of it is unpaid, else 'paid'. The totals count an expense either way.
      status: { type: String, default: 'paid' },
      // Filled while a receipt file is kept in ExpenseReceipt.
      receiptName: { type: String, default: '' },
      receiptSize: { type: Number, default: 0 },
    },
    opts,
  ),
)

// The photo or PDF of one expense's receipt. Kept apart so the expense lists stay small.
export const ExpenseReceipt = model(
  'ExpenseReceipt',
  new Schema(
    {
      expenseId: { type: Schema.Types.ObjectId, required: true, unique: true },
      mime: String,
      data: Buffer,
    },
    opts,
  ),
)

// Things the gym sells: protein, creatine, T-shirts and so on. `stock` is kept in step with StockMove.
export const Product = model(
  'Product',
  new Schema(
    {
      name: { type: String, required: true },
      category: { type: String, default: 'Other' },
      sellPrice: { type: Number, default: 0 }, // price per piece the owner sells at
      buyPrice: { type: Number, default: 0 }, // cost per piece of the last purchase
      stock: { type: Number, default: 0 },
      lowStock: { type: Number, default: 2 }, // warn when stock is at or below this
      active: { type: Boolean, default: true },
    },
    opts,
  ),
)

// buy: stock bought (money out). sell: sold to a customer (money in).
// adjust: count correction or opening stock (no money); qty can be negative.
export const StockMove = model(
  'StockMove',
  new Schema(
    {
      productId: { type: Schema.Types.ObjectId, required: true, index: true },
      type: { type: String, enum: ['buy', 'sell', 'adjust'], required: true },
      qty: { type: Number, required: true },
      unitPrice: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }, // qty x unitPrice
      unitCost: { type: Number, default: 0 }, // sell only: cost per piece at the time, for profit
      date: { type: String, required: true, index: true },
      mode: { type: String, default: 'Cash' },
      customer: { type: String, default: '' },
      note: { type: String, default: '' },
    },
    opts,
  ),
)

export const DEFAULT_STOCK_CATEGORIES = ['Protein', 'Creatine', 'Mass gainer', 'T-shirts', 'Lowers', 'Other']

export const DEFAULT_EXPENSE_CATEGORIES =['Electricity', 'Cleaning', 'Maintenance', 'Repair', 'Other']

const Settings = model(
  'Settings',
  new Schema(
    {
      _id: String,
      gymName: { type: String, default: 'Gym Solution' },
      // Owner login: 10-digit mobile number + password.
      loginMobile: { type: String, default: '' },
      passHash: { type: String, default: '' },
      passSalt: { type: String, default: '' },
      // Old PIN login, cleared when the gym creates its mobile + password login.
      pinHash: { type: String, default: '' },
      pinSalt: { type: String, default: '' },
      secret: String,
      admissionFee: { type: Number, default: 0 },
      overdueDays: { type: Number, default: 15 },
      countryCode: { type: String, default: '91' },
      // Automatic WhatsApp renewal reminders on / off.
      waEnabled: { type: Boolean, default: true },
    },
    { versionKey: false },
  ),
)

const Counter = model('Counter', new Schema({ _id: String, seq: Number }, { versionKey: false }))

export async function getSettings() {
  return Settings.findOneAndUpdate(
    { _id: 'main' },
    { $setOnInsert: { secret: crypto.randomBytes(32).toString('hex') } },
    { upsert: true, returnDocument: 'after' },
  )
}

export async function nextMemberNo() {
  const c = await Counter.findOneAndUpdate({ _id: 'member' }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' })
  return c.seq
}

// First run: the standard plans and expense categories. Each list is filled only while it is empty.
export async function seedDefaults() {
  if (!(await Plan.countDocuments())) {
    await Plan.insertMany([1, 3, 6, 12].map((m) => ({ name: m === 1 ? '1 Month' : `${m} Months`, months: m, price: 0 })))
  }
  if (!(await ExpenseCategory.countDocuments())) {
    await ExpenseCategory.insertMany(DEFAULT_EXPENSE_CATEGORIES.map((name, order) => ({ name, order })))
  }
}

export const logEntry = (text) => ({ at: new Date().toISOString(), text })

// Mongo document -> API shape (_id becomes id).
export function out(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc.toObject ? doc.toObject() : doc
  return { id: String(_id), ...rest }
}
