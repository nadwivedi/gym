import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context.js'
import { dueInfo, fmtDate, money, reminderText, telLink, waLink } from '../format.js'

const ICONS = {
  calendar: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4',
  users: 'M12.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 5.2a3 3 0 0 1 0 5.6M18 14.6c2.2.7 3.5 2.6 3.5 5.4',
  plus: 'M12 5v14M5 12h14',
  wallet: 'M5 6h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM3 10h18M16 14.5h1.5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  back: 'M15 5l-7 7 7 7',
  phone:
    'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
  chat: 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z',
  lock: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
  rupee: 'M6 3h12M6 8h12M6 13l8.5 8M6 13h3a5 5 0 0 0 0-10',
  chart: 'M3 21h18M6 21V11M11 21V4M16 21v-8M21 21v-5',
  home: 'M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9',
  settings:
    'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
}

// "Rohit Sharma" -> "RS"
const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

export function Avatar({ name, big, off }) {
  return (
    <span className={`avatar ${big ? 'big' : ''} ${off ? 'off' : ''}`} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

// Numbered block of a long form.
export function Section({ num, title, children }) {
  return (
    <div className="section">
      <h3>
        <span className="num">{num}</span>
        {title}
      </h3>
      {children}
    </div>
  )
}

export function Icon({ name }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

export function Badge({ tone = '', children }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

export function ErrorBox({ error }) {
  return error ? <div className="box error">{error.message || String(error)}</div> : null
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

// Like Field, for a set of buttons. A <label> around buttons would click the first one.
export function Group({ label, children }) {
  return (
    <div className="field" role="group" aria-label={label}>
      <span>{label}</span>
      {children}
    </div>
  )
}

export function Loading({ error }) {
  return error ? <ErrorBox error={error} /> : <div className="loading">Loading…</div>
}

export function Sheet({ title, onClose, closeOnBackdrop = true, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  return (
    <div className="sheet-backdrop" onMouseDown={(e) => closeOnBackdrop && e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="btn small" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

// Call + WhatsApp reminder buttons for a member summary.
export function ContactButtons({ s }) {
  const { settings } = useApp()
  if (!s.phone) return null
  return (
    <>
      <a className="btn small call" href={telLink(s.phone)}>
        <Icon name="phone" />
        Call
      </a>
      <a className="btn small wa" href={waLink(s.phone, settings.countryCode, reminderText(s, settings.gymName))} target="_blank" rel="noreferrer">
        <Icon name="chat" />
        WhatsApp
      </a>
    </>
  )
}

export function MemberRow({ s, children, note }) {
  const due = dueInfo(s)
  return (
    <div className="card member">
      <Link to={`/members/${s.id}`} className="member-head">
        <Avatar name={s.name} off={s.hidden} />
        <div className="row-main">
          <div className="row-title">{s.name}</div>
          <div className="row-sub">
            #{s.memberNo}
            {s.planName ? ` · ${s.planName}` : ''}
          </div>
          {s.renewalDate && <div className="row-sub">Renewal {fmtDate(s.renewalDate)}</div>}
        </div>
        <div className="row-side">
          <Badge tone={s.hidden ? '' : due.tone}>{s.hidden ? 'Hidden' : due.text}</Badge>
          {s.balance > 0 && <Badge tone="danger">Due {money(s.balance)}</Badge>}
        </div>
      </Link>
      {(note || children) && (
        <div className="member-body">
          {note && <div className="note">{note}</div>}
          {children && <div className="row-actions">{children}</div>}
        </div>
      )}
    </div>
  )
}
