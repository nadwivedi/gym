import { useState } from 'react'
import { api, useAction, useLoad } from '../api.js'
import { DateInput, MoneyInput } from '../components/fields.jsx'
import { ErrorBox, Field, Loading, Sheet } from '../components/ui.jsx'
import { useApp } from '../context.js'
import { fmtDate, money } from '../format.js'

export default function PaymentSheet({ memberId, onClose, onDone }) {
  const { data, error } = useLoad(`/members/${memberId}`)
  return (
    <Sheet title={data ? `Payment: ${data.member.name}` : 'Record payment'} onClose={onClose}>
      {data ? <PaymentForm detail={data} onDone={onDone} /> : <Loading error={error} />}
    </Sheet>
  )
}

function PaymentForm({ detail, onDone }) {
  const { today, modes } = useApp()
  const open = detail.periods.filter((p) => p.status === 'ok')
  // Oldest membership that still has a balance, otherwise the newest one.
  const first = open.findLast((p) => p.balance > 0) || open[0]
  const [periodId, setPeriodId] = useState(first?.id)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today)
  const [mode, setMode] = useState('Cash')
  const [note, setNote] = useState('')
  const [promisedDate, setPromisedDate] = useState(first?.promisedDate || '')
  const { busy, error, run } = useAction()

  if (!first) return <div className="box warn">This member has no open membership. Renew first, then record the payment.</div>
  const period = open.find((p) => p.id === periodId)
  const value = Number(amount) || 0
  const remaining = period.balance - value

  const submit = async (e) => {
    e.preventDefault()
    let force = false
    if (value > period.balance) {
      if (!window.confirm(`${money(value)} is more than the balance of ${money(period.balance)}. Save anyway?`)) return
      force = true
    }
    const body = { periodId, amount: value, date, mode, note, force, promisedDate: remaining > 0 ? promisedDate : '' }
    const saved = await run(() => api('/payments', { method: 'POST', body }))
    if (saved) onDone(saved)
  }

  return (
    <form className="form" onSubmit={submit}>
      {open.length > 1 && (
        <Field label="For membership">
          <select
            value={periodId}
            onChange={(e) => {
              setPeriodId(e.target.value)
              setPromisedDate(open.find((p) => p.id === e.target.value)?.promisedDate || '')
            }}
          >
            {open.map((p) => (
              <option key={p.id} value={p.id}>
                {p.planName} from {fmtDate(p.startDate)} · balance {money(p.balance)}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className={`box ${period.balance > 0 ? 'warn' : 'info'}`}>
        {period.planName}: total {money(period.total)}, paid {money(period.paid)}, balance <b>{money(period.balance)}</b>
      </div>
      <Field label="Amount received">
        <MoneyInput value={amount} onChange={setAmount} required autoFocus />
      </Field>
      {period.balance > 0 && (
        <div className="chips wrap">
          <button type="button" className="chip" onClick={() => setAmount(String(period.balance))}>
            Full balance {money(period.balance)}
          </button>
        </div>
      )}
      <div className="field-row">
        <Field label="Payment date">
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
      {value > 0 && remaining > 0 && (
        <>
          <div className="box warn">
            Balance after this: <b>{money(remaining)}</b>
          </div>
          <Field label="Balance promised by (optional)">
            <DateInput value={promisedDate} onChange={setPromisedDate} />
          </Field>
        </>
      )}
      <Field label="Note (optional)">
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
      </Field>
      <ErrorBox error={error} />
      <button className="btn primary block" disabled={busy || value <= 0}>
        {busy ? 'Saving…' : `Save payment${value > 0 ? ` of ${money(value)}` : ''}`}
      </button>
    </form>
  )
}
