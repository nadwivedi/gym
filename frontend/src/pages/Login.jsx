import { useState } from 'react'
import { api, setToken, useAction, useLoad } from '../api.js'
import { ErrorBox, Field, Loading } from '../components/ui.jsx'

const pinProps = { type: 'password', inputMode: 'numeric', pattern: '\\d{4,8}', maxLength: 8, autoComplete: 'off', required: true }

export default function Login({ onDone }) {
  const status = useLoad('/auth/status')
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [gymName, setGymName] = useState('')
  const { busy, error, run } = useAction()

  if (!status.data) {
    return (
      <div className="login">
        <Loading error={status.error} />
        {status.error && (
          <button className="btn" onClick={status.reload}>
            Try again
          </button>
        )}
      </div>
    )
  }
  const setup = !status.data.pinSet
  const mismatch = setup && pin2 !== '' && pin !== pin2

  const submit = async (e) => {
    e.preventDefault()
    const res = await run(() => api(setup ? '/auth/setup' : '/auth/login', { method: 'POST', body: setup ? { pin, gymName } : { pin } }))
    if (!res) return setPin('')
    setToken(res.token)
    onDone()
  }

  return (
    <form className="login" onSubmit={submit}>
      <div>
        <h1>{setup ? 'Welcome' : status.data.gymName}</h1>
        <p className="hint">{setup ? 'Set a PIN to protect your member and payment records.' : 'Enter your PIN to continue.'}</p>
      </div>
      {setup && (
        <Field label="Gym name">
          <input value={gymName} onChange={(e) => setGymName(e.target.value)} required maxLength={60} />
        </Field>
      )}
      <Field label={setup ? 'New PIN (4 to 8 digits)' : 'PIN'}>
        <input className="pin-input" {...pinProps} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} autoFocus={!setup} />
      </Field>
      {setup && (
        <Field label="Repeat PIN">
          <input className="pin-input" {...pinProps} value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))} />
        </Field>
      )}
      {mismatch && <div className="box error">The two PINs do not match.</div>}
      <ErrorBox error={error} />
      <button className="btn primary block" disabled={busy || pin.length < 4 || (setup && pin !== pin2)}>
        {busy ? 'Please wait…' : setup ? 'Save PIN and start' : 'Unlock'}
      </button>
    </form>
  )
}
