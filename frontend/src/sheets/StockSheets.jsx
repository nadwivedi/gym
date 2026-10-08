import { useState } from 'react'
import { api, useAction } from '../api.js'
import { DateInput, MoneyInput } from '../components/fields.jsx'
import { ErrorBox, Field, Group, Sheet } from '../components/ui.jsx'
import { useApp } from '../context.js'
import { capTyped, capWords, fmtDate, money, moveTitle } from '../format.js'

const count = (v) => Math.max(0, Math.floor(Number(v)) || 0)

// Add a product, or change its name, type, selling price, warning level or stock count.
export function ProductSheet({ product, categories, onClose, onDone }) {
  const [name, setName] = useState(product?.name || '')
  const [category, setCategory] = useState(product?.category || '')
  const [sellPrice, setSellPrice] = useState(product ? String(product.sellPrice) : '')
  const [buyPrice, setBuyPrice] = useState(product?.buyPrice ? String(product.buyPrice) : '')
  const [stock, setStock] = useState(product ? String(product.stock) : '')
  const [lowStock, setLowStock] = useState(String(product?.lowStock ?? 2))
  const [added, setAdded] = useState([])
  const { busy, error, run } = useAction()
  const types = [...new Set([...categories, ...added, ...(category ? [category] : [])])]

  const save = async (e) => {
    e.preventDefault()
    const body = { name, category: category || 'Other', sellPrice: Number(sellPrice) || 0, buyPrice: Number(buyPrice) || 0, lowStock: count(lowStock) }
    // Only a changed count is sent, so saving a new price never resets stock sold meanwhile on another phone.
    if (!product || stock !== String(product.stock)) body.stock = count(stock)
    const saved = await run(() =>
      product ? api(`/stock/products/${product.id}`, { method: 'PATCH', body }) : api('/stock/products', { method: 'POST', body }),
    )
    if (saved) onDone()
  }

  const toggle = async () => {
    if (await run(() => api(`/stock/products/${product.id}`, { method: 'PATCH', body: { active: !product.active } }))) onDone()
  }

  const addType = () => {
    const t = capWords(window.prompt('Name of the new product type (for example Pre-workout, Shakers, Gloves):', '')?.trim() || '')
    if (!t) return
    setAdded((a) => [...a, t])
    setCategory(t)
  }

  return (
    <Sheet title={product ? 'Edit product' : 'New product'} onClose={onClose}>
      <form className="form" onSubmit={save}>
        <Field label="Product name">
          <input value={name} onChange={(e) => setName(capTyped(e))} maxLength={60} required autoFocus={!product} placeholder="e.g. Whey Protein 1 kg, T-shirt (L)" />
        </Field>
        <Group label="Type">
          <div className="chips wrap">
            {types.map((t) => (
              <button type="button" key={t} className={`chip ${t === category ? 'active' : ''}`} aria-pressed={t === category} onClick={() => setCategory(t)}>
                {t}
              </button>
            ))}
            <button type="button" className="chip dashed" onClick={addType}>
              + New type
            </button>
          </div>
        </Group>
        <div className="field-row">
          <Field label="Selling price (per piece)">
            <MoneyInput value={sellPrice} onChange={setSellPrice} required placeholder="0" />
          </Field>
          <Field label="Your cost (per piece)">
            <MoneyInput value={buyPrice} onChange={setBuyPrice} placeholder="For profit" />
          </Field>
        </div>
        <div className="field-row">
          <Field label={product ? 'Pieces in stock' : 'How many you have now'}>
            <input type="number" inputMode="numeric" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
          </Field>
          <Field label="Warn when stock is at">
            <input type="number" inputMode="numeric" min="0" step="1" value={lowStock} onChange={(e) => setLowStock(e.target.value)} />
          </Field>
        </div>
        <p className="hint">
          {product
            ? 'Change this only to fix the count (damaged, lost or counted wrong). To add new stock, use Buy stock.'
            : 'Pieces already in the gym. Later, add new stock with Buy stock so its cost is counted. Your cost is updated by each purchase.'}
        </p>
        <ErrorBox error={error} />
        <button className="btn primary block" disabled={busy || !name.trim()}>
          {busy ? 'Saving…' : product ? 'Save changes' : 'Save product'}
        </button>
        {product && (
          <button type="button" className="btn block" disabled={busy} onClick={toggle}>
            {product.active ? 'Stop selling this product' : 'Start selling again'}
          </button>
        )}
      </form>
    </Sheet>
  )
}

