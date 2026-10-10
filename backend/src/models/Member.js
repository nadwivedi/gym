import mongoose from 'mongoose'
import { tenantModel } from '../utils/tenant.js'

const { Schema } = mongoose

export const Member = tenantModel(
  'Member',
  new Schema(
    {
      memberNo: { type: Number, index: true },
      name: { type: String, required: true },
      phone: { type: String, default: '', index: true },
      gender: { type: String, default: '' },
      joinDate: String,
      notes: { type: String, default: '' },
      // Optional personal details. `age` is kept only when there is no date of birth,
      // together with the day it was entered so it can be moved forward each year.
      address: { type: String, default: '' },
      dob: { type: String, default: '' },
      age: { type: Number, default: null },
      ageOn: { type: String, default: '' },
      hidden: { type: Boolean, default: false },
      hiddenReason: { type: String, default: '' },
      hiddenAt: { type: String, default: '' },
    },
    { versionKey: false, timestamps: { createdAt: true, updatedAt: false } },
  ),
)
