import { useState } from 'react'
import { api, download, setToken, useAction } from '../api.js'
import { Link } from 'react-router-dom'
import { MoneyInput } from '../components/fields.jsx'
import { Badge, ErrorBox, Field, Group, Icon, Sheet } from '../components/ui.jsx'
import { useApp } from '../context.js'
import { money } from '../format.js'

export default function More({ onLock }) {
  const { today } = useApp()
  const exp = useAction()
  const get = (path, name) => exp.run(() => download(path, name).then(() => true))
  return (
    <>
      <header className="topbar">
        <Link to="/" className="btn small" aria-label="Back to dashboard">
          <Icon name="back" />
        </Link>
        <h1>Settings</h1>
      </header>
      <div className="page">
        <Plans />
        <ExpenseCategories />

        <div className="section-title">Settings</div>
        <Settings />

        <div className="section-title">Backup</div>
        <div className="card form">
          <p className="hint">Download your records regularly and keep a copy somewhere safe. The CSV files open in Excel.</p>
          <button className="btn block" disabled={exp.busy} onClick={() => get('/export/members.csv', `members-${today}.csv`)}>
            Members (Excel / CSV)
          </button>
          <button className="btn block" disabled={exp.busy} onClick={() => get('/export/payments.csv', `payments-${today}.csv`)}>
            Payments (Excel / CSV)
          </button>
          <button className="btn block" disabled={exp.busy} onClick={() => get('/export/expenses.csv', `expenses-${today}.csv`)}>
            Expenses (Excel / CSV)
          </button>
          <button className="btn block" disabled={exp.busy} onClick={() => get('/export/backup.json', `gym-backup-${today}.json`)}>
            Full backup file
          </button>
          <ErrorBox error={exp.error} />
        </div>

        <div className="section-title">Security</div>
        <ChangePin />
        <button className="btn block" onClick={onLock}>
          Lock app
        </button>
      </div>
    </>
  )
}

// Expense categories: the five defaults plus any the owner adds. Tap one to rename it or switch it off.
function ExpenseCategories() {
  const { expenseCategories, reloadApp } = useApp()
  const [editing, setEditing] = useState(null) // a category, or 'new'
  const saved = () => {
    setEditing(null)
    reloadApp()
  }
  return (
    <>
      <div className="section-title">
        Expense categories
        <button className="btn small primary" onClick={() => setEditing('new')}>
          + Add category
        </button>
      </div>
      <div className="card chips wrap pad">
        {expenseCategories.map((c) => (
          <button key={c.id} className={`chip ${c.active ? '' : 'off'}`} onClick={() => setEditing(c)} aria-label={`Edit category ${c.name}`}>
            {c.name}
            {!c.active && <small>off</small>}
          </button>
        ))}
      </div>
      {editing && <CategorySheet category={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={saved} />}
    </>
  )
}

function CategorySheet({ category, onClose, onSaved }) {
  const [name, setName] = useState(category?.name || '')
  const [active, setActive] = useState(category?.active ?? true)
  const { busy, error, run } = useAction()

  const save = async (e) => {
    e.preventDefault()
    const saved = await run(() =>
      category ? api(`/expense-categories/${category.id}`, { method: 'PATCH', body: { name, active } }) : api('/expense-categories', { method: 'POST', body: { name } }),
    )
    if (saved) onSaved()
  }

  return (
    <Sheet title={category ? `Edit ${category.name}` : 'New expense category'} onClose={onClose}>
      <form className="form" onSubmit={save}>
        <Field label="Category name">
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} placeholder="e.g. Rent" autoFocus={!category} />
        </Field>
        {category && (
          <Group label="Use this category">
            <div className="btn-grid">
              <button type="button" className={`chip ${active ? 'active' : ''}`} aria-pressed={active} onClick={() => setActive(true)}>
                On
              </button>
              <button type="button" className={`chip ${active ? '' : 'active'}`} aria-pressed={!active} onClick={() => setActive(false)}>
                Off
              </button>
            </div>
            {!active && <p className="hint">Off: not offered when adding an expense. Old expenses keep it.</p>}
          </Group>
        )}
        <ErrorBox error={error} />
        <button className="btn primary block" disabled={busy}>
          {busy ? 'Saving…' : category ? 'Save category' : 'Add category'}
        </button>
      </form>
    </Sheet>
  )
}

// One short row per plan; tapping a row opens a popup to change it.
function Plans() {
  const { plans, reloadApp } = useApp()
  const [editing, setEditing] = useState(null) // a plan, or 'new'
  const saved = () => {
    setEditing(null)
    reloadApp()
  }
  return (
    <>
      <div className="section-title">
        Plans and prices
        <button className="btn small primary" onClick={() => setEditing('new')}>
          + Add plan
        </button>
      </div>
      <div className="card plan-list">
        {plans.map((p) => (
          <button key={p.id} className={`plan-row ${p.active ? '' : 'off'}`} onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}>
            <span className="plan-months">
              <b>{p.months}</b>
              mo
            </span>
            <span className="row-main">
              <span className="row-title">{p.name}</span>
              {!p.active && <Badge>Off</Badge>}
            </span>
            <b className="plan-price">{p.price > 0 ? money(p.price) : 'Set price'}</b>
            <Icon name="back" />
          </button>
        ))}
        {!plans.length && <div className="empty">No plans yet. Tap + Add plan.</div>}
      </div>
      {editing && <PlanSheet plan={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={saved} />}
    </>
  )
}

