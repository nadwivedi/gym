import { useState } from 'react'
import { memberAge } from '../../../shared/domain.mjs'
import { api, saveWithDuplicateCheck, useAction } from '../api.js'
import { DateInput, PersonalFields, PhoneInput } from '../components/fields.jsx'
import { ErrorBox, Field, Sheet } from '../components/ui.jsx'
import { useApp } from '../context.js'
import { personalBody } from '../format.js'

const HIDE_REASONS = ['Not coming', 'Joined another gym', 'Moved away', 'Health / injury', 'Will join later']

export function HideSheet({ member, onClose, onDone }) {
  const [reason, setReason] = useState(HIDE_REASONS[0])
  const [other, setOther] = useState('')
  const { busy, error, run } = useAction()

  const submit = async (e) => {
    e.preventDefault()
    const saved = await run(() => api(`/members/${member.id}/hide`, { method: 'POST', body: { reason: other.trim() || reason } }))
    if (saved) onDone(saved)
  }

  return (
    <Sheet title={`Hide ${member.name}`} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <p className="hint">
          The member leaves the renewal lists and moves to the Hidden tab. Nothing is deleted. When they come back, use Rejoin to give a new
          join date.
        </p>
        <div className="chips wrap">
          {HIDE_REASONS.map((r) => (
            <button type="button" key={r} className={`chip ${!other.trim() && reason === r ? 'active' : ''}`} onClick={() => (setReason(r), setOther(''))}>
              {r}
            </button>
          ))}
        </div>
        <Field label="Other reason (optional)">
          <input value={other} onChange={(e) => setOther(e.target.value)} maxLength={200} />
        </Field>
        <ErrorBox error={error} />
        <button className="btn primary block" disabled={busy}>
          {busy ? 'Saving…' : 'Hide from renewals'}
        </button>
      </form>
    </Sheet>
  )
}

export function EditMemberSheet({ member, onClose, onDone, onDeleted }) {
  const [name, setName] = useState(member.name)
  const [phone, setPhone] = useState(member.phone)
  const [gender, setGender] = useState(member.gender || '')
  const [joinDate, setJoinDate] = useState(member.joinDate || '')
  const [notes, setNotes] = useState(member.notes || '')
  const { today } = useApp()
  const [personal, setPersonal] = useState({ address: member.address || '', dob: member.dob || '', age: String(memberAge(member, today) ?? '') })
  const { busy, error, run } = useAction()

  const submit = async (e) => {
    e.preventDefault()
    const body = { name, phone, gender, joinDate, notes, ...personalBody(personal) }
    const saved = await run(() => saveWithDuplicateCheck((force) => api(`/members/${member.id}`, { method: 'PATCH', body: { ...body, force } })))
    if (saved) onDone(saved)
  }

  const remove = async () => {
    if (!window.confirm(`Delete ${member.name} completely? Use this only for a wrong entry.`)) return
    const done = await run(() => api(`/members/${member.id}`, { method: 'DELETE' }))
    if (done) onDeleted()
  }

  return (
    <Sheet title="Edit member" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        </Field>
        <Field label="Phone">
          <PhoneInput value={phone} onChange={setPhone} />
        </Field>
        <div className="field-row">
          <Field label="Gender">
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Not set</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="First joined">
            <DateInput value={joinDate} onChange={setJoinDate} required />
          </Field>
        </div>
        <PersonalFields value={personal} onChange={setPersonal} />
        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2} />
        </Field>
        <ErrorBox error={error} />
        <button className="btn primary block" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="btn danger block" disabled={busy} onClick={remove}>
          Delete member (wrong entry)
        </button>
      </form>
    </Sheet>
  )
}
