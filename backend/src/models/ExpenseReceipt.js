import mongoose from 'mongoose'
import { tenantModel } from '../utils/tenant.js'

const { Schema } = mongoose

// The photo or PDF of one expense's receipt. Kept apart so the expense lists stay small.
export const ExpenseReceipt = tenantModel(
  'ExpenseReceipt',
  new Schema(
    {
      expenseId: { type: Schema.Types.ObjectId, required: true, unique: true },
      mime: String,
      data: Buffer,
    },
    { versionKey: false, timestamps: { createdAt: true, updatedAt: false } },
  ),
)
