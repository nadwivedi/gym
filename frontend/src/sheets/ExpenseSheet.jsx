import { useState } from 'react'
import { api, useAction } from '../api.js'
import { DateInput, MoneyInput } from '../components/fields.jsx'
import { ErrorBox, Field, Group, Sheet } from '../components/ui.jsx'
import { useApp } from '../context.js'
import { money } from '../format.js'

// Add an expense, or fix / delete one. expense = null for a new one.
export default function ExpenseSheet({ expense, onClose, onDone }) {
  const { today, modes, expenseCategories, reloadApp } = useApp()
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
  const [categoryId, setCategoryId] = useState(expense?.categoryId || '')
  const [date, setDate] = useState(expense?.date || today)
  const [mode, setMode] = useState(expense?.mode || 'Cash')
  const [note, setNote] = useState(expense?.note || '')
  const { busy, error, run } = useAction()
  // A switched-off category is still shown on the expense that already uses it.
  const categories = expenseCategories.filter((c) => c.active || c.id === categoryId)

  const save = async (e) => {
    e.preventDefault()
    const body = { amount: Number(amount), categoryId, date, mode, note }
    const saved = await run(() => (expense ? api(`/expenses/${expense.id}`, { method: 'PATCH', body }) : api('/expenses', { method: 'POST', body })))
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

  return (
    <Sheet title={expense ? 'Edit expense' : 'Add expense'} onClose={onClose}>
      <form className="form" onSubmit={save}>
        <Field label="Amount spent">
          <MoneyInput value={amount} onChange={setAmount} required autoFocus={!expense} />
        </Field>
        <Group label="Category">
          <div className="chips wrap">
            {categories.map((c) => (
              <button type="button" key={c.id} className={`chip ${c.id === categoryId ? 'active' : ''}`} aria-pressed={c.id === categoryId} onClick={() => setCategoryId(c.id)}>
                {c.name}
              </button>
            ))}
            <button type="button" className="chip dashed" disabled={busy} onClick={addCategory}>
              + New category
            </button>
          </div>
        </Group>
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
        <Field label="Note (optional)">
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="e.g. October bill" />
        </Field>
        <ErrorBox error={error} />
        <button className="btn primary block" disabled={busy || !(Number(amount) > 0) || !categoryId}>
          {busy ? 'Saving…' : expense ? 'Save changes' : 'Save expense'}
        </button>
        {expense && (
          <button type="button" className="btn danger block" disabled={busy} onClick={remove}>
            Delete expense
          </button>
        )}
      </form>
    </Sheet>
  )
}
