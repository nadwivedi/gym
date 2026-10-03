import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, setToken, useAction, useLoad } from '../api.js'
import { ErrorBox, Icon, Loading } from '../components/ui.jsx'
import { mobileDigits } from '../format.js'
import { Logo } from '../site/SiteLayout.jsx'

const SUPPORT_WA = `https://wa.me/916265682508?text=${encodeURIComponent('Hi, I forgot my GymSolution login password. Please help me reset it.')}`

function Input({ icon, ...props }) {
  return (
    <div className="auth-input">
      <Icon name={icon} />
      <input aria-label={props.placeholder} required {...props} />
    </div>
  )
}

function PasswordInput(props) {
  const [show, setShow] = useState(false)
  return (
    <div className="auth-input">
      <Icon name="lock" />
      <input aria-label={props.placeholder} required {...props} type={show ? 'text' : 'password'} />
      <button type="button" className="auth-eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
        <Icon name={show ? 'eye' : 'eyeOff'} />
      </button>
    </div>
  )
}

// Only a mobile number and a password. The first visit uses the same two boxes to create the login.
export default function Login({ onDone }) {
  const status = useLoad('/auth/status')
  const [form, setForm] = useState({ mobile: '', password: '' })
  const [forgot, setForgot] = useState(false)
  const { busy, error, run } = useAction()
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const s = status.data
  const mode = !s ? null : forgot ? 'forgot' : s.accountSet ? 'login' : 'setup'
  const creating = mode === 'setup'

  const titles = {
    login: ['Login to GymSolution', `Welcome back 👋 Sign in to manage ${s?.gymName || 'your gym'}.`],
    setup: ['Create your login', 'Choose the mobile number and password you will log in with. The password needs at least 6 characters.'],
    forgot: ['Forgot password?', 'Message GymSolution support on WhatsApp and we will help you reset it. Your gym data stays safe.'],
  }

  const submit = async (e) => {
    e.preventDefault()
    const res = await run(() => api(creating ? '/auth/setup' : '/auth/login', { method: 'POST', body: form }))
    if (!res) return
    setToken(res.token)
    onDone()
  }

  let body
  if (!s) {
    body = (
      <div className="auth-form">
        <Loading error={status.error} />
        {status.error && (
          <button className="auth-btn" onClick={status.reload}>
            Try again
          </button>
        )}
      </div>
    )
  } else if (mode === 'forgot') {
    body = (
      <div className="auth-form">
        <a className="auth-btn wa" href={SUPPORT_WA} target="_blank" rel="noreferrer">
          <Icon name="chat" />
          Message support on WhatsApp
        </a>
        <button type="button" className="auth-link center" onClick={() => setForgot(false)}>
          ← Back to Login
        </button>
      </div>
    )
  } else {
    body = (
      <form className="auth-form" onSubmit={submit}>
        <Input
          icon="phone"
          type="tel"
          inputMode="numeric"
          placeholder="Mobile number"
          autoComplete="username"
          pattern="\d{10}"
          title="Enter a 10-digit mobile number"
          autoFocus
          value={form.mobile}
          onChange={(e) => setForm((f) => ({ ...f, mobile: mobileDigits(e.target.value) }))}
        />
        <PasswordInput
          placeholder="Password"
          autoComplete={creating ? 'new-password' : 'current-password'}
          minLength={creating ? 6 : undefined}
          value={form.password}
          onChange={set('password')}
        />
        <ErrorBox error={error} />
        {mode === 'login' && (
          <div className="auth-row-end">
            <button type="button" className="auth-link" onClick={() => setForgot(true)}>
              Forgot Password?
            </button>
          </div>
        )}
        <button className="auth-btn" disabled={busy}>
          <Icon name="login" />
          {busy ? 'Please wait…' : creating ? 'Create login' : 'Login'}
        </button>
      </form>
    )
  }

  const [title, subtitle] = mode ? titles[mode] : []
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-promo">
          <span className="auth-circle a" />
          <span className="auth-circle b" />
          <span className="auth-circle c" />
          <div className="auth-promo-text">
            {/* Not an <h1>: this panel is hidden on phones, and the form heading is the page's h1. */}
            <p className="auth-promo-title">
              Your Gym,
              <br />
              Simplified.
            </p>
            <p>Manage members, renewals and profit from one simple dashboard.</p>
            <div className="auth-safe">
              <Icon name="shield" />
              Safe &amp; Secure
            </div>
          </div>
        </div>

        <div className="auth-main">
          <div className="auth-logo">
            <Logo />
          </div>
          {title && (
            <div className="auth-head">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          )}
          {body}
          <p className="auth-foot">
            <Link to="/">← Back to GymSolution website</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
