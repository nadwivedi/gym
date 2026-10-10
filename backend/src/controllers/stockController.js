import { addMonths, todayStr } from '../../../shared/domain.mjs'
import { DEFAULT_STOCK_CATEGORIES, Product, StockMove } from '../models/index.js'
import { out, round2 } from '../utils/helpers.js'
import { dateOf, fail, idOf, intOf, modeOf, moneyOf, paidDateOf, str } from '../utils/validate.js'

const OPENING_STOCK = 'Opening stock'
const isOpening = (m) => m.type === 'adjust' && m.note === OPENING_STOCK

const stockCategories = (used) => [...new Set([...DEFAULT_STOCK_CATEGORIES, ...used])]

async function getProduct(id) {
  return (await Product.findById(idOf(id))) || fail(404, 'Product not found')
}

// out: nothing left. low: at or below the owner's warning level.
const productOut = (p) => ({ ...out(p), status: p.stock <= 0 ? 'out' : p.stock <= p.lowStock ? 'low' : 'ok' })

// Fields of a product that the request sets. The stock count is changed only through stock moves.
async function productFields(b, current) {
  const f = {}
  if (!current || b.name !== undefined) {
    const name = str(b.name, 60) || fail(400, 'Product name is required')
    const others = await Product.find({ _id: { $ne: current?._id } }, { name: 1 }).lean()
    if (others.some((p) => p.name.toLowerCase() === name.toLowerCase())) fail(409, `There is already a product called ${name}`)
    f.name = name
  }
  if (!current || b.category !== undefined) f.category = str(b.category, 40) || 'Other'
  if (!current || b.sellPrice !== undefined) f.sellPrice = moneyOf(b.sellPrice ?? 0, 'Selling price')
  if (b.buyPrice !== undefined) f.buyPrice = moneyOf(b.buyPrice, 'Buying price')
  if (b.lowStock !== undefined) f.lowStock = intOf(b.lowStock, 'Low stock warning', 0, 100000)
  if (b.active !== undefined) f.active = !!b.active
  return f
}

// Sets the stock count to what the owner counted, recording the difference (no money involved).
async function setStockCount(product, count, note) {
  const diff = count - product.stock
  if (!diff) return
  await StockMove.create({ productId: product._id, type: 'adjust', qty: diff, date: todayStr(), note })
  await Product.updateOne({ _id: product._id }, { $inc: { stock: diff } })
}

export async function listStock(req, res) {
  const products = await Product.find().sort({ category: 1, name: 1 }).lean()
  const selling = products.filter((p) => p.active)
  const sum = (fn) => round2(selling.reduce((total, p) => total + fn(p), 0))
  res.json({
    products: products.map(productOut),
    categories: stockCategories(products.map((p) => p.category)),
    totals: {
      units: sum((p) => Math.max(p.stock, 0)),
      value: sum((p) => Math.max(p.stock, 0) * p.sellPrice),
      low: selling.filter((p) => p.stock > 0 && p.stock <= p.lowStock).length,
      out: selling.filter((p) => p.stock <= 0).length,
    },
  })
}

// Stock ledger of one product: every buy, sale and count change with the stock left after it, newest first.
export async function productLedger(req, res) {
  const product = await getProduct(req.params.id)
  const [moves, used] = await Promise.all([
    StockMove.find({ productId: product._id }).sort({ date: 1, createdAt: 1 }).lean(),
    Product.distinct('category'),
  ])
  // Opening stock comes first even when an older bill is entered later.
  moves.sort((a, b) => isOpening(b) - isOpening(a))
  let balance = 0
  const rows = moves.map((m) => {
    balance += m.type === 'sell' ? -m.qty : m.qty
    return { ...out(m), product: product.name, balance }
  })
  const sells = moves.filter((m) => m.type === 'sell')
  const buys = moves.filter((m) => m.type === 'buy')
  const total = (list, fn) => round2(list.reduce((sum, m) => sum + fn(m), 0))
  res.json({
    product: productOut(product.toObject()),
    categories: stockCategories(used),
    totals: {
      boughtUnits: total(buys, (m) => m.qty),
      bought: total(buys, (m) => m.amount),
      soldUnits: total(sells, (m) => m.qty),
      sold: total(sells, (m) => m.amount),
      profit: total(sells, (m) => m.amount - m.unitCost * m.qty),
      adjusted: total(moves.filter((m) => m.type === 'adjust'), (m) => m.qty),
    },
    rows: rows.reverse(),
  })
}

