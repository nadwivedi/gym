import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { DuesMock, MembersMock, ReminderChatMock, RenewalsMock } from './mocks.jsx'
import { OFFERS, PRO, STARTER, perMonth, rupees } from './pricing.js'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const PAGE_URL = 'https://gymsolution.in/gym-membership-management-app'
const TRIAL_URL = whatsappLink('Hi, I want to try the GymSolution gym membership management app.')

// The screens of the app, as its bottom bar (phone) and sidebar (laptop) list them. [icon, colour, heading, text]
const SCREENS = [
  ['calendar', 'purple', 'Renewals', 'Overdue, due today, due in the next 7 days and starting soon. The screen to open every morning.'],
  ['users', 'blue', 'Members', 'Every member with filters for active, expiring soon, expired, due pending, not started and hidden.'],
  ['wallet', 'green', 'Payments', 'Pending dues with the total to collect, and the latest payments received.'],
  ['receipt', 'orange', 'Expenses', 'What the gym spent this month, by category, with bill photos.'],
  ['chart', 'blue', 'Dashboard', 'Income, expenses, profit and pending dues for the month or year.'],
  ['settings', 'purple', 'Settings', 'Your plans and prices, gym details, WhatsApp reminders and data downloads.'],
]

// Common jobs and how they are done in the app. [heading, text]
const TASKS = [
  ['Add a new member', 'Tap Add Member, type the name and mobile number, pick a plan. The fee, admission fee and renewal date fill in. Record the payment and save.'],
  ['Renew a membership', 'Find the member in Renewals or by search, tap Renew, choose the plan, take the payment. The next renewal date is set.'],
  ['Take a part payment', 'Enter what the member pays now and, if you like, the date they promised to pay the rest. The balance goes into Pending Dues.'],
  ['Remind a member', 'Tap the WhatsApp button beside them. A message with their renewal date or balance is already written.'],
]

// Using it on different devices.
const DEVICE_POINTS = [
  'On the phone: big buttons, a bottom bar for the main screens, and forms that slide up from below',
  'On a laptop or counter computer: a sidebar and more room for lists and charts',
  'Log in on both at once: they show the same members and payments',
  'Add it to your phone’s home screen for one-tap access, like any app',
  'Light or dark screens, whichever you prefer',
]

// What the owner gets out of it. [icon, colour, heading, text]
const BENEFITS = [
  ['calendar', 'blue', 'Fewer missed renewals', 'Renewals are listed every day, and on the Pro plan WhatsApp reminders go out by themselves.'],
  ['search', 'purple', 'Easy member tracking', 'Search by name, mobile or member number. Every member’s plan, dates and payments are on one screen.'],
  ['receipt', 'orange', 'No more paperwork', 'No register, no receipt book to total up and no Excel sheet to keep in step.'],
  ['bolt', 'green', 'Time back every day', 'Renewal dates, statuses and balances are worked out for you, so the counter work takes minutes.'],
  ['home', 'blue', 'Manage from anywhere', 'Check your gym from home, a second job or while travelling. You only need a browser and the internet.'],
  ['upload', 'purple', 'Your data, always', 'Download members, payments and expenses to Excel, or a full backup, whenever you want.'],
]

