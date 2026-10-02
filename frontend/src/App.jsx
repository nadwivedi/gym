import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { getToken, setToken, useLoad } from './api.js'
import { Icon, Loading } from './components/ui.jsx'
import { AppContext } from './context.js'
import Dashboard from './pages/Dashboard.jsx'
import Expenses from './pages/Expenses.jsx'
import Login from './pages/Login.jsx'
import MemberProfile from './pages/MemberProfile.jsx'
import Members from './pages/Members.jsx'
import More from './pages/More.jsx'
import Payments from './pages/Payments.jsx'
import Renewals from './pages/Renewals.jsx'
import AddMemberSheet from './sheets/AddMemberSheet.jsx'

export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken())

  useEffect(() => {
    const onLogout = () => setAuthed(false)
    window.addEventListener('gym-logout', onLogout)
    return () => window.removeEventListener('gym-logout', onLogout)
  }, [])

  if (!authed) return <Login onDone={() => setAuthed(true)} />
  return (
    <Shell
      onLock={() => {
        setToken('')
        setAuthed(false)
      }}
    />
  )
}

function Shell({ onLock }) {
  const boot = useLoad('/bootstrap')
  const [adding, setAdding] = useState(false)
  const openAdd = useCallback(() => setAdding(true), [])
  const closeAdd = useCallback(() => setAdding(false), [])
  if (!boot.data) {
    return (
      <div className="login-wrap">
        <div className="login">
          <Loading error={boot.error} />
          {boot.error && (
            <button className="btn" onClick={boot.reload}>
              Try again
            </button>
          )}
        </div>
      </div>
    )
  }
  return (
    <AppContext.Provider value={{ ...boot.data, reloadApp: boot.reload, openAdd }}>
      <BrowserRouter>
        <div className="app">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/renewals" element={<Renewals />} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/:id" element={<MemberProfile />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/more" element={<More onLock={onLock} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <nav className="nav">
          <div className="nav-inner">
            <NavLink to="/" end>
              <Icon name="home" />
              Dashboard
            </NavLink>
            <NavLink to="/renewals">
              <Icon name="calendar" />
              Renewals
            </NavLink>
            <NavLink to="/members">
              <Icon name="users" />
              Members
            </NavLink>
            <NavLink to="/payments">
              <Icon name="wallet" />
              Payments
            </NavLink>
            <NavLink to="/expenses">
              <Icon name="receipt" />
              Expenses
            </NavLink>
          </div>
        </nav>
        {adding && <AddMemberSheet onClose={closeAdd} />}
      </BrowserRouter>
    </AppContext.Provider>
  )
}
