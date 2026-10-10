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

// Login and Sign Up tabs. Every gym owner has their own account, with a mobile number and an email;
// either one logs in with the password. A gym carried over from the one-gym version has only the mobile number.
export default function Login({ onDone }) {
  const status = useLoad('/auth/status') // only checks that the server can be reached
  const [form, setForm] = useState({ name: '', gymName: '', mobile: '', email: '', password: '', confirm: '' })
  const [loginName, setLoginName] = useState('') // the login box: mobile number or email
  const [tab, setTab] = useState('login')
  const [forgot, setForgot] = useState(false)
  const [sentFrom, setSentFrom] = useState(null) // the form whose error is showing, so switching tabs hides it
  const [signedUp, setSignedUp] = useState(false) // shows "Account created" above the login form
  const { busy, error, run } = useAction()
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const s = status.data
  const mode = !s ? null : forgot ? 'forgot' : tab
  const creating = mode === 'signup'

  const titles = {
    login: ['Login to GymSolution', 'Welcome back 👋 Sign in with your mobile number or email.'],
    signup: ['Create your account', 'Sign up to manage your gym. You can log in with your email or mobile number.'],
    forgot: ['Forgot password?', 'Message GymSolution support on WhatsApp and we will help you reset it. Your gym data stays safe.'],
  }

  const pick = (next) => {
    setTab(next)
    setForgot(false)
    setSentFrom(null)
    setSignedUp(false)
  }

  // The backend tells a mobile number from an email by what was typed.
  const login = async (e) => {
    e.preventDefault()
    setSentFrom('login')
    const res = await run(() => api('/auth/login', { method: 'POST', body: { email: loginName, password: form.password } }))
    if (!res) return
    setToken(res.token)
    onDone()
  }

  // A new account: then back to the Login tab, with the new email filled in, to log in with it.
  const signup = async (e) => {
    e.preventDefault()
    setSentFrom('signup')
    const { confirm, ...body } = form
    const res = await run(() =>
      confirm === body.password ? api('/auth/signup', { method: 'POST', body }) : Promise.reject(new Error('The two passwords do not match')),
    )
    if (!res) return
    setLoginName(form.email.trim())
    setForm((f) => ({ ...f, password: '', confirm: '' }))
    setTab('login')
    setSentFrom(null)
    setSignedUp(true)
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
  } else if (creating) {
    body = (
      <form key="signup" className="auth-form" onSubmit={signup}>
        <Input icon="user" placeholder="Owner name" autoComplete="name" maxLength={60} autoFocus value={form.name} onChange={set('name')} />
        <Input icon="building" placeholder="Gym name" autoComplete="organization" maxLength={60} value={form.gymName} onChange={set('gymName')} />
        <Input
          icon="mail"
          type="email"
          placeholder="Email address"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          value={form.email}
          onChange={set('email')}
        />
        <Input
          icon="phone"
          type="tel"
          inputMode="numeric"
          placeholder="Mobile number"
          autoComplete="tel-national"
          pattern="\d{10}"
          title="Enter a 10-digit mobile number"
          value={form.mobile}
          onChange={(e) => setForm((f) => ({ ...f, mobile: mobileDigits(e.target.value) }))}
        />
        <PasswordInput placeholder="Password (6+ characters)" autoComplete="new-password" minLength={6} value={form.password} onChange={set('password')} />
        <PasswordInput placeholder="Confirm password" autoComplete="new-password" minLength={6} value={form.confirm} onChange={set('confirm')} />
        <ErrorBox error={sentFrom === 'signup' ? error : null} />
        <button className="auth-btn" disabled={busy}>
          <Icon name="user" />
          {busy ? 'Please wait…' : 'Create Account'}
        </button>
        <p className="auth-switch">
          Already have an account?{' '}
          <button type="button" className="auth-link" onClick={() => pick('login')}>
            Login
          </button>
        </p>
      </form>
    )
  } else {
    body = (
      <form key="login" className="auth-form" onSubmit={login}>
        {signedUp && <div className="box info">Account created. Log in with your email or mobile number and password.</div>}
        <Input
          icon="phone"
          placeholder="Mobile number or email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          autoFocus={!signedUp}
          value={loginName}
          onChange={(e) => setLoginName(e.target.value)}
        />
        <PasswordInput placeholder="Password" autoComplete="current-password" autoFocus={signedUp} value={form.password} onChange={set('password')} />
        <ErrorBox error={sentFrom === 'login' ? error : null} />
        <div className="auth-row-end">
          <button type="button" className="auth-link" onClick={() => setForgot(true)}>
            Forgot Password?
          </button>
        </div>
        <button className="auth-btn" disabled={busy}>
          <Icon name="login" />
          {busy ? 'Please wait…' : 'Login'}
        </button>
        <p className="auth-switch">
          Don&apos;t have an account?{' '}
          <button type="button" className="auth-link" onClick={() => pick('signup')}>
            Sign Up
          </button>
        </p>
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
          <div className="auth-tabs" role="tablist" aria-label="Login or Sign Up">
            {[
              ['login', 'Login'],
              ['signup', 'Sign Up'],
            ].map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => pick(key)}>
                {label}
              </button>
            ))}
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
