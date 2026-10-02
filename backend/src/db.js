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

const Settings = model(
  'Settings',
  new Schema(
    {
      _id: String,
      gymName: { type: String, default: 'My Gym' },
      pinHash: { type: String, default: '' },
      pinSalt: { type: String, default: '' },
      secret: String,
      admissionFee: { type: Number, default: 0 },
      overdueDays: { type: Number, default: 15 },
      countryCode: { type: String, default: '91' },
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

export async function seedPlans() {
  if (await Plan.countDocuments()) return
  await Plan.insertMany([1, 3, 6, 12].map((m) => ({ name: m === 1 ? '1 Month' : `${m} Months`, months: m, price: 0 })))
}

export const logEntry = (text) => ({ at: new Date().toISOString(), text })

// Mongo document -> API shape (_id becomes id).
export function out(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc.toObject ? doc.toObject() : doc
  return { id: String(_id), ...rest }
}
