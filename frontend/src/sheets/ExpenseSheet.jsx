import { useState } from 'react'
import { api, download, upload, useAction } from '../api.js'
import { DateInput, MoneyInput } from '../components/fields.jsx'
import { ErrorBox, Field, Icon, Section, Sheet } from '../components/ui.jsx'
import { useApp } from '../context.js'
import { money } from '../format.js'

// What the server accepts as a receipt (routes.js): a photo or a PDF, up to 8 MB.
const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const RECEIPT_MAX = 8 * 1024 * 1024
const fileSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

// Add an expense, or fix / delete one. expense = null for a new one.
export default function ExpenseSheet({ expense, onClose, onDone }) {
  const { today, modes, expenseCategories, reloadApp } = useApp()
  const [name, setName] = useState(expense?.name || '')
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
  const [categoryId, setCategoryId] = useState(expense?.categoryId || '')
  const [date, setDate] = useState(expense?.date || today)
  const [mode, setMode] = useState(expense?.mode || 'Cash')
  const [status, setStatus] = useState(expense?.status || 'paid')
  const [paidTo, setPaidTo] = useState(expense?.paidTo || '')
  const [invoiceNo, setInvoiceNo] = useState(expense?.invoiceNo || '')
  const [note, setNote] = useState(expense?.note || '')
  // The receipt already saved (its name and size), and a new file picked now. Nothing is sent until Save.
  const [kept, setKept] = useState(expense?.receiptName ? { name: expense.receiptName, size: expense.receiptSize } : null)
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  // Set once the expense itself is saved: if only the receipt then fails, trying again must not add the expense twice.
  const [savedId, setSavedId] = useState(expense?.id || null)
  const { busy, error, run } = useAction()
  // A switched-off category is still shown on the expense that already uses it.
  const categories = expenseCategories.filter((c) => c.active || c.id === categoryId)

  const save = async (e) => {
    e.preventDefault()
    const body = { name, amount: Number(amount), categoryId, date, mode, status, paidTo, invoiceNo, note }
    const saved = await run(async () => {
      const row = savedId ? await api(`/expenses/${savedId}`, { method: 'PATCH', body }) : await api('/expenses', { method: 'POST', body })
      setSavedId(row.id)
      if (file) await upload(`/expenses/${row.id}/receipt?name=${encodeURIComponent(file.name)}`, file)
      else if (!kept && row.receiptName) await api(`/expenses/${row.id}/receipt`, { method: 'DELETE' })
      return row
    })
    if (saved) onDone()
  }

  const remove = async () => {
    if (!window.confirm(`Delete this expense of ${money(expense.amount)}?`)) return
    if (await run(() => api(`/expenses/${expense.id}`, { method: 'DELETE' }))) onDone()
  }

  const addCategory = async () => {
    const name = window.prompt('Name of the new expense category:', '')
    if (!name?.trim()) return
    const created = await run(() => api('/expense-categories', { method: 'POST', body: { name } }))
    if (!created) return
    reloadApp()
    setCategoryId(created.id)
  }

  const pick = (e) => {
    const picked = e.target.files[0]
    e.target.value = '' // so the same file can be picked again after Remove
    if (!picked) return
    if (!RECEIPT_TYPES.includes(picked.type)) return setFileError('Choose a JPG, PNG or WebP photo, or a PDF.')
    if (picked.size > RECEIPT_MAX) return setFileError(`That file is ${fileSize(picked.size)}. A receipt can be up to 8 MB.`)
    setFileError('')
    setFile(picked)
  }
  const dropReceipt = () => {
    setFile(null)
    setKept(null)
    setFileError('')
  }
  const receipt = file || kept
  // An expense that was saved while its receipt failed is in the list already: closing must show it.
  const close = () => (savedId && !expense ? onDone() : onClose())

  return (
    <Sheet title={expense ? 'Edit Expense' : 'Add Expense'} onClose={close}>
      <form className="form" onSubmit={save}>
        <Section num="1" title="Expense">
          <Field label="Expense name">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required={!expense} autoFocus={!expense} placeholder="e.g. October electricity bill" />
          </Field>
          <div className="field-row">
            <div className="field">
              <span className="field-head">
                Category
                <button type="button" className="link" disabled={busy} onClick={addCategory}>
                  + New
                </button>
              </span>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required aria-label="Category">
                <option value="" disabled>
                  Choose…
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Amount">
              <MoneyInput value={amount} onChange={setAmount} required placeholder="0" />
            </Field>
          </div>
        </Section>

        <Section num="2" title="Payment">
          <div className="field-row">
            <Field label="Expense date">
              <DateInput value={date} onChange={setDate} max={today} required />
            </Field>
            <Field label="Payment method">
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                {modes.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="field-row">
            <Field label="Payment status">
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </Field>
            <Field label="Paid to / vendor">
              <input value={paidTo} onChange={(e) => setPaidTo(e.target.value)} maxLength={80} placeholder="Who was paid" />
            </Field>
          </div>
          <Field label="Invoice / receipt number">
            <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} maxLength={40} placeholder="Optional" />
          </Field>
        </Section>

        <Section num="3" title="Notes and receipt">
          <Field label="Description / notes">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={2} placeholder="Optional" />
          </Field>
          <div className="field">
            <span>Receipt</span>
            {receipt ? (
              <div className="upload has">
                <span className="upload-icon">
                  <Icon name="receipt" />
                </span>
                <div className="row-main">
                  <div className="row-title">{receipt.name}</div>
                  <div className="row-sub">
                    {fileSize(receipt.size)}
                    {file ? ' · saved when you tap the button below' : ''}
                  </div>
                </div>
                {!file && (
                  <button type="button" className="btn small" disabled={busy} onClick={() => run(() => download(`/expenses/${savedId}/receipt`, kept.name).then(() => true))}>
                    View
                  </button>
                )}
                <button type="button" className="btn small" disabled={busy} onClick={dropReceipt}>
                  Remove
                </button>
              </div>
            ) : (
              <label className="upload">
                <input type="file" accept={RECEIPT_TYPES.join(',')} onChange={pick} aria-label="Upload receipt" />
                <span className="upload-icon">
                  <Icon name="upload" />
                </span>
                <b>Upload receipt</b>
                <small>A photo or PDF of the bill, up to 8 MB</small>
              </label>
            )}
            {fileError && <div className="box error">{fileError}</div>}
          </div>
        </Section>

        <ErrorBox error={error} />
        <div className="btn-grid">
          <button type="button" className="btn" disabled={busy} onClick={close}>
            Cancel
          </button>
          <button className="btn primary" disabled={busy || !(Number(amount) > 0) || !categoryId}>
            {busy ? 'Saving…' : expense ? 'Save changes' : 'Add Expense'}
          </button>
        </div>
        {expense && (
          <button type="button" className="btn danger block" disabled={busy} onClick={remove}>
            Delete expense
          </button>
        )}
      </form>
    </Sheet>
  )
}
