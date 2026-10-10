import mongoose from 'mongoose'
import { Account, DEFAULT_EXPENSE_CATEGORIES, ExpenseCategory, Plan } from '../models/index.js'
import { newSecret } from '../utils/auth.js'

// A new gym gets its own database next to the main one, e.g. gymsoft_<id>.
export async function createAccount({ name, email, loginMobile, passHash, passSalt }) {
  const _id = new mongoose.Types.ObjectId()
  return Account.create({ _id, name, email, loginMobile, passHash, passSalt, secret: newSecret(), dbName: `${mongoose.connection.name}_${_id}`, waSessionId: String(_id) })
}

// The one-gym version kept the owner login in the main database's settings. On the first start of this
// version, that gym becomes the first account and keeps its data where it is: nothing is copied or deleted.
export async function adoptExistingGym() {
  await Account.init()
  if (await Account.estimatedDocumentCount()) return null
  const old = await mongoose.connection.db.collection('settings').findOne({ _id: 'main' })
  if (!old?.passHash || !old.loginMobile) return null
  return Account.create({
    name: old.gymName || '',
    loginMobile: old.loginMobile,
    passHash: old.passHash,
    passSalt: old.passSalt,
    secret: old.secret || newSecret(),
    dbName: mongoose.connection.name,
    waSessionId: 'gym',
  })
}

// First run of a gym: the standard plans and expense categories. Each list is filled only while it is empty.
export async function seedDefaults() {
  if (!(await Plan.countDocuments())) {
    await Plan.insertMany([1, 3, 6, 12].map((m) => ({ name: m === 1 ? '1 Month' : `${m} Months`, months: m, price: 0 })))
  }
  if (!(await ExpenseCategory.countDocuments())) {
    await ExpenseCategory.insertMany(DEFAULT_EXPENSE_CATEGORIES.map((name, order) => ({ name, order })))
  }
}
