import mongoose from 'mongoose'
import { tenantModel } from '../utils/tenant.js'

const { Schema } = mongoose

export const Payment = tenantModel(
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
      history: [{ _id: false, at: String, text: String }],
    },
    { versionKey: false, timestamps: { createdAt: true, updatedAt: false } },
  ),
)
