import { yearsBetween } from '../../../shared/domain.mjs'
import { useApp } from '../context.js'
import { money } from '../format.js'
import { Field } from './ui.jsx'

export function MoneyInput({ value, onChange, ...rest }) {
  return <input type="number" inputMode="decimal" min="0" step="any" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
}

export function DateInput({ value, onChange, ...rest }) {
  return <input type="date" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
}

// Mobile number: digits only, never more than 10. Optional, but if filled it must be all 10.
export function PhoneInput({ value, onChange, ...rest }) {
  return (
    <input
      type="tel"
      inputMode="numeric"
      autoComplete="off"
      maxLength={10}
      pattern="\d{10}"
      title="Enter the 10 digit mobile number"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
      {...rest}
    />
  )
}

// Address, date of birth and age. All optional. value: { address, dob, age }
// Age fills itself in from the date of birth; without one it can be typed.
export function PersonalFields({ value, onChange }) {
  const { today } = useApp()
  const set = (patch) => onChange({ ...value, ...patch })
  return (
    <>
      <Field label="Full address">
        <textarea value={value.address} onChange={(e) => set({ address: e.target.value })} maxLength={300} rows={2} />
      </Field>
      <div className="field-row">
        <Field label="Date of birth">
          <DateInput value={value.dob} max={today} min="1900-01-01" onChange={(dob) => set({ dob, age: dob ? String(Math.max(yearsBetween(dob, today), 0)) : '' })} />
        </Field>
        <Field label="Age">
          <input
            type="number"
            inputMode="numeric"
            min="1"
            max="120"
            value={value.age}
            readOnly={!!value.dob}
            onChange={(e) => set({ age: e.target.value.replace(/\D/g, '').slice(0, 3) })}
          />
        </Field>
      </div>
    </>
  )
}

// keep: a plan to show even if it has been switched off (the one already on a membership).
export function PlanPicker({ value, onChange, keep }) {
  const { plans } = useApp()
  const list = plans.filter((p) => p.active || p.id === keep)
  if (!list.length) return <div className="box warn">No plans yet. Add one under More → Plans.</div>
  return (
    <div className="plan-grid">
      {list.map((p) => (
        <button type="button" key={p.id} className={`plan ${p.id === value ? 'active' : ''}`} aria-pressed={p.id === value} onClick={() => onChange(p)}>
          <b>{p.name}</b>
          {p.price > 0 && <small>{money(p.price)}</small>}
        </button>
      ))}
    </div>
  )
}

// "Received now" block used at admission and renewal. value: { amount, date, mode, promisedDate }
export function PayNowFields({ total, value, onChange }) {
  const { modes, today } = useApp()
  const set = (patch) => onChange({ ...value, ...patch })
  const amount = Number(value.amount) || 0
  return (
    <>
      <Field label="Amount received now">
        <MoneyInput value={value.amount} onChange={(v) => set({ amount: v })} placeholder="0" />
      </Field>
      <div className="chips wrap">
        <button type="button" className="chip" onClick={() => set({ amount: String(total) })}>
          Full {money(total)}
        </button>
        <button type="button" className="chip" onClick={() => set({ amount: '' })}>
          Nothing now
        </button>
      </div>
      {amount > 0 && (
        <div className="field-row">
          <Field label="Payment date">
            <DateInput value={value.date} onChange={(v) => set({ date: v })} max={today} required />
          </Field>
          <Field label="Mode">
            <select value={value.mode} onChange={(e) => set({ mode: e.target.value })}>
              {modes.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
        </div>
      )}
      {amount > total ? (
        <div className="box error">This is more than the total of {money(total)}.</div>
      ) : (
        <div className={`box ${total - amount > 0 ? 'warn' : 'info'}`}>
          Total {money(total)} · Balance after this: <b>{money(total - amount)}</b>
        </div>
      )}
      {total - amount > 0 && (
        <Field label="Balance promised by (optional)">
          <DateInput value={value.promisedDate} onChange={(v) => set({ promisedDate: v })} min={today} />
        </Field>
      )}
    </>
  )
}
