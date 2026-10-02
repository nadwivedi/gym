import { useState } from 'react'
import { api, download, setToken, useAction } from '../api.js'
import { MoneyInput } from '../components/fields.jsx'
import { Link } from 'react-router-dom'
import { ErrorBox, Field, Icon } from '../components/ui.jsx'
import { useApp } from '../context.js'

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
        <div className="section-title">Plans and prices</div>
        <Plans />

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

function Plans() {
  const { plans, reloadApp } = useApp()
  return (
    <div className="list">
      {plans.map((p) => (
        <PlanForm key={p.id} plan={p} onSaved={reloadApp} />
      ))}
      <PlanForm key={`new-${plans.length}`} onSaved={reloadApp} />
    </div>
  )
}

function PlanForm({ plan, onSaved }) {
  const [name, setName] = useState(plan?.name || '')
  const [months, setMonths] = useState(String(plan?.months || ''))
  const [price, setPrice] = useState(String(plan?.price ?? ''))
  const { busy, error, run } = useAction()
  const changed = !plan || name !== plan.name || months !== String(plan.months) || price !== String(plan.price)

  const save = async (e) => {
    e.preventDefault()
    const body = { name, months: Number(months), price: Number(price) || 0 }
    const saved = await run(() => (plan ? api(`/plans/${plan.id}`, { method: 'PATCH', body }) : api('/plans', { method: 'POST', body })))
    if (saved) onSaved()
  }
  const toggle = async () => {
    if (await run(() => api(`/plans/${plan.id}`, { method: 'PATCH', body: { active: !plan.active } }))) onSaved()
  }

  return (
    <form className="card form" onSubmit={save}>
      <Field label={plan ? 'Plan name' : 'Add a new plan'}>
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
      {plan && !plan.active && <div className="box warn">Switched off: not offered for new admissions or renewals.</div>}
      <ErrorBox error={error} />
      <div className="btn-grid">
        <button className="btn small primary" disabled={busy || !changed}>
          {plan ? 'Save' : 'Add plan'}
        </button>
        {plan && (
          <button type="button" className="btn small" disabled={busy} onClick={toggle}>
            {plan.active ? 'Switch off' : 'Switch on'}
          </button>
        )}
      </div>
    </form>
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