const FAQS = [
  {
    q: 'Is there a GymSolution app on the Play Store or App Store?',
    a: 'No. GymSolution is a web app: you open it in Chrome, Safari or any browser on your phone or laptop and log in. There is nothing to download or update, and you can add it to your phone’s home screen so it opens in one tap.',
  },
  {
    q: 'How do I add GymSolution to my phone’s home screen?',
    a: 'On Android, open it in Chrome, tap the menu and choose “Add to Home screen”. On iPhone, open it in Safari, tap Share and choose “Add to Home Screen”.',
  },
  {
    q: 'Can I use the same account on my phone and my laptop?',
    a: 'Yes. Log in with the same email and password on both. Your members, payments and expenses are kept in your account, not on the device, so both show the same records.',
  },
  {
    q: 'What can I do in the gym membership management app?',
    a: 'Add members, set up plans, renew memberships, take full or part payments, track pending dues, see expired and upcoming renewals, record expenses, manage supplement stock and see your monthly profit.',
    link: ['/gym-membership-management-software', 'See all membership management features.'],
  },
  {
    q: 'Does the app send renewal reminders to members?',
    a: `On the Pro plan (${rupees(PRO)} a year), a WhatsApp reminder goes automatically from your gym number on the renewal date, and again two days later if the member has not renewed. On every plan, you can send a ready-written WhatsApp message in one tap.`,
    link: ['/whatsapp-automation-for-gyms', 'How the WhatsApp reminders work.'],
  },
  {
    q: 'Do my members need to download anything?',
    a: 'No. The app is for you, the gym owner. Members do not need an app or a login. They simply get WhatsApp messages from your gym’s number.',
  },
  {
    q: 'What happens if I change my phone?',
    a: 'Nothing is lost. Open GymSolution on the new phone, log in, and everything is there. If you change your password, other devices are signed out.',
  },
  {
    q: 'How much does the gym membership app cost?',
    a: `The Starter plan is ${rupees(STARTER)} a year (about ₹${perMonth(STARTER)} a month) and works on any phone and laptop. The Pro plan with automatic WhatsApp reminders is ${rupees(PRO)} a year.`,
    link: ['/gym-management-software-pricing', 'Compare all plans.'],
  },
]

// What search engines read about the page: the web app, its plans, and where the page sits. The questions are added by Faq.
const STRUCTURED = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'GymSolution',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any (web browser): Android, iOS, Windows, macOS',
    browserRequirements: 'Requires a modern web browser such as Chrome or Safari',
    url: PAGE_URL,
    description:
      'Gym membership management app that runs in the browser on phones and laptops: member records, plans, renewal dates, expired and upcoming renewals, payment history, pending dues and automatic WhatsApp renewal reminders.',
    featureList: [
      'Works in the phone and laptop browser',
      'Member records and membership plans',
      'Expired, due today and upcoming renewals',
      'Payment history and pending dues',
      'Automatic WhatsApp renewal reminders',
    ],
    offers: OFFERS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gymsolution.in/' },
      { '@type': 'ListItem', position: 2, name: 'Gym Membership Management App', item: PAGE_URL },
    ],
  },
]

function Points({ items }) {
  return (
    <ul className="w-points">
      {items.map((point) => (
        <li key={point}>
          <Icon name="check" />
          {point}
        </li>
      ))}
    </ul>
  )
}

function Cards({ items }) {
  return (
    <div className="w-grid three">
      {items.map(([icon, tone, title, text]) => (
        <div key={title} className="w-card plain">
          <span className={`w-icon tone-${tone}`}>
            <Icon name={icon} />
          </span>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      ))}
    </div>
  )
}