function PlanSheet({ plan, onClose, onSaved }) {
  const [name, setName] = useState(plan?.name || '')
  const [months, setMonths] = useState(String(plan?.months || ''))
  const [price, setPrice] = useState(plan ? String(plan.price) : '')
  const [active, setActive] = useState(plan?.active ?? true)
  const { busy, error, run } = useAction()

  const save = async (e) => {
    e.preventDefault()
    const body = { name, months: Number(months), price: Number(price) || 0 }
    const saved = await run(() => (plan ? api(`/plans/${plan.id}`, { method: 'PATCH', body: { ...body, active } }) : api('/plans', { method: 'POST', body })))
    if (saved) onSaved()
  }

  return (
    <Sheet title={plan ? `Edit ${plan.name}` : 'New plan'} onClose={onClose}>
      <form className="form" onSubmit={save}>
        <Field label="Plan name">
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder="e.g. 3 Months" />
        </Field>
        <div className="field-row">
          <Field label="Months">
            <input type="number" inputMode="numeric" min="1" max="60" value={months} onChange={(e) => setMonths(e.target.value)} required />
          </Field>
          <Field label="Price">
            <MoneyInput value={price} onChange={setPrice} required />
          </Field>
        </div>
        {plan && (
          <Group label="Offer this plan">
            <div className="btn-grid">
              <button type="button" className={`chip ${active ? 'active' : ''}`} aria-pressed={active} onClick={() => setActive(true)}>
                On
              </button>
              <button type="button" className={`chip ${active ? '' : 'active'}`} aria-pressed={!active} onClick={() => setActive(false)}>
                Off
              </button>
            </div>
            {!active && <p className="hint">Off: not offered for new admissions or renewals. Existing memberships keep it.</p>}
          </Group>
        )}
        <p className="hint">A new price applies to future admissions and renewals only.</p>
        <ErrorBox error={error} />
        <button className="btn primary block" disabled={busy}>
          {busy ? 'Saving…' : plan ? 'Save plan' : 'Add plan'}
        </button>
      </form>
    </Sheet>
  )
}

function Settings() {
  const { settings, reloadApp } = useApp()
  const [gymName, setGymName] = useState(settings.gymName)
  const [admissionFee, setAdmissionFee] = useState(String(settings.admissionFee))
  const [overdueDays, setOverdueDays] = useState(String(settings.overdueDays))
  const [countryCode, setCountryCode] = useState(settings.countryCode)
  const [saved, setSaved] = useState(false)
  const { busy, error, run } = useAction()

  const save = async (e) => {
    e.preventDefault()
    setSaved(false)
    const ok = await run(() =>
      api('/settings', { method: 'PATCH', body: { gymName, admissionFee: Number(admissionFee) || 0, overdueDays: Number(overdueDays), countryCode } }),
    )
    if (ok) {
      setSaved(true)
      reloadApp()
    }
  }

  return (
    <form className="card form" onSubmit={save}>
      <Field label="Gym name">
        <input value={gymName} onChange={(e) => setGymName(e.target.value)} required maxLength={60} />
      </Field>
      <div className="field-row">
        <Field label="Default admission fee">
          <MoneyInput value={admissionFee} onChange={setAdmissionFee} />
        </Field>
        <Field label="WhatsApp country code">
          <input inputMode="numeric" value={countryCode} onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, ''))} maxLength={4} required />
        </Field>
      </div>
      <Field label="Suggest hiding a member after this many overdue days">
        <input type="number" inputMode="numeric" min="1" max="365" value={overdueDays} onChange={(e) => setOverdueDays(e.target.value)} required />
      </Field>
      <ErrorBox error={error} />
      {saved && <div className="box info">Saved.</div>}
      <button className="btn primary block" disabled={busy}>
        {busy ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  )
}

function ChangePin() {
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [saved, setSaved] = useState(false)
  const { busy, error, run } = useAction()
  const pinProps = { type: 'password', inputMode: 'numeric', maxLength: 8, autoComplete: 'off', required: true }

  const save = async (e) => {
    e.preventDefault()
    setSaved(false)
    const res = await run(() => api('/auth/change-pin', { method: 'POST', body: { oldPin, newPin } }))
    if (!res) return
    setToken(res.token)
    setOldPin('')
    setNewPin('')
    setSaved(true)
  }

  return (
    <form className="card form" onSubmit={save}>
      <div className="field-row">
        <Field label="Current PIN">
          <input {...pinProps} value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))} />
        </Field>
        <Field label="New PIN (4 to 8 digits)">
          <input {...pinProps} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} />
        </Field>
      </div>
      <ErrorBox error={error} />
      {saved && <div className="box info">PIN changed. Other devices must enter the new PIN.</div>}
      <button className="btn block" disabled={busy || newPin.length < 4}>
        Change PIN
      </button>
    </form>
  )
}
