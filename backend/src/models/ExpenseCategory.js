import mongoose from 'mongoose'
import { tenantModel } from '../utils/tenant.js'

const { Schema } = mongoose

export const DEFAULT_EXPENSE_CATEGORIES = ['Electricity', 'Cleaning', 'Maintenance', 'Repair', 'Other']

export const ExpenseCategory = tenantModel(
  'ExpenseCategory',
  new Schema(
    {
      name: { type: String, required: true },
      // One of EXPENSE_ICONS, or empty for the picture the page picks from the name.
      icon: { type: String, default: '' },
      order: { type: Number, default: 0 },
      active: { type: Boolean, default: true },
    },
    { versionKey: false, timestamps: { createdAt: true, updatedAt: false } },
  ),
)
