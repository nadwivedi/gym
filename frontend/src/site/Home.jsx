import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import { FEATURES } from './features.js'
import { DashboardMock } from './mocks.jsx'
import SiteLayout, { AppButton, CtaBand } from './SiteLayout.jsx'

const STEPS = [
  ['Add your members', 'Enter each member once with their plan and payment. The renewal date is worked out for you.'],
  ['Reminders go out by themselves', 'On the due date, members get a WhatsApp message from your gym number. You just collect the fee.'],
  ['Watch your profit grow', 'Add expenses as they happen. The dashboard shows revenue, expense and profit every month.'],
]

const FOR_WHO = [
  ['home', 'Single gym owners', 'Stop using registers and diaries. Know every due date and every rupee.'],
  ['building', 'Gyms with many branches', 'Run all your branches from one login and compare their profit.'],
  ['users', 'Gyms with staff and trainers', 'Give staff limited access and keep an eye on trainers’ work.'],
]

export default function Home({ authed }) {
  return (
    <SiteLayout title="GymSolution – Complete Gym Management Software" authed={authed}>
      <section className="w-hero">
        <div className="w-container w-hero-inner">
          <div className="w-hero-text">
            <span className="w-eyebrow">Gym management software</span>
            <h1>
              Run your whole gym from <span className="w-grad-text">one simple app</span>
            </h1>
            <p>
              GymSolution handles renewals, member records, WhatsApp reminders, expenses, supplement stock and monthly profit — for one gym or many. Built for
              gym owners, easy enough for front-desk staff.
            </p>
            <div className="w-hero-actions">
              <Link to="/features" className="w-btn primary">
                See all features
                <Icon name="arrow" />
              </Link>
              <AppButton authed={authed} className="w-btn ghost" />
            </div>
            <ul className="w-hero-checks">
              <li>
                <Icon name="check" />
                WhatsApp reminders
              </li>
              <li>
                <Icon name="check" />
                Multi-gym
              </li>
              <li>
                <Icon name="check" />
                Staff and trainer panels
              </li>
            </ul>
          </div>
          <div className="w-hero-visual">
            <DashboardMock />
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Everything in one place</span>
          <h2>A complete gym management software</h2>
          <p>All the tools a gym owner needs every day, without the paperwork.</p>
        </div>
        <div className="w-grid three">
          {FEATURES.map((f) => (
            <Link key={f.id} to={`/features#${f.id}`} className="w-card">
              <span className={`w-icon tone-${f.tone}`}>
                <Icon name={f.icon} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.short}</p>
              <span className="w-more">
                Learn more <Icon name="arrow" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">How it works</span>
            <h2>Start in minutes, save hours every week</h2>
          </div>
          <ol className="w-steps">
            {STEPS.map(([title, text], i) => (
              <li key={title}>
                <span className="w-step-num">{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Made for</span>
          <h2>Every kind of gym</h2>
        </div>
        <div className="w-grid three">
          {FOR_WHO.map(([icon, title, text]) => (
            <div key={title} className="w-card plain">
              <span className="w-icon tone-blue">
                <Icon name={icon} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <CtaBand authed={authed} />
    </SiteLayout>
  )
}
