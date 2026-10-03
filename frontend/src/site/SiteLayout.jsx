import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import './site.css'

const YEAR = new Date().getFullYear()

// GymSolution sales and support WhatsApp number.
const WHATSAPP_URL = `https://wa.me/916265682508?text=${encodeURIComponent('Hi, I want to know more about GymSolution gym management software.')}`
const WHATSAPP_LOGO =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z'

export function Logo() {
  return (
    <Link to="/" className="w-logo" aria-label="GymSolution home">
      <span className="w-logo-mark">
        <Icon name="dumbbell" />
      </span>
      <span>
        Gym<b>Solution</b>
      </span>
    </Link>
  )
}

// The website only shows to visitors (logged-in owners go straight to the app), so this is always Login.
export function AppButton({ className = 'w-btn primary' }) {
  return (
    <Link to="/login" className={className}>
      Login
      <Icon name="arrow" />
    </Link>
  )
}

export default function SiteLayout({ title, children }) {
  const { pathname, hash } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.title = title
  }, [title])

  // Router links do not scroll by themselves: go to the #section, or to the top of a new page.
  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1))
    if (target) target.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <div className="w-site">
      <header className="w-header">
        <div className="w-container w-header-inner">
          <Logo />
          <nav className={`w-menu ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/features">Features</NavLink>
            <AppButton />
          </nav>
          <button className="w-menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" aria-expanded={menuOpen}>
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </header>

      <main>{children}</main>

      <footer className="w-footer">
        <div className="w-container w-footer-inner">
          <div className="w-footer-brand">
            <Logo />
            <p>Complete gym management software for gym owners: renewals, members, WhatsApp reminders, expenses, profit, staff, trainers and stock.</p>
          </div>
          <div className="w-footer-links">
            <Link to="/">Home</Link>
            <Link to="/features">Features</Link>
            <Link to="/login">Login</Link>
          </div>
        </div>
        <div className="w-container w-footer-bottom">© {YEAR} GymSolution · gymsolution.in</div>
      </footer>

      <a href={WHATSAPP_URL} className="w-wa-float" target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d={WHATSAPP_LOGO} />
        </svg>
      </a>
    </div>
  )
}

// Closing call-to-action band used at the bottom of both pages.
export function CtaBand() {
  return (
    <section className="w-container">
      <div className="w-cta">
        <div>
          <h2>Run your gym the easy way</h2>
          <p>Renewals, reminders, expenses and profit — all in one simple app on your phone and computer.</p>
        </div>
        <div className="w-cta-actions">
          <AppButton className="w-btn light" />
          <Link to="/features" className="w-btn ghost">
            See all features
          </Link>
        </div>
      </div>
    </section>
  )
}
