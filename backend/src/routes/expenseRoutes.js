import express from 'express'
import * as expenses from '../controllers/expenseController.js'

// A receipt file is sent as the raw body of the request.
const receiptBody = express.raw({ type: () => true, limit: '8mb' })

// /api/expenses
export const expenseRoutes = express.Router()
expenseRoutes.get('/', expenses.listExpenses)
expenseRoutes.post('/', expenses.createExpense)
expenseRoutes.patch('/:id', expenses.updateExpense)
expenseRoutes.delete('/:id', expenses.deleteExpense)
expenseRoutes.put('/:id/receipt', receiptBody, expenses.uploadReceipt)
expenseRoutes.get('/:id/receipt', expenses.getReceipt)
expenseRoutes.delete('/:id/receipt', expenses.deleteReceipt)

// /api/expense-categories
export const expenseCategoryRoutes = express.Router()
expenseCategoryRoutes.post('/', expenses.createCategory)
expenseCategoryRoutes.patch('/:id', expenses.updateCategory)
