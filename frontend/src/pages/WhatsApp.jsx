import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, useAction, useLoad } from '../api.js'
import { Badge, ErrorBox, Icon, Loading } from '../components/ui.jsx'
import TopMenu from '../components/TopMenu.jsx'
import { fmtDate } from '../format.js'

const BUSY = ['initializing', 'qr_ready', 'syncing']
const KIND = { due: 'On renewal date', after: '2 days after' }
const STATUS = {
  sent: { text: 'Sent', tone: 'ok' },
  pending: { text: 'Waiting', tone: 'warn' },
  failed: { text: 'Failed', tone: 'danger' },
  cancelled: { text: 'Not needed', tone: '' },
}

const prettyPhone = (digits) => (digits ? `+${digits.slice(0, -10)} ${digits.slice(-10, -5)} ${digits.slice(-5)}` : '')
const timeOf = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export default function WhatsApp() {
  const status = useLoad('/whatsapp/status?watch=1')
  const log = useLoad('/whatsapp/log')
  const action = useAction()
  const s = status.data
  // While connecting or showing a QR, look again every 2 seconds; while a connection is open, every 5.
  const pollMs = !s ? 0 : BUSY.includes(s.status) ? 2000 : s.connectionOpen ? 5000 : 0
  const { reload } = status
  const reloadLog = log.reload
  useEffect(() => {
    if (!pollMs) return
    const timer = setInterval(() => {
      reload()
      reloadLog()
    }, pollMs)
    return () => clearInterval(timer)
  }, [pollMs, reload, reloadLog])

  const post = async (path, body) => {
    const res = await action.run(() => api(`/whatsapp${path}`, { method: 'POST', body }))
    reload()
    reloadLog()
    return res
  }

  return (
    <>
      <header className="topbar">
        <Link to="/more" className="btn small" aria-label="Back to settings">
          <Icon name="back" />
        </Link>
        <span className="head-icon">
          <Icon name="chat" />
        </span>
        <h1>
          WhatsApp
          <span className="sub">Renewal reminders</span>
        </h1>
        <TopMenu />
      </header>
      <div className="page wa split">
        {!s ? (
          <Loading error={status.error} />
        ) : (
          <>
            <div className="col">
              <Connection s={s} busy={action.busy} post={post} />
              <ErrorBox error={action.error} />
              <Rules s={s} reload={reload} />
            </div>
            <div className="col">
              <div className="section-title">Recent messages</div>
              <div className="list">
                {(log.data || []).map((r) => (
                  <div className="card" key={r.id}>
                    <div className="row">
                      <div className="row-main">
                        <div className="row-title">{r.memberName || r.phone}</div>
                        <div className="row-sub">
                          {KIND[r.kind]} · {r.phone}
                        </div>
                        <div className="row-sub">
                          {fmtDate((r.sentAt || r.createdAt).slice(0, 10))}, {timeOf(r.sentAt || r.createdAt)}
                        </div>
                      </div>
                      <div className="row-side">
                        <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].text}</Badge>
                      </div>
                    </div>
                    {r.errorReason && r.status !== 'sent' && <p className="row-sub">{r.errorReason}</p>}
                  </div>
                ))}
                {log.data && !log.data.length && <div className="empty">No messages yet.</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// The link between the app and the gym's WhatsApp number.
function Connection({ s, busy, post }) {
  const unlink = () => {
    if (window.confirm('Unlink this WhatsApp number? Reminders stop until you scan a QR code again.')) post('/logout')
  }

  if (s.status === 'qr_ready') {
    return (
      <div className="card qr-card">
        <h3>Scan this code with the gym&apos;s WhatsApp</h3>
        <img src={s.qrCodeDataUrl} alt="WhatsApp QR code" width="240" height="240" />
        <ol className="hint">
          <li>Open WhatsApp on the gym phone.</li>
          <li>
            Tap <b>Settings</b> (or the three dots) → <b>Linked devices</b> → <b>Link a device</b>.
          </li>
          <li>Point the phone at this code.</li>
        </ol>
        <div className="btn-grid">
          <button className="btn small" disabled={busy} onClick={() => post('/renew-qr')}>
            New code
          </button>
          <button className="btn small" disabled={busy} onClick={() => post('/cancel')}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (s.isInitializing) {
    return (
      <div className="card">
        <div className="loading">{s.status === 'syncing' ? 'Code scanned. Finishing the login…' : 'Connecting to WhatsApp…'}</div>
        <button className="btn small block" disabled={busy} onClick={() => post('/cancel')}>
          Cancel
        </button>
      </div>
    )
  }

  if (s.linked) {
    return (
      <div className="card">
        <div className="row">
          <span className="avatar wa">
            <Icon name="chat" />
          </span>
          <div className="row-main">
            <div className="row-title">Linked to {prettyPhone(s.phoneNumber) || 'your WhatsApp'}</div>
            <div className="row-sub">
              {s.connectionOpen ? 'Connected now, sending messages.' : 'Sleeping. It connects only when a reminder has to go out, then disconnects again.'}
            </div>
          </div>
          <Badge tone={s.connectionOpen ? 'ok' : 'info'}>{s.connectionOpen ? 'Connected' : 'Ready'}</Badge>
        </div>
        {s.lastError && <div className="box warn mt">{s.lastError}</div>}
        <div className="row-actions">
          <button className="btn small danger" disabled={busy} onClick={unlink}>
            Unlink
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card form">
      <div className="row">
        <span className="avatar off">
          <Icon name="chat" />
        </span>
        <div className="row-main">
          <div className="row-title">WhatsApp is not linked</div>
          <div className="row-sub">Link the gym&apos;s WhatsApp number once. After that, renewal reminders go out by themselves.</div>
        </div>
      </div>
      {s.lastError && <div className="box warn">{s.lastError}</div>}
      <button className="btn primary block" disabled={busy} onClick={() => post('/connect')}>
        Connect WhatsApp
      </button>
    </div>
  )
}

// The on / off switch for the automatic reminders.
function Rules({ s, reload }) {
  const toggle = useAction()
  const setEnabled = async (enabled) => {
    if (await toggle.run(() => api('/whatsapp/settings', { method: 'PATCH', body: { enabled } }))) reload()
  }
  return (
    <div className="card form">
      <div className="chart-head">
        <h3>Renewal reminders</h3>
        <p>Each member gets two messages and no more: one on the renewal date, one 2 days after if they have not renewed. Hidden members get none.</p>
      </div>
      <div className="btn-grid">
        <button className={`chip ${s.enabled ? 'active' : ''}`} aria-pressed={s.enabled} disabled={toggle.busy} onClick={() => setEnabled(true)}>
          On
        </button>
        <button className={`chip ${s.enabled ? '' : 'active'}`} aria-pressed={!s.enabled} disabled={toggle.busy} onClick={() => setEnabled(false)}>
          Off
        </button>
      </div>
      <ErrorBox error={toggle.error} />
    </div>
  )
}
