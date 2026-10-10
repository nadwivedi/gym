import mongoose from 'mongoose'
import { tenantModel } from '../utils/tenant.js'

const { Schema } = mongoose

export const DEFAULT_STOCK_CATEGORIES = ['Protein', 'Creatine', 'Mass gainer', 'T-shirts', 'Lowers', 'Other']

// Things the gym sells: protein, creatine, T-shirts and so on. `stock` is kept in step with StockMove.
export const Product = tenantModel(
  'Product',
  new Schema(
    {
      name: { type: String, required: true },
      category: { type: String, default: 'Other' },
      sellPrice: { type: Number, default: 0 }, // price per piece the owner sells at
      buyPrice: { type: Number, default: 0 }, // cost per piece of the last purchase
      stock: { type: Number, default: 0 },
      lowStock: { type: Number, default: 2 }, // warn when stock is at or below this
      active: { type: Boolean, default: true },
    },
    { versionKey: false, timestamps: { createdAt: true, updatedAt: false } },
  ),
)
