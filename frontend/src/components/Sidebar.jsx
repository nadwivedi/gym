import { Link, NavLink } from 'react-router-dom'
import { useApp } from '../context.js'
import { Avatar, Icon } from './ui.jsx'

// [address, icon, name]
const GROUPS = [
  [
    'Main',
    [
      ['/dashboard', 'home', 'Dashboard'],
      ['/renewals', 'calendar', 'Renewals'],
      ['/members', 'users', 'Members'],
      ['/payments', 'wallet', 'Payments'],
      ['/expenses', 'receipt', 'Expenses'],
      ['/stock', 'box', 'Stock'],
    ],
  ],
  ['Tools', [['/whatsapp', 'chat', 'WhatsApp']]],
  ['Manage', [['/more', 'settings', 'Settings']]],
]

// The menu on the left of every app page on a laptop or desktop. A phone or tablet has the bottom bar in App.jsx instead.
export default function Sidebar() {
  const { settings, account, logout } = useApp()

  return (
    <aside className="side">
      <div className="side-brand">
        <span className="side-logo">
          <Icon name="dumbbell" />
        </span>
        <b>{settings.gymName}</b>
      </div>
      <nav aria-label="Main menu">
        {GROUPS.map(([title, items]) => (
          <div key={title} className="side-group">
            <div className="side-title">{title}</div>
            {items.map(([to, icon, label]) => (
              <NavLink key={to} to={to} className="side-link">
                <Icon name={icon} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="side-foot">
        <Link to="/more" className="side-user" title="Account and settings">
          <Avatar name={settings.gymName} />
          <span>
            <b>{settings.gymName}</b>
            <small>{account.email || account.loginMobile || 'Owner account'}</small>
          </span>
        </Link>
        <button className="side-link danger" onClick={logout}>
          <Icon name="logout" />
          Logout
        </button>
      </div>
    </aside>
  )
}
