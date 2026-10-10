import { ExpenseCategory } from '../models/index.js'

export const loadCategories = () => ExpenseCategory.find().sort({ order: 1, createdAt: 1 }).lean()

// How much of an expense is paid. One saved before the paid amount existed is all or nothing, by its status.
export const expensePaid = (e) => e.paidAmount ?? (e.status === 'pending' ? 0 : e.amount)
