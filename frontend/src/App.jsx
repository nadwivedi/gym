import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
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
import WhatsApp from './pages/WhatsApp.jsx'
import Features from './site/Features.jsx'
import Home from './site/Home.jsx'
import AddMemberSheet from './sheets/AddMemberSheet.jsx'

export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken())

  useEffect(() => {
    const onLogout = () => setAuthed(false)
    window.addEventListener('gym-logout', onLogout)
    return () => window.removeEventListener('gym-logout', onLogout)
  }, [])

  // A fresh load of the home page: changing route and sign-in state together would land on the login screen instead.
  const logout = useCallback(() => {
    setToken('')
    window.location.replace('/')
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home authed={authed} />} />
        <Route path="/features" element={<Features authed={authed} />} />
        <Route path="/login" element={<LoginRoute authed={authed} onDone={() => setAuthed(true)} />} />
        <Route path="*" element={authed ? <Shell onLogout={logout} /> : <ToLogin />} />
      </Routes>
    </BrowserRouter>
  )
}

// Any app page opened while locked goes to the login, then back to that page.
function ToLogin() {
  const location = useLocation()
  return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
}

function LoginRoute({ authed, onDone }) {
  const location = useLocation()
  if (authed) return <Navigate to={location.state?.from || '/dashboard'} replace />
  return <Login onDone={onDone} />
}

function Shell({ onLogout }) {
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
      <>
        <div className="app">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/renewals" element={<Renewals />} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/:id" element={<MemberProfile />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/more" element={<More onLogout={onLogout} />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
        <nav className="nav">
          <div className="nav-inner">
            <NavLink to="/dashboard">
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
      </>
    </AppContext.Provider>
  )
}