export default function MembershipApp() {
  return (
    <SiteLayout
      title="Gym Membership Management App – On Your Phone & Laptop | GymSolution"
      description={`GymSolution is a gym membership management app that runs in your phone and laptop browser: members, plans, renewals, expired memberships, payments, dues and automatic WhatsApp reminders. No download. From ${rupees(STARTER)}/year.`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Open it on any phone or laptop</span>
          <h1>Gym Membership Management App</h1>
          <p>
            GymSolution is a membership app for gym owners that runs in your browser. Add members, renew them, take payments and see who is due, from the
            phone in your pocket or the laptop at the counter. Nothing to download.
          </p>
          <div className="w-hero-actions center">
            <a href={TRIAL_URL} className="w-btn primary" target="_blank" rel="noreferrer">
              Try it free
              <Icon name="arrow" />
            </a>
            <Link to="/gym-management-software-pricing" className="w-btn ghost">
              See pricing
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
            <h2>A membership app made for the phone, that works on the laptop too</h2>
            <p>
              Most gym owners manage from their phone, and keep a computer at the counter. GymSolution is designed for both, with the same account and the
              same records on every device.
            </p>
            <Points items={DEVICE_POINTS} />
          </div>
          <div className="w-feature-visual">
            <MembersMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Inside the app</span>
            <h2>A quick tour of the gym member management app</h2>
            <p>Six screens cover everything. On the phone the main ones sit in the bottom bar; on a laptop, in the sidebar.</p>
          </div>
          <Cards items={SCREENS} />
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Everyday jobs</span>
          <h2>Common membership tasks, done in a few taps</h2>
          <p>The jobs you do every day at the counter, and how long they take in the app.</p>
        </div>
        <ol className="w-steps">
          {TASKS.map(([title, text], i) => (
            <li key={title}>
              <span className="w-step-num">{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-feature">
            <div className="w-feature-text">
              <span className="w-icon tone-purple">
                <Icon name="calendar" />
              </span>
              <h2>A membership tracking app that shows who needs attention</h2>
              <p>
                Joining dates, renewal dates and plans are kept for every member, and the app sorts them for you. Open Renewals and the day’s work is already
                in front of you.
              </p>
              <Points
                items={[
                  'Expired memberships, with how many days overdue',
                  'Renewals due today and in the next 7 days',
                  'Renewals paid in advance, waiting to start',
                  'Long-overdue members flagged as likely not coming',
                ]}
              />
              <Link to="/gym-membership-renewal-software" className="w-more">
                More on the membership renewal app <Icon name="arrow" />
              </Link>
            </div>
            <div className="w-feature-visual">
              <RenewalsMock />
            </div>
          </div>
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-orange">
              <Icon name="wallet" />
            </span>
            <h2>Payment history and pending dues in your pocket</h2>
            <p>
              Every payment is kept against the membership it pays for. The Payments screen shows everyone who still owes money and the total to collect,
              biggest dues first.
            </p>
            <Points
              items={[
                'Cash, UPI, card and bank payments',
                'Part payments with the promised date for the rest',
                'Record a payment straight from the dues list',
                'Each member’s full payment history on their profile',
              ]}
            />
            <Link to="/gym-dues-collection-software" className="w-more">
              More on dues collection <Icon name="arrow" />
            </Link>
          </div>
          <div className="w-feature-visual">
            <DuesMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-feature">
            <div className="w-feature-text">
              <span className="w-icon tone-green">
                <Icon name="chat" />
              </span>
              <h2>Renewal reminders on WhatsApp, even when the app is closed</h2>
              <p>
                On the Pro plan, reminders are sent from your gym’s WhatsApp number on the renewal date, and once more two days later if the member has not
                renewed. You do not need to have the app open.
              </p>
              <Points items={['From your own gym number', 'Skips members who renewed or are hidden', 'A log of every message in the app']} />
              <Link to="/whatsapp-automation-for-gyms" className="w-more">
                How WhatsApp automation works <Icon name="arrow" />
              </Link>
            </div>
            <div className="w-feature-visual">
              <ReminderChatMock />
            </div>
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Why owners use it</span>
          <h2>What a gym membership app changes for you</h2>
          <p>Organised records, fewer missed renewals and less time on paperwork.</p>
        </div>
        <Cards items={BENEFITS} />
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-price">
            <div className="w-price-card">
              <span>Membership app from</span>
              <p className="w-price-amount">
                {rupees(STARTER)}
                <small>/ year</small>
              </p>
              <p>About ₹{perMonth(STARTER)} a month, on all your devices. Automatic WhatsApp reminders from {rupees(PRO)} a year.</p>
              <Link to="/gym-management-software-pricing" className="w-btn light">
                See all plans
                <Icon name="arrow" />
              </Link>
            </div>
            <div className="w-price-text">
              <span className="w-eyebrow dark">One app for the gym</span>
              <h2>Memberships, and the rest of your gym</h2>
              <p>The same app keeps your expenses, monthly profit and supplement stock, so you do not need a second app for the business side.</p>
              <ul className="w-ticks">
                <li>
                  <Icon name="check" />
                  Members and renewals
                </li>
                <li>
                  <Icon name="check" />
                  Payments and dues
                </li>
                <li>
                  <Icon name="check" />
                  Expenses and profit
                </li>
                <li>
                  <Icon name="check" />
                  Supplement stock
                </li>
              </ul>
            </div>
          </div>
          <p className="w-after">
            Read about the <Link to="/gym-membership-management-software">membership management features</Link>,{' '}
            <Link to="/gym-membership-management-system">how the membership system works</Link>, or try the{' '}
            <Link to="/gym-management-app-free">free gym management app</Link>.
          </p>
        </div>
      </section>

      <Faq title="Gym membership management app: common questions" items={FAQS}>
        <p className="w-after">
          <Link to="/gym-management-app-free">Start with a free trial</Link> or <Link to="/gym-management-software-pricing">see GymSolution pricing</Link>.
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
