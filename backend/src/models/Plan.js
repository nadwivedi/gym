import mongoose from 'mongoose'
import { tenantModel } from '../utils/tenant.js'

const { Schema } = mongoose

export const Plan = tenantModel(
  'Plan',
  new Schema(
    { name: String, months: Number, price: { type: Number, default: 0 }, active: { type: Boolean, default: true } },
    { versionKey: false, timestamps: { createdAt: true, updatedAt: false } },
  ),
)
