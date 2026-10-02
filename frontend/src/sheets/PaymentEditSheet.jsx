import { useState } from 'react'
import { api, useAction, useLoad } from '../api.js'
import { DateInput, MoneyInput } from '../components/fields.jsx'
import { ErrorBox, Field, Loading, Sheet } from '../components/ui.jsx'
import { useApp } from '../context.js'
import { fmtDate, money } from '../format.js'

// Fix a payment: wrong amount, wrong date, wrong member, or entered by mistake.
export default function PaymentEditSheet({ payment, onClose, onDone }) {
  const { modes, today } = useApp()
  const [amount, setAmount] = useState(String(payment.amount))
  const [date, setDate] = useState(payment.date)
  const [mode, setMode] = useState(payment.mode)
  const [note, setNote] = useState(payment.note || '')
  const [moving, setMoving] = useState(false)
  const { busy, error, run } = useAction()
  const isRefund = payment.type === 'refund'
  const word = isRefund ? 'refund' : 'payment'

  const save = async (e) => {
    e.preventDefault()
    const saved = await run(() => api(`/payments/${payment.id}`, { method: 'PATCH', body: { amount: Number(amount), date, mode, note } }))
    if (saved) onDone()
  }

  const cancelEntry = async () => {
    const reason = window.prompt(`Cancel this ${word} of ${money(payment.amount)}? It stays in the history, struck out.\n\nReason (optional):`, '')
    if (reason === null) return
    const saved = await run(() => api(`/payments/${payment.id}/void`, { method: 'POST', body: { reason } }))
    if (saved) onDone()
  }

  const moveTo = async (target) => {
    if (!window.confirm(`Move this payment of ${money(payment.amount)} to ${target.name} (#${target.memberNo})?`)) return
    const saved = await run(() => api(`/payments/${payment.id}/move`, { method: 'POST', body: { memberId: target.id } }))
    if (saved) onDone()
  }

  const log = payment.history?.length > 0 && (
    <details className="log">
      <summary>Changes ({payment.history.length})</summary>
      <ul>
        {payment.history.map((h, i) => (
          <li key={i}>
            {fmtDate(h.at.slice(0, 10))}: {h.text}
          </li>
        ))}
      </ul>
    </details>
  )

  if (payment.voided) {
    return (
      <Sheet title={`Cancelled ${word}`} onClose={onClose}>
        <div className="box warn">
          {money(payment.amount)} on {fmtDate(payment.date)} was cancelled{payment.voidReason ? `: ${payment.voidReason}` : '.'}
        </div>
        {log}
      </Sheet>
    )
  }

  if (moving) {
    return (
      <Sheet title="Move payment to…" onClose={() => setMoving(false)}>
        <ErrorBox error={error} />
        <MemberPicker excludeId={payment.memberId} onPick={moveTo} busy={busy} />
      </Sheet>
    )
  }

  return (
    <Sheet title={`Edit ${word}`} onClose={onClose}>
      <form className="form" onSubmit={save}>
        <Field label="Amount">
          <MoneyInput value={amount} onChange={setAmount} required />
        </Field>
        <div className="field-row">
          <Field label="Date">
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
        <Field label="Note">
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
        </Field>
        <ErrorBox error={error} />
        <button className="btn primary block" disabled={busy || !(Number(amount) > 0)}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        {!isRefund && (
          <button type="button" className="btn block" disabled={busy} onClick={() => setMoving(true)}>
            Recorded on wrong member? Move it
          </button>
        )}
        <button type="button" className="btn danger block" disabled={busy} onClick={cancelEntry}>
          Cancel this entry
        </button>
        {log}
      </form>
    </Sheet>
  )
}

function MemberPicker({ excludeId, onPick, busy }) {
  const { data, error } = useLoad('/members')
  const [q, setQ] = useState('')
  if (!data) return <Loading error={error} />
  const text = q.trim().toLowerCase()
  const list = data.filter((m) => m.id !== excludeId && (!text || m.name.toLowerCase().includes(text) || m.phone.includes(text) || String(m.memberNo) === text))
  return (
    <div className="form">
      <input className="search" placeholder="Search name, phone or number" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className="list">
        {list.slice(0, 30).map((m) => (
          <button type="button" key={m.id} className="radio-card" disabled={busy} onClick={() => onPick(m)}>
            <b>{m.name}</b>
            <small>
              #{m.memberNo}
              {m.phone ? ` · ${m.phone}` : ''}
              {m.balance > 0 ? ` · due ${money(m.balance)}` : ''}
            </small>
          </button>
        ))}
        {!list.length && <div className="empty">No member found</div>}
      </div>
    </div>
  )
}
