import { useState } from 'react'
import { addMonths } from '../../../shared/domain.mjs'
import { api, useAction } from '../api.js'
import { DateInput, MoneyInput, PlanPicker } from '../components/fields.jsx'
import { ErrorBox, Field, Group, Sheet } from '../components/ui.jsx'
import { useApp } from '../context.js'
import { fmtDate, money } from '../format.js'

// Change plan, start date, renewal date, fee or the promised date of one membership.
export function EditPeriodSheet({ period, onClose, onDone }) {
  const [planId, setPlanId] = useState(period.planId)
  const [months, setMonths] = useState(period.months)
  const [startDate, setStartDate] = useState(period.startDate)
  const [renewalDate, setRenewalDate] = useState(period.renewalDate)
  const [fee, setFee] = useState(String(period.fee))
  const [admissionFee, setAdmissionFee] = useState(String(period.admissionFee))
  const [promisedDate, setPromisedDate] = useState(period.promisedDate || '')
  const [reason, setReason] = useState('')
  const { busy, error, run } = useAction()

  const datesChanged = startDate !== period.startDate || renewalDate !== period.renewalDate

  const submit = async (e) => {
    e.preventDefault()
    const saved = await run(() =>
      api(`/periods/${period.id}`, {
        method: 'PATCH',
        body: { planId: planId || undefined, startDate, renewalDate, fee: Number(fee), admissionFee: Number(admissionFee), promisedDate, reason },
      }),
    )
    if (saved) onDone(saved)
  }

  return (
    <Sheet title="Edit membership" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <Group label="Plan">
          <PlanPicker
            value={planId}
            keep={period.planId}
            onChange={(p) => {
              if (p.id === planId) return
              setPlanId(p.id)
              setMonths(p.months)
              setFee(String(p.price))
              if (startDate) setRenewalDate(addMonths(startDate, p.months))
            }}
          />
        </Group>
        <div className="field-row">
          <Field label="Start date">
            <DateInput
              value={startDate}
              required
              onChange={(v) => {
                setStartDate(v)
                if (v) setRenewalDate(addMonths(v, months))
              }}
            />
          </Field>
          <Field label="Next renewal date">
            <DateInput value={renewalDate} onChange={setRenewalDate} required />
          </Field>
        </div>
        <p className="hint">Changing the start date moves the renewal date with it. You can also set the renewal date by hand.</p>
        <div className="field-row">
          <Field label="Plan fee">
            <MoneyInput value={fee} onChange={setFee} required />
          </Field>
          <Field label="Admission fee">
            <MoneyInput value={admissionFee} onChange={setAdmissionFee} required />
          </Field>
        </div>
        {period.balance > 0 && (
          <Field label="Balance promised by (optional)">
            <DateInput value={promisedDate} onChange={setPromisedDate} />
          </Field>
        )}
        {datesChanged && (
          <Field label="Reason for changing dates">
            <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="e.g. was travelling" />
          </Field>
        )}
        <ErrorBox error={error} />
        <button className="btn primary block" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </Sheet>
  )
}

export function RefundSheet({ period, onClose, onDone }) {
  const { today, modes } = useApp()
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today)
  const [mode, setMode] = useState('Cash')
  const [note, setNote] = useState('')
  const [after, setAfter] = useState('end')
  const { busy, error, run } = useAction()
  const value = Number(amount) || 0
  const notStarted = period.startDate >= today

  const submit = async (e) => {
    e.preventDefault()
    const saved = await run(() => api(`/periods/${period.id}/refund`, { method: 'POST', body: { amount: value, date, mode, note, after } }))
    if (saved) onDone(saved)
  }

  return (
    <Sheet title="Refund" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="box info">
          {period.planName}: received {money(period.netPaid)}. You can refund up to that amount.
        </div>
        <Field label="Refund amount">
          <MoneyInput value={amount} onChange={setAmount} required max={period.netPaid} />
        </Field>
        <div className="chips wrap">
          <button type="button" className="chip" onClick={() => setAmount(String(period.netPaid))}>
            Full {money(period.netPaid)}
          </button>
        </div>
        <div className="field-row">
          <Field label="Refund date">
            <DateInput value={date} onChange={setDate} max={today} required />
          </Field>
          <Field label="Mode">
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              {modes.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="field">
          <span>After the refund</span>
          <button type="button" className={`radio-card ${after === 'end' ? 'active' : ''}`} onClick={() => setAfter('end')}>
            <b>Member is leaving</b>
            <small>
              {notStarted ? 'Membership is cancelled' : 'Membership ends today'}, any balance is dropped and the member is hidden from renewals.
            </small>
          </button>
          <button type="button" className={`radio-card ${after === 'continue' ? 'active' : ''}`} onClick={() => setAfter('continue')}>
            <b>Membership continues</b>
            <small>Only money is returned. Renewal stays {fmtDate(period.renewalDate)}.</small>
          </button>
        </div>
        <Field label="Note (optional)">
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
        </Field>
        <ErrorBox error={error} />
        <button className="btn primary block" disabled={busy || value <= 0 || value > period.netPaid}>
          {busy ? 'Saving…' : `Refund ${money(value)}`}
        </button>
      </form>
    </Sheet>
  )
}

// For a member who will never pay the remaining amount.
export function WaiveSheet({ period, onClose, onDone }) {
  const [note, setNote] = useState('')
  const { busy, error, run } = useAction()

  const submit = async (e) => {
    e.preventDefault()
    const saved = await run(() => api(`/periods/${period.id}/waive`, { method: 'POST', body: { note } }))
    if (saved) onDone(saved)
  }

  return (
    <Sheet title="Waive balance" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="box warn">
          The balance of <b>{money(period.balance)}</b> will be removed from pending dues. You can undo this later.
        </div>
        <Field label="Reason (optional)">
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="e.g. stopped coming" />
        </Field>
        <ErrorBox error={error} />
        <button className="btn primary block" disabled={busy}>
          {busy ? 'Saving…' : `Waive ${money(period.balance)}`}
        </button>
      </form>
    </Sheet>
  )
}
