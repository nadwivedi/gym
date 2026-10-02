import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addMonths } from '../../../shared/domain.mjs'
import { api, saveWithDuplicateCheck, useAction } from '../api.js'
import { DateInput, MoneyInput, PayNowFields, PersonalFields, PhoneInput, PlanPicker } from '../components/fields.jsx'
import { ErrorBox, Field, Group, Section, Sheet } from '../components/ui.jsx'
import { useApp } from '../context.js'
import { fmtDate, payNowBody, personalBody, promisedBody } from '../format.js'

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
    navigate(`/members/${saved.member.id}`)
  }

  return (
    // A stray tap outside must not throw away a half-filled form: only the cross closes it.
    <Sheet title="New admission" onClose={onClose} closeOnBackdrop={false}>
      <form className="form" onSubmit={submit}>
        <Section num="1" title="Member">
          <Field label="Member name">
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoComplete="off" autoFocus />
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
              <MoneyInput value={fee} onChange={setFee} required />
            </Field>
            <Field label="Admission fee">
              <MoneyInput value={admissionFee} onChange={setAdmissionFee} />
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
