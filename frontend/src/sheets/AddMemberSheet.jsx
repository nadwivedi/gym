import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addMonths } from '../../../shared/domain.mjs'
import { api, saveWithDuplicateCheck, useAction } from '../api.js'
import { DateInput, MoneyInput, PayNowFields, PersonalFields, PhoneInput, PlanPicker } from '../components/fields.jsx'
import { ErrorBox, Field, Group, Section, Sheet } from '../components/ui.jsx'
import { useApp } from '../context.js'
import { capTyped, fmtDate, payNowBody, personalBody, promisedBody } from '../format.js'

// Typing into a fee that still shows the default 0 replaces it: 0 then "5" gives 5, not 05 or 50.
const overZero = (prev, set) => (v) => set(prev === '0' && /^\d\d$/.test(v) ? v.replace('0', '') : v)

export default function AddMemberSheet({ onClose }) {
  const { today, plans, settings } = useApp()
  const navigate = useNavigate()
  const firstPlan = plans.find((p) => p.active)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [notes, setNotes] = useState('')
  const [personal, setPersonal] = useState({ address: '', dob: '', age: '' })
  const [plan, setPlan] = useState(firstPlan)
  const [startDate, setStartDate] = useState(today)
  const [fee, setFee] = useState(firstPlan ? String(firstPlan.price) : '')
  const [admissionFee, setAdmissionFee] = useState(String(settings.admissionFee))
  const [pay, setPay] = useState({ amount: '', date: today, mode: 'Cash', promisedDate: '' })
  const { busy, error, run } = useAction()
  const admissionFeeRef = useRef(null)

  const total = (Number(fee) || 0) + (Number(admissionFee) || 0)
  const renewalDate = plan && startDate ? addMonths(startDate, plan.months) : ''

  const submit = async (e) => {
    e.preventDefault()
    const saved = await run(() =>
      saveWithDuplicateCheck((force) =>
        api('/members', {
          method: 'POST',
          body: {
            name,
            phone,
            gender,
            notes,
            ...personalBody(personal),
            force,
            membership: {
              planId: plan.id,
              startDate,
              fee: Number(fee) || 0,
              admissionFee: Number(admissionFee) || 0,
              promisedDate: promisedBody(pay, total),
            },
            payment: payNowBody(pay),
          },
        }),
      ),
    )
    if (!saved) return
    onClose()
    // Back to the list. The form is opened from that page, so the state tells it to load the new member.
    navigate('/members', { state: { added: saved.member.id } })
  }

  return (
    // A stray tap outside must not throw away a half-filled form: only the cross closes it.
    <Sheet title="New admission" onClose={onClose} closeOnBackdrop={false}>
      <form className="form" onSubmit={submit}>
        <Section num="1" title="Member">
          <Field label="Member name">
            <input value={name} onChange={(e) => setName(capTyped(e))} required maxLength={80} autoComplete="off" autoFocus />
          </Field>
          <div className="field-row">
            <Field label="Phone">
              <PhoneInput value={phone} onChange={setPhone} />
            </Field>
            <Field label="Gender">
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Not set</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </Field>
          </div>
          <details className="more">
            <summary>
              Additional details
              <small>address, date of birth, notes</small>
            </summary>
            <div className="form">
              <PersonalFields value={personal} onChange={setPersonal} />
              <Field label="Notes">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2} />
              </Field>
            </div>
          </details>
        </Section>

        <Section num="2" title="Membership">
          <Group label="Plan">
            <PlanPicker
              value={plan?.id}
              onChange={(p) => {
                setPlan(p)
                setFee(String(p.price))
              }}
            />
          </Group>
          <Field label="Membership starts on">
            <DateInput value={startDate} onChange={setStartDate} required />
          </Field>
          {renewalDate && (
            <div className="box info">
              {startDate > today ? 'Starts later. ' : ''}Next renewal date: <b>{fmtDate(renewalDate)}</b>
            </div>
          )}
          <div className="field-row">
            <Field label="Plan fee">
              <MoneyInput
                value={fee}
                onChange={overZero(fee, setFee)}
                required
                // Enter moves on to the admission fee instead of sending the half-filled form.
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  admissionFeeRef.current.focus()
                }}
              />
            </Field>
            <Field label="Admission fee">
              <MoneyInput ref={admissionFeeRef} value={admissionFee} onChange={overZero(admissionFee, setAdmissionFee)} />
            </Field>
          </div>
        </Section>

        <Section num="3" title="Payment">
          <PayNowFields total={total} value={pay} onChange={setPay} />
        </Section>

        <ErrorBox error={error} />
        <button className="btn primary block" disabled={busy || !plan || Number(pay.amount) > total}>
          {busy ? 'Saving…' : 'Admit member'}
        </button>
      </form>
    </Sheet>
  )
}