// Sell to a customer (stock down, money in) or buy stock (stock up, money out).
export function MoveSheet({ type, product, products, onClose, onDone }) {
  const { today, modes } = useApp()
  const selling = type === 'sell'
  const choices = products.filter((p) => p.active || p.id === product?.id)
  const priceOf = (p) => (!p ? '' : selling ? String(p.sellPrice) : p.buyPrice ? String(p.buyPrice) : '')
  const [productId, setProductId] = useState(product?.id || '')
  const [qty, setQty] = useState('1')
  const [price, setPrice] = useState(priceOf(product))
  const [date, setDate] = useState(today)
  const [mode, setMode] = useState('Cash')
  const [customer, setCustomer] = useState('')
  const [note, setNote] = useState('')
  const { busy, error, run } = useAction()
  const chosen = products.find((p) => p.id === productId)
  const n = count(qty)
  const total = Math.round(n * (Number(price) || 0) * 100) / 100
  const tooMany = selling && chosen && n > chosen.stock

  const pick = (id) => {
    setProductId(id)
    setPrice(priceOf(products.find((p) => p.id === id)))
  }

  const save = async (e) => {
    e.preventDefault()
    const body = { type, productId, qty: n, unitPrice: Number(price) || 0, date, mode, customer, note }
    if (await run(() => api('/stock/moves', { method: 'POST', body }))) onDone()
  }

  return (
    <Sheet title={selling ? 'Sell' : 'Buy stock'} onClose={onClose}>
      {!choices.length ? (
        <div className="empty">Add a product first with + New product.</div>
      ) : (
        <form className="form" onSubmit={save}>
          <Field label="Product">
            <select value={productId} onChange={(e) => pick(e.target.value)} required>
              <option value="" disabled>
                Choose a product
              </option>
              {choices.map((p) => (
                <option key={p.id} value={p.id} disabled={selling && p.stock <= 0}>
                  {p.name} ({p.stock > 0 ? `${p.stock} in stock` : 'out of stock'})
                </option>
              ))}
            </select>
          </Field>
          <div className="field-row">
            <Field label="Quantity">
              <div className="qty">
                <button type="button" className="btn small" onClick={() => setQty(String(Math.max(1, n - 1)))} aria-label="One less">
                  −
                </button>
                <input type="number" inputMode="numeric" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} required />
                <button type="button" className="btn small" onClick={() => setQty(String(n + 1))} aria-label="One more">
                  +
                </button>
              </div>
            </Field>
            <Field label={selling ? 'Price per piece' : 'Cost per piece'}>
              <MoneyInput value={price} onChange={setPrice} required placeholder="0" />
            </Field>
          </div>
          {tooMany ? (
            <div className="box error">Only {chosen.stock} in stock.</div>
          ) : (
            <div className="box info">
              {selling ? 'Customer pays' : 'You pay'} <b>{money(total)}</b>
              {chosen && ` · stock after this: ${chosen.stock + (selling ? -n : n)}`}
            </div>
          )}
          <div className="field-row">
            <Field label="Date">
              <DateInput value={date} onChange={setDate} max={today} required />
            </Field>
            <Field label="Paid by">
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                {modes.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
          </div>
          {selling && (
            <Field label="Sold to (optional)">
              <input value={customer} onChange={(e) => setCustomer(capTyped(e))} maxLength={60} placeholder="Member or customer name" />
            </Field>
          )}
          <Field label="Note (optional)">
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder={selling ? 'e.g. chocolate flavour' : 'e.g. bill no. 245, supplier name'} />
          </Field>
          <ErrorBox error={error} />
          <button className="btn primary block" disabled={busy || !productId || n < 1 || tooMany}>
            {busy ? 'Saving…' : selling ? `Save sale of ${money(total)}` : `Save purchase of ${money(total)}`}
          </button>
        </form>
      )}
    </Sheet>
  )
}

// Details of one sale / purchase / count change, with a way to delete a wrong entry.
export function MoveDetailSheet({ move, onClose, onDone }) {
  const { busy, error, run } = useAction()
  const hasMoney = move.type !== 'adjust'
  const rows = [
    ['Date', fmtDate(move.date)],
    ['Quantity', `${move.qty} ${Math.abs(move.qty) === 1 ? 'piece' : 'pieces'}`],
    hasMoney && ['Price per piece', money(move.unitPrice)],
    hasMoney && ['Total', money(move.amount)],
    hasMoney && ['Paid by', move.mode],
    move.type === 'sell' && move.unitCost > 0 && ['Profit', money(move.amount - move.unitCost * move.qty)],
    move.customer && ['Sold to', move.customer],
    move.note && ['Note', move.note],
  ].filter(Boolean)

  const remove = async () => {
    const effect = {
      sell: 'The pieces go back into stock and the sale is taken out of income.',
      buy: 'These pieces come off the stock and the purchase is taken out of expenses.',
      adjust: 'The stock count goes back to what it was.',
    }[move.type]
    if (!window.confirm(`Delete this entry? ${effect}`)) return
    if (await run(() => api(`/stock/moves/${move.id}`, { method: 'DELETE' }))) onDone()
  }

  return (
    <Sheet title={moveTitle(move)} onClose={onClose}>
      <div className="form">
        <div>
          {rows.map(([label, value]) => (
            <div key={label} className="kv">
              <span>{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
        <p className="hint">Made a mistake? Delete this entry and add it again.</p>
        <ErrorBox error={error} />
        <button type="button" className="btn danger block" disabled={busy} onClick={remove}>
          Delete this entry
        </button>
      </div>
    </Sheet>
  )
}