// A new product. `stock` is what is already on the shelf (opening stock, no money).
export async function createProduct(req, res) {
  const b = req.body || {}
  const product = await Product.create(await productFields(b, null))
  if (b.stock !== undefined && b.stock !== '') await setStockCount(product, intOf(b.stock, 'Stock', 0, 100000), OPENING_STOCK)
  res.status(201).json(productOut(await Product.findById(product._id).lean()))
}

// Edit a product; a new `stock` value corrects the count (damaged, lost, miscounted).
export async function updateProduct(req, res) {
  const b = req.body || {}
  const product = await getProduct(req.params.id)
  product.set(await productFields(b, product))
  await product.save()
  if (b.stock !== undefined && b.stock !== '') await setStockCount(product, intOf(b.stock, 'Stock', 0, 100000), 'Count corrected')
  res.json(productOut(await Product.findById(product._id).lean()))
}

// Buy stock (money out, stock up) or sell to a customer (money in, stock down).
export async function createMove(req, res) {
  const b = req.body || {}
  const type = b.type === 'buy' || b.type === 'sell' ? b.type : fail(400, 'Choose buy or sell')
  const product = await getProduct(b.productId)
  const qty = intOf(b.qty, 'Quantity', 1, 100000)
  const unitPrice = moneyOf(b.unitPrice, type === 'buy' ? 'Cost per piece' : 'Price per piece')
  const move = {
    productId: product._id,
    type,
    qty,
    unitPrice,
    amount: round2(qty * unitPrice),
    date: paidDateOf(b.date, 'Date'),
    mode: modeOf(b.mode),
    note: str(b.note, 300),
  }
  if (type === 'sell') {
    move.customer = str(b.customer, 60)
    move.unitCost = product.buyPrice
    // Takes the pieces only if they are there, even when two phones sell at the same time.
    const taken = await Product.findOneAndUpdate({ _id: product._id, stock: { $gte: qty } }, { $inc: { stock: -qty } })
    if (!taken) fail(409, product.stock > 0 ? `Only ${product.stock} ${product.name} left in stock` : `${product.name} is out of stock`)
  } else {
    await Product.updateOne({ _id: product._id }, { $inc: { stock: qty }, ...(unitPrice > 0 && { $set: { buyPrice: unitPrice } }) })
  }
  res.status(201).json(out(await StockMove.create(move)))
}

// Undo a wrong entry: its pieces go back (sell) or come off the shelf again (buy / count change).
export async function deleteMove(req, res) {
  const move = (await StockMove.findById(idOf(req.params.id))) || fail(404, 'Entry not found')
  const change = move.type === 'sell' ? move.qty : -move.qty
  if (change < 0) {
    const ok = await Product.findOneAndUpdate({ _id: move.productId, stock: { $gte: -change } }, { $inc: { stock: change } })
    if (!ok) fail(409, 'Some of these pieces are already sold, so this entry cannot be deleted. Correct the stock count on the product instead.')
  } else {
    await Product.updateOne({ _id: move.productId }, { $inc: { stock: change } })
  }
  await move.deleteOne()
  res.json({ ok: true })
}

// One month of buys, sells and count changes, newest first, with totals.
export async function listMoves(req, res) {
  const month = typeof req.query.month === 'string' && /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : ''
  const from = dateOf(`${month}-01`, 'Month')
  const [items, products] = await Promise.all([
    StockMove.find({ date: { $gte: from, $lt: addMonths(from, 1) } }).sort({ date: -1, createdAt: -1 }).lean(),
    Product.find({}, { name: 1 }).lean(),
  ])
  const names = new Map(products.map((p) => [String(p._id), p.name]))
  const sells = items.filter((m) => m.type === 'sell')
  const buys = items.filter((m) => m.type === 'buy')
  const total = (list, fn) => round2(list.reduce((sum, m) => sum + fn(m), 0))
  res.json({
    month,
    totals: {
      sold: total(sells, (m) => m.amount),
      soldUnits: total(sells, (m) => m.qty),
      profit: total(sells, (m) => m.amount - m.unitCost * m.qty),
      noCost: sells.some((m) => !m.unitCost), // some sales have no cost price, so their profit is the full price
      bought: total(buys, (m) => m.amount),
      boughtUnits: total(buys, (m) => m.qty),
    },
    items: items.map((m) => ({ ...out(m), product: names.get(String(m.productId)) || 'Unknown product' })),
  })
}
