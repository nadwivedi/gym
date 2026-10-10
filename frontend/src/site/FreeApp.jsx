import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { RenewalsMock, WhatsAppMock } from './mocks.jsx'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

// The free trial is asked for on WhatsApp: the website has no sign-up form.
const TRIAL_URL = whatsappLink('Hi, I want to start a free trial of the GymSolution gym management app.')

const ON_PHONE = [
  'Works in the browser on Android phones, iPhones and computers',
  'Nothing to download or install',
  'Simple enough for front-desk staff',
  'The same gym data on every device you log in from',
]

const REMINDERS = [
  'A reminder on the renewal date, from your own gym number',
  'A follow-up two days later if the member has not renewed',
  'Hidden members are never messaged',
]

const STEPS = [
  ['Ask for your free trial', 'Message us on WhatsApp and ask for a free trial of the GymSolution gym management app.'],
  ['Add your members', 'Enter each member once with their plan and payment. The app works out every renewal date for you.'],
  ['Run your gym from your phone', 'Check renewals, record payments and let the reminders go out. Carry on with a paid plan only if the app suits your gym.'],
]

// [icon, colour, heading, text]
const IN_THE_APP = [
  ['calendar', 'blue', 'Renewals at a glance', 'Open the app and see who is overdue, who is due today and who is due in the next 7 days.'],
  ['idcard', 'purple', 'Every member in your pocket', 'Search any member by name, phone or member number and see their plan, dates and payment history.'],
  ['rupee', 'green', 'Payments at the front desk', 'Record a full or part payment in a few taps. The balance stays against the member until it is cleared.'],
  ['chat', 'green', 'WhatsApp reminders', 'Renewal reminders are sent for you on the due date, so nobody has to remember to message members.'],
  ['receipt', 'orange', 'Expenses and profit', 'Note rent, electricity and salaries as you pay them and see the month’s income, expenses and profit.'],
  ['box', 'blue', 'Supplement stock', 'Record what you buy and sell, and see which items are running low.'],
]

const FAQS = [
  {
    q: 'Is the GymSolution gym management app free?',
    a: 'It is free to try. You can start with a free trial and use the gym management app with your own members. After the trial, plans start at ₹150 per month.',
    link: ['/affordable-gym-management-software', 'See what the paid plans include.'],
  },
  { q: 'How do I start the free trial?', a: 'Message us on WhatsApp and ask for a free trial. The Start free trial button on this page opens the chat for you.' },
  {
    q: 'Is there a gym management app to download?',
    a: 'No download is needed. GymSolution works in the browser on Android phones, iPhones, laptops and desktops, so there is nothing to install from an app store.',
  },
  {
    q: 'What can a gym owner do in the app every day?',
    a: 'Check who is overdue or due today, renew a membership, add a new admission, take a full or part payment, note an expense and record a supplement sale, all from your phone in a few taps.',
    link: ['/features', 'See all GymSolution features.'],
  },
  {
    q: 'Do my gym members need to install an app?',
    a: 'No. The app is for you and your gym. Members do not install anything: they get their renewal reminders as ordinary WhatsApp messages from your gym’s number.',
    link: ['/whatsapp-automation-for-gyms', 'See the WhatsApp reminders members receive.'],
  },
]

// What search engines read about the page: the app. The questions are added by Faq.
const STRUCTURED = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'GymSolution',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Gym management app for gym owners with a free trial: members, renewals, payments, expenses, stock and automatic WhatsApp reminders.',
    offers: { '@type': 'Offer', price: '150', priceCurrency: 'INR', description: 'Free trial available. Paid plans start at this price per month.' },
  },
]

export default function FreeApp() {
  return (
    <SiteLayout
      title="Gym Management App – Free Trial | GymSolution"
      description="GymSolution is a gym management app you can try free. Manage members, renewals, payments, expenses, stock and automatic WhatsApp reminders from your phone. Start your free trial today."
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Free trial</span>
          <h1>Gym Management App, Free to Try</h1>
          <p>
            GymSolution is a gym management app for gym owners. Manage members, renewals, payments, expenses and WhatsApp reminders from your phone, and start
            with a free trial.
          </p>
          <div className="w-hero-actions center">
            <a href={TRIAL_URL} className="w-btn primary" target="_blank" rel="noreferrer">
              Start free trial
              <Icon name="arrow" />
            </a>
            <Link to="/features" className="w-btn ghost">
              See all features
            </Link>
          </div>
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-blue">
              <Icon name="phone" />
            </span>
            <h2>A gym management app that works on your phone</h2>
            <p>
              Your gym does not stop when you leave the front desk. With the GymSolution app you can check today’s renewals, look up a member or record a
              payment from wherever you are.
            </p>
            <ul className="w-points">
              {ON_PHONE.map((point) => (
                <li key={point}>
                  <Icon name="check" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-feature-visual">
            <RenewalsMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">How the free trial works</span>
            <h2>Try the gym management app free</h2>
            <p>See how the app handles your own members before you pay anything.</p>
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
            After the free trial, plans start at ₹150 per month. <Link to="/affordable-gym-management-software">See GymSolution pricing</Link>.
          </p>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Inside the app</span>
          <h2>Everything a gym owner needs in one gym management app</h2>
          <p>The daily jobs of a gym, each a few taps away.</p>
        </div>
        <div className="w-grid three">
          {IN_THE_APP.map(([icon, tone, title, text]) => (
            <div key={title} className="w-card plain">
              <span className={`w-icon tone-${tone}`}>
                <Icon name={icon} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-green">
              <Icon name="chat" />
            </span>
            <h2>The app that reminds your members for you</h2>
            <p>
              Chasing renewals by phone takes time every single day. Link your gym’s WhatsApp number once and the gym management app sends the reminders
              itself. <Link to="/whatsapp-automation-for-gyms">See how WhatsApp automation for gyms works</Link>.
            </p>
            <ul className="w-points">
              {REMINDERS.map((point) => (
                <li key={point}>
                  <Icon name="check" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-feature-visual">
            <WhatsAppMock />
          </div>
        </section>
      </div>

      <Faq title="Gym management app and free trial: common questions" items={FAQS} band>
        <p className="w-after">
          <a href={TRIAL_URL} target="_blank" rel="noreferrer">
            Start your free trial on WhatsApp
          </a>
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
