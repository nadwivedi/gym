import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { getToken, setToken, useLoad } from './api.js'
import Sidebar from './components/Sidebar.jsx'
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
import Stock from './pages/Stock.jsx'
import StockLedger from './pages/StockLedger.jsx'
import WhatsApp from './pages/WhatsApp.jsx'
import AiGymSoftware from './site/AiGymSoftware.jsx'
import Affordable from './site/Affordable.jsx'
import BestSoftware from './site/BestSoftware.jsx'
import DuesCollection from './site/DuesCollection.jsx'
import ExpenseTracking from './site/ExpenseTracking.jsx'
import ExpiryReport from './site/ExpiryReport.jsx'
import Features from './site/Features.jsx'
import ManagementApp from './site/ManagementApp.jsx'
import ManagementWebsite from './site/ManagementWebsite.jsx'
import MembershipApp from './site/MembershipApp.jsx'
import MembershipManagement from './site/MembershipManagement.jsx'
import MembershipSystem from './site/MembershipSystem.jsx'
import FreeApp from './site/FreeApp.jsx'
import Home from './site/Home.jsx'
import Pricing from './site/Pricing.jsx'
import ProfitLossReport from './site/ProfitLossReport.jsx'
import RenewalSoftware from './site/RenewalSoftware.jsx'
import StaffManagement from './site/StaffManagement.jsx'
import StockManagement from './site/StockManagement.jsx'
import WhatsAppAutomation from './site/WhatsAppAutomation.jsx'
import WhatsAppReminders from './site/WhatsAppReminders.jsx'
import AddMemberSheet from './sheets/AddMemberSheet.jsx'

// The first page after login, and where unknown addresses go.
const HOME = '/renewals'

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
        {/* The website is for visitors only: once logged in, only the app shows. */}
        <Route path="/" element={authed ? <Navigate to={HOME} replace /> : <Home />} />
        <Route path="/features" element={authed ? <Navigate to={HOME} replace /> : <Features />} />
        <Route path="/gym-management-software-pricing" element={authed ? <Navigate to={HOME} replace /> : <Pricing />} />
        <Route path="/ai-gym-management-software" element={authed ? <Navigate to={HOME} replace /> : <AiGymSoftware />} />
        <Route path="/best-software-for-gym-management" element={authed ? <Navigate to={HOME} replace /> : <BestSoftware />} />
        <Route path="/gym-membership-management-software" element={authed ? <Navigate to={HOME} replace /> : <MembershipManagement />} />
        <Route path="/gym-membership-management-system" element={authed ? <Navigate to={HOME} replace /> : <MembershipSystem />} />
        <Route path="/gym-membership-management-app" element={authed ? <Navigate to={HOME} replace /> : <MembershipApp />} />
        <Route path="/gym-management-app" element={authed ? <Navigate to={HOME} replace /> : <ManagementApp />} />
        <Route path="/gym-management-website" element={authed ? <Navigate to={HOME} replace /> : <ManagementWebsite />} />
        <Route path="/gym-membership-renewal-software" element={authed ? <Navigate to={HOME} replace /> : <RenewalSoftware />} />
        <Route path="/gym-membership-expiry-report-software" element={authed ? <Navigate to={HOME} replace /> : <ExpiryReport />} />
        <Route path="/gym-expense-tracking-software" element={authed ? <Navigate to={HOME} replace /> : <ExpenseTracking />} />
        <Route path="/gym-profit-loss-report-software" element={authed ? <Navigate to={HOME} replace /> : <ProfitLossReport />} />
        <Route path="/gym-dues-collection-software" element={authed ? <Navigate to={HOME} replace /> : <DuesCollection />} />
        <Route path="/affordable-gym-management-software" element={authed ? <Navigate to={HOME} replace /> : <Affordable />} />
        <Route path="/gym-management-app-free" element={authed ? <Navigate to={HOME} replace /> : <FreeApp />} />
        <Route path="/whatsapp-automation-for-gyms" element={authed ? <Navigate to={HOME} replace /> : <WhatsAppAutomation />} />
        <Route path="/whatsapp-reminder-software-for-gym" element={authed ? <Navigate to={HOME} replace /> : <WhatsAppReminders />} />
        <Route path="/gym-staff-management-software" element={authed ? <Navigate to={HOME} replace /> : <StaffManagement />} />
        <Route path="/gym-stock-management-software" element={authed ? <Navigate to={HOME} replace /> : <StockManagement />} />
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

// onDone(to): logged in; `to` is where to go, else back to the page that asked for the login, else HOME.
function LoginRoute({ authed, onDone }) {
  const location = useLocation()
  const [to, setTo] = useState(null)
  if (authed) return <Navigate to={to || location.state?.from || HOME} replace />
  return (
    <Login
      onDone={(next) => {
        setTo(next || null)
        onDone()
      }}
    />
  )
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
    <AppContext.Provider value={{ ...boot.data, reloadApp: boot.reload, openAdd, logout: onLogout }}>
      <>
        <Sidebar />
        <main className="main">
          <div className="app">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/renewals" element={<Renewals />} />
              <Route path="/members" element={<Members />} />
              <Route path="/members/:id" element={<MemberProfile />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/stock/:id" element={<StockLedger />} />
              <Route path="/more" element={<More />} />
              <Route path="/whatsapp" element={<WhatsApp />} />
              <Route path="*" element={<Navigate to={HOME} replace />} />
            </Routes>
          </div>
        </main>
        <nav className="nav">
          <div className="nav-inner">
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
            <NavLink to="/stock">
              <Icon name="box" />
              Stock
            </NavLink>
          </div>
        </nav>
        {adding && <AddMemberSheet onClose={closeAdd} />}
      </>
    </AppContext.Provider>
  )
}
