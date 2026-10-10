import mongoose from 'mongoose'
import { tenantModel } from '../utils/tenant.js'

const { Schema } = mongoose

// Money the gym spends: rent, electricity, repairs and so on.
export const Expense = tenantModel(
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
      // How much of it has been paid so far. Expenses from before this existed do not have it: expensePaid() reads their status instead.
      paidAmount: { type: Number },
      // 'pending' while part of it is unpaid, else 'paid'. The totals count an expense either way.
      status: { type: String, default: 'paid' },
      // Filled while a receipt file is kept in ExpenseReceipt.
      receiptName: { type: String, default: '' },
      receiptSize: { type: Number, default: 0 },
    },
    { versionKey: false, timestamps: { createdAt: true, updatedAt: false } },
  ),
)
