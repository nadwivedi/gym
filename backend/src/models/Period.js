import mongoose from 'mongoose'
import { tenantModel } from '../utils/tenant.js'

const { Schema } = mongoose

// One row per admission / renewal. Covers startDate up to (not including) renewalDate.
export const Period = tenantModel(
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
      history: [{ _id: false, at: String, text: String }],
    },
    { versionKey: false, timestamps: { createdAt: true, updatedAt: false } },
  ),
)
