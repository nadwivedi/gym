import mongoose from 'mongoose'
import { tenantModel } from '../utils/tenant.js'

const { Schema } = mongoose

// buy: stock bought (money out). sell: sold to a customer (money in).
// adjust: count correction or opening stock (no money); qty can be negative.
export const StockMove = tenantModel(
  'StockMove',
  new Schema(
    {
      productId: { type: Schema.Types.ObjectId, required: true, index: true },
      type: { type: String, enum: ['buy', 'sell', 'adjust'], required: true },
      qty: { type: Number, required: true },
      unitPrice: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }, // qty x unitPrice
      unitCost: { type: Number, default: 0 }, // sell only: cost per piece at the time, for profit
      date: { type: String, required: true, index: true },
      mode: { type: String, default: 'Cash' },
      customer: { type: String, default: '' },
      note: { type: String, default: '' },
    },
    { versionKey: false, timestamps: { createdAt: true, updatedAt: false } },
  ),
)
