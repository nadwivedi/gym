import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
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

// The "Affordable Gym Management Software" section: [icon, colour, heading, text]. The page of the same name has the price and the questions.
const AFFORDABLE = [
  ['users', 'purple', 'Member management', 'Keep every member’s details, plan, joining date and payment history in one record. Find anyone by name, phone or member number in seconds.'],
  ['calendar', 'blue', 'Renewal tracking', 'See who is overdue, due today and due this week on one screen, so no renewal is missed and no membership quietly lapses.'],
  ['wallet', 'green', 'Payments and pending dues', 'Record full or part payments, keep track of every pending due, and see what was collected by cash, UPI, card or bank.'],
  ['receipt', 'orange', 'Expense and profit tracking', 'Add rent, electricity, salaries and other gym expenses by category, and see income, expenses and profit for every month.'],
  ['box', 'blue', 'Supplement and stock inventory', 'Track protein, supplements and clothing: what you bought, what you sold and what is running low.'],
  ['chat', 'green', 'Automated WhatsApp reminders', 'Renewal reminders go out from your own gym WhatsApp number on the due date, without you typing a single message.'],
]

// What gym owners search for before choosing gym software. Each page has its own questions; none repeat across pages.
const FAQS = [
  {
    q: 'What is gym management software?',
    a: 'Gym management software keeps the day-to-day records of a gym in one place instead of registers and diaries. GymSolution covers member records, membership renewals, fee payments and pending dues, expenses and monthly profit, supplement stock and automatic WhatsApp renewal reminders.',
    link: ['/features', 'See every GymSolution feature.'],
  },
  {
    q: 'Why use gym software instead of a register or Excel sheet?',
    a: 'A register cannot tell you whose membership ends today or who still owes money. GymSolution works out every renewal date, lists who is overdue and who is due this week, keeps each pending balance against the member, and adds up income, expenses and profit for every month.',
  },
  {
    q: 'Can gym software remind members to pay their fees?',
    a: 'Yes. GymSolution sends a WhatsApp reminder from your own gym number on each member’s renewal date, and one follow-up two days later if they have not renewed. Nobody at the gym has to type the messages.',
    link: ['/whatsapp-automation-for-gyms', 'See how WhatsApp automation for gyms works.'],
  },
  {
    q: 'How do I move my existing members into GymSolution?',
    a: 'Add each member once with their plan, start date and the amount they have paid. GymSolution works out the renewal date and any balance from that, and keeps both up to date from then on.',
  },
  {
    q: 'Can I record UPI, cash and part payments?',
    a: 'Yes. Each payment is recorded as Cash, UPI, Card or Bank, and a member can pay a fee in parts. The remaining balance stays on the member’s record until it is cleared, and refunds are recorded too.',
  },
  {
    q: 'Is my gym’s data safe with GymSolution?',
    a: 'Your gym is behind a login with your mobile number and a password, and the password is stored in scrambled form, never as plain text. You can also download a full backup of your gym’s data whenever you like.',
  },
]

export default function Home() {
  return (
    <SiteLayout title="GymSolution – Complete Gym Management Software">
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
              <AppButton className="w-btn ghost" />
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
          <p className="w-after">
            Curious how the reminders work? <Link to="/whatsapp-automation-for-gyms">See WhatsApp automation for gyms</Link>.
          </p>
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

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Value for every gym</span>
            <h2>Affordable Gym Management Software</h2>
            <p>
              GymSolution is affordable gym management software for gym owners who want everything in one place: members, renewals, payments, expenses, stock
              and automated WhatsApp reminders. It replaces registers, diaries and spreadsheets with one simple app.
            </p>
          </div>
          <div className="w-grid three">
            {AFFORDABLE.map(([icon, tone, title, text]) => (
              <div key={title} className="w-card plain">
                <span className={`w-icon tone-${tone}`}>
                  <Icon name={icon} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="w-note">
            <h3>Save time and reduce manual work</h3>
            <p>
              With renewals, dues and reminders handled for you, the daily work of a gym front desk takes minutes instead of hours. GymSolution is simple enough
              for front-desk staff and works on your phone and computer, which makes it a practical, low-cost gym software for a single gym or several
              branches.
            </p>
            <Link to="/affordable-gym-management-software" className="w-more">
              See pricing from ₹150 a month <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>

      <Faq title="Gym management software: questions gym owners ask" items={FAQS} />

      <CtaBand />
    </SiteLayout>
  )
}
