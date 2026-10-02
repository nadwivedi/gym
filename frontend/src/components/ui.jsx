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
  return error ? <ErrorBox error={error} /> : <div className="empty">Loading…</div>
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
      <a className="btn small" href={telLink(s.phone)}>
        Call
      </a>
      <a className="btn small" href={waLink(s.phone, settings.countryCode, reminderText(s, settings.gymName))} target="_blank" rel="noreferrer">
        WhatsApp
      </a>
    </>
  )
}

export function MemberRow({ s, children, note }) {
  const due = dueInfo(s)
  return (
    <div className="card">
      <Link to={`/members/${s.id}`} className="row">
        <div className="row-main">
          <div className="row-title">{s.name}</div>
          <div className="row-sub">
            #{s.memberNo}
            {s.planName ? ` · ${s.planName}` : ''}
            {s.renewalDate ? ` · Renewal ${fmtDate(s.renewalDate)}` : ''}
          </div>
          {note && <div className="row-sub">{note}</div>}
        </div>
        <div className="row-side">
          <Badge tone={s.hidden ? '' : due.tone}>{s.hidden ? 'Hidden' : due.text}</Badge>
          {s.balance > 0 && <Badge tone="danger">Due {money(s.balance)}</Badge>}
        </div>
      </Link>
      {children && <div className="row-actions">{children}</div>}
    </div>
  )
}
