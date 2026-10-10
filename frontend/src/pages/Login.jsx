import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, setToken, useAction } from '../api.js'
import { ErrorBox, Icon } from '../components/ui.jsx'
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

const TABS = [
  ['login', 'Login'],
  ['signup', 'Sign Up'],
]

// Login and Sign Up tabs. Every gym owner has their own account: Sign Up creates it (and its empty gym),
// Login opens it with the email, or with the mobile number of a gym from the one-gym version.
export default function Login({ onDone }) {
  const [form, setForm] = useState({ name: '', gymName: '', email: '', password: '' })
  const [tab, setTab] = useState('login')
  const [forgot, setForgot] = useState(false)
  const [sentFrom, setSentFrom] = useState(null) // the form whose error is showing, so switching tabs hides it
  const { busy, error, run } = useAction()
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const mode = forgot ? 'forgot' : tab
  const creating = mode === 'signup'

  const titles = {
    login: ['Login to GymSolution', 'Welcome back 👋 Sign in to manage your gym.'],
    signup: ['Create your account', 'Sign up with your name, gym name, email and a password of at least 6 characters.'],
    forgot: ['Forgot password?', 'Message GymSolution support on WhatsApp and we will help you reset it. Your gym data stays safe.'],
  }

  const pick = (next) => {
    setTab(next)
    setForgot(false)
    setSentFrom(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSentFrom(mode)
    const { name, gymName, email, password } = form
    const res = await run(() =>
      creating
        ? api('/auth/signup', { method: 'POST', body: { name, gymName, email, password } })
        : api('/auth/login', { method: 'POST', body: { email, password } }),
    )
    if (!res) return
    setToken(res.token)
    onDone()
  }

  let body
  if (mode === 'forgot') {
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
      // Keyed by tab so each form mounts fresh and its first box takes the focus.
      <form key={mode} id={`auth-${mode}`} role="tabpanel" aria-labelledby={`auth-tab-${mode}`} className="auth-form" onSubmit={submit}>
        {creating && (
          <>
            <Input icon="user" placeholder="Your name" autoComplete="name" maxLength={60} autoFocus value={form.name} onChange={set('name')} />
            <Input icon="building" placeholder="Gym name" autoComplete="organization" maxLength={60} value={form.gymName} onChange={set('gymName')} />
          </>
        )}
        {creating ? (
          <Input icon="mail" type="email" placeholder="Email" autoComplete="email" maxLength={254} value={form.email} onChange={set('email')} />
        ) : (
          // Text, not email: a gym from the one-gym version still logs in with its mobile number.
          <Input
            icon="mail"
            type="text"
            inputMode="email"
            placeholder="Email or mobile number"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            autoFocus
            value={form.email}
            onChange={set('email')}
          />
        )}
        <PasswordInput
          placeholder="Password"
          autoComplete={creating ? 'new-password' : 'current-password'}
          minLength={creating ? 6 : undefined}
          value={form.password}
          onChange={set('password')}
        />
        <ErrorBox error={sentFrom === mode ? error : null} />
        {mode === 'login' && (
          <div className="auth-row-end">
            <button type="button" className="auth-link" onClick={() => setForgot(true)}>
              Forgot Password?
            </button>
          </div>
        )}
        <button className="auth-btn" disabled={busy}>
          <Icon name="login" />
          {busy ? 'Please wait…' : creating ? 'Sign Up' : 'Login'}
        </button>
      </form>
    )
  }

  const [title, subtitle] = titles[mode]
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
          <div className="auth-tabs" role="tablist" aria-label="Login or Sign Up">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                id={`auth-tab-${key}`}
                type="button"
                role="tab"
                aria-selected={tab === key}
                aria-controls={`auth-${key}`}
                onClick={() => pick(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="auth-head">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {body}
          <p className="auth-foot">
            <Link to="/">← Back to GymSolution website</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
