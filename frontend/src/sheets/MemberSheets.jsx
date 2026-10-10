import { useCallback, useEffect, useState } from 'react'
import { memberAge } from '../../../shared/domain.mjs'
import { api, saveWithDuplicateCheck, useAction } from '../api.js'
import { DateInput, PersonalFields, PhoneInput } from '../components/fields.jsx'
import { ErrorBox, Field, Icon, Sheet } from '../components/ui.jsx'
import { useApp } from '../context.js'
import { capTyped, personalBody } from '../format.js'

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

  const [confirming, setConfirming] = useState(false)

  return (
    <Sheet title="Edit member" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <Field label="Name">
          <input value={name} onChange={(e) => setName(capTyped(e))} required maxLength={80} />
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
        <button type="button" className="btn danger block" disabled={busy} onClick={() => setConfirming(true)}>
          Delete member (wrong entry)
        </button>
      </form>
      {confirming && <DeleteMemberSheet member={member} onClose={() => setConfirming(false)} onDeleted={onDeleted} />}
    </Sheet>
  )
}

// The confirmation before a member is deleted, from the member's page or the edit form. Nothing is deleted until the red button is pressed.
export function DeleteMemberSheet({ member, onClose, onDeleted }) {
  const { busy, error, run } = useAction()
  // Closing plays a short fade first; index.css times it to match.
  const [closing, setClosing] = useState(false)
  const cancel = useCallback(() => {
    if (busy || closing) return
    setClosing(true)
    setTimeout(onClose, 150)
  }, [busy, closing, onClose])

  useEffect(() => {
    // Escape closes only this popup, not the edit form it may be sitting on.
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      cancel()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey, true)
    }
  }, [cancel])

  const remove = async () => {
    if (await run(() => api(`/members/${member.id}`, { method: 'DELETE' }))) onDeleted()
  }

  return (
    <div className={`sheet-backdrop confirm-backdrop ${closing ? 'closing' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && cancel()}>
      <div className="confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-member-title" aria-describedby="delete-member-text">
        <span className="confirm-icon">
          <Icon name="trash" />
        </span>
        <h2 id="delete-member-title">Delete Member?</h2>
        <p className="confirm-name">{member.name}</p>
        <p id="delete-member-text" className="hint">
          Are you sure you want to delete this member? This action cannot be undone.
        </p>
        <ErrorBox error={error} />
        <div className="btn-grid">
          <button type="button" className="btn" disabled={busy} onClick={cancel} autoFocus>
            Cancel
          </button>
          <button type="button" className="btn danger solid" disabled={busy} onClick={remove}>
            {busy ? 'Deleting…' : 'Delete Member'}
          </button>
        </div>
      </div>
    </div>
  )
}
