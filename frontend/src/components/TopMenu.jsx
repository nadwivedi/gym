import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useApp } from '../context.js'
import { Icon } from './ui.jsx'

const ITEMS = [
  ['/dashboard', 'home', 'Dashboard'],
  ['/whatsapp', 'chat', 'WhatsApp'],
  ['/more', 'settings', 'Settings'],
]

// "More" button at the right of every top bar: Dashboard, WhatsApp, Settings and Log out.
export default function TopMenu() {
  const { logout } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="top-menu" ref={ref}>
      <button className="btn small" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <Icon name={open ? 'close' : 'menu'} />
        More
      </button>
      {open && (
        <div className="top-menu-list" role="menu" onClick={() => setOpen(false)}>
          {ITEMS.map(([to, icon, label]) => (
            <NavLink key={to} to={to} role="menuitem">
              <Icon name={icon} />
              {label}
            </NavLink>
          ))}
          <button role="menuitem" className="danger" onClick={logout}>
            <Icon name="logout" />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
