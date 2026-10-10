import crypto from 'node:crypto'
import mongoose from 'mongoose'
import { tenantModel } from '../utils/tenant.js'

const { Schema } = mongoose

const Settings = tenantModel(
  'Settings',
  new Schema(
    {
      _id: String,
      gymName: { type: String, default: 'Gym Solution' },
      // Owner login: 10-digit mobile number + password.
      loginMobile: { type: String, default: '' },
      passHash: { type: String, default: '' },
      passSalt: { type: String, default: '' },
      // Old PIN login, cleared when the gym creates its mobile + password login.
      pinHash: { type: String, default: '' },
      pinSalt: { type: String, default: '' },
      secret: String,
      admissionFee: { type: Number, default: 0 },
      overdueDays: { type: Number, default: 15 },
      countryCode: { type: String, default: '91' },
      // Automatic WhatsApp renewal reminders on / off.
      waEnabled: { type: Boolean, default: true },
    },
    { versionKey: false },
  ),
)

// The gym's one settings document, created on first use.
export async function getSettings() {
  return Settings.findOneAndUpdate(
    { _id: 'main' },
    { $setOnInsert: { secret: crypto.randomBytes(32).toString('hex') } },
    { upsert: true, returnDocument: 'after' },
  )
}

// The settings the app is allowed to see.
export const publicSettings = (s) => ({
  gymName: s.gymName,
  admissionFee: s.admissionFee,
  overdueDays: s.overdueDays,
  countryCode: s.countryCode,
})
