import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { DashboardMock, InventoryMock, ReminderChatMock, RenewalsMock } from './mocks.jsx'
import { OFFERS, PRO, STARTER, perMonth, rupees } from './pricing.js'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const PAGE_URL = 'https://gymsolution.in/gym-management-app'
const TRIAL_URL = whatsappLink('Hi, I want to try the GymSolution gym management app for my gym.')

// Everything in the app, and what the owner does with it. [icon, colour, heading, text]
const IN_THE_APP = [
  ['users', 'blue', 'Members and memberships', 'Add a member with their plan, and the fee and renewal date fill in. Search anyone by name or mobile.'],
  ['calendar', 'purple', 'Renewals', 'Overdue, due today and next 7 days. Renew on the same plan or a new one in a few taps.'],
  ['wallet', 'green', 'Payments and dues', 'Cash, UPI, card and bank payments, part payments, and a Pending Dues list with the total to collect.'],
  ['receipt', 'orange', 'Expenses', 'Rent, electricity, salaries and repairs, each with its category and a photo of the bill.'],
  ['chart', 'blue', 'Profit reports', 'Income, expenses and profit for every month and the year, with charts you can read at a glance.'],
  ['box', 'purple', 'Supplement stock', 'Sell protein and creatine, keep stock counts right, and see what is running low.'],
  ['chat', 'green', 'WhatsApp reminders', 'Renewal reminders sent automatically from your gym number on the Pro plan; one-tap messages on every plan.'],
  ['upload', 'orange', 'Excel and backup', 'Download your members, payments, expenses and stock, or a full backup, whenever you want.'],
]

// A real day for a gym owner. [time, heading, text]
const DAY = [
  ['7:30 am', 'Before you leave home', 'Open the dashboard with your morning tea: active members, pending dues and this month’s income on one screen.'],
  ['10:00 am', 'At the counter', 'A member renews. Find them, tap Renew, take the payment by UPI. The next renewal date is set for you.'],
  ['2:00 pm', 'At the supplier', 'Pay for two new dumbbells and a protein restock. Add the expense and the stock purchase on the spot.'],
  ['6:00 pm', 'Away from the gym', 'Check the dues list. Tap WhatsApp beside a member and the balance reminder is already written.'],
  ['10:00 pm', 'End of the day', 'Look at the month so far. On the Pro plan, tomorrow’s renewal reminders will go out by themselves.'],
]

// [the job, a register at the gym, the app]
const COMPARE = [
  ['Checking renewals', 'Turn the register pages, or call the gym', 'Open Renewals on your phone'],
  ['Knowing this month’s income', 'Add up the receipt book', 'Shown on the dashboard, always current'],
  ['Following up on dues', 'Find the number, work out the amount, type a message', 'Tap WhatsApp; the exact balance is in the message'],
  ['Recording an expense', 'Keep the slip and write it in later', 'Add it with a bill photo where you paid'],
  ['Supplement stock', 'Count the tins on the shelf', 'Stock count updates with every sale and purchase'],
  ['Monthly profit', 'A rough guess at month end', 'Worked out for every month'],
]

// What changes for the owner. [icon, colour, heading, text]
const BENEFITS = [
  ['bolt', 'orange', 'Simpler daily operations', 'Admissions, renewals and payments take a few taps, with dates and balances worked out for you.'],
  ['receipt', 'blue', 'Less paperwork', 'No register, receipt book, expense diary or stock notebook to keep up to date.'],
  ['bell', 'green', 'Better member follow-ups', 'Renewals and dues are listed every day, so members are reminded on time instead of when someone remembers.'],
  ['trend', 'purple', 'A clear view of the business', 'Know what the gym earned this month, where the money went and how it compares with last month.'],
  ['home', 'blue', 'Not tied to the counter', 'Run the gym from home, a second job or while travelling. Your records are wherever your phone is.'],
  ['shield', 'green', 'Records you can trust', 'Every payment is kept with its date and mode, and corrections to payments are logged.'],
]

const FAQS = [
  {
    q: 'What is a gym management app?',
    a: 'It is an app that gym owners use to run the gym: member records, memberships, renewals, payments, dues, expenses and reports, in one place. GymSolution also manages supplement stock and sends WhatsApp renewal reminders.',
  },
  {
    q: 'Is GymSolution on the Play Store or App Store?',
    a: 'No. GymSolution is a web app: it runs in Chrome, Safari or any browser on your phone, tablet or laptop, so there is nothing to download or update. You can add it to your phone’s home screen to open it in one tap, like any app.',
    link: ['/gym-membership-management-app', 'How it works on phone and laptop.'],
  },
  {
    q: 'Can I manage my gym without being at the gym?',
    a: 'Yes. Renewals, expired members, pending dues, member records, expenses, stock and profit are on your phone wherever you are. You can also renew members and record payments remotely, for example when a member pays by UPI.',
  },
  {
    q: 'Can my phone and the gym computer use it at the same time?',
    a: 'Yes. Log in on both with the same account. Your records are kept in your account, not on the device, so both show the same members, payments and expenses.',
  },
  {
    q: 'Does the app send WhatsApp reminders automatically?',
    a: `Yes, on the Pro plan at ${rupees(PRO)} a year: a reminder from your gym number on the renewal date, and one more two days later if the member has not renewed. Upcoming renewals and pending dues have ready-written messages you send in one tap.`,
    link: ['/whatsapp-reminder-software-for-gym', 'See exactly how the reminders work.'],
  },
  {
    q: 'Can it track my gym’s profit?',
    a: 'Yes. The dashboard shows membership fees and shop sales as income, your expenses and stock purchases as spending, and the profit or loss for each month and the year.',
  },
  {
    q: 'What happens to my data if I lose my phone?',
    a: 'Nothing is lost. Your records are not stored on the phone, so you log in on a new phone and everything is there. Changing your password signs out every other device.',
  },
  {
    q: 'Does it work without internet?',
    a: 'No. GymSolution needs an internet connection to load and save your records. Ordinary mobile data is enough.',
  },
  {
    q: 'How much does the gym management app cost?',
    a: `The Starter plan is ${rupees(STARTER)} a year (about ₹${perMonth(STARTER)} a month) with members, renewals, payments, dues, expenses, profit reports and stock. Automatic WhatsApp reminders come with the Pro plan at ${rupees(PRO)} a year. You can try it free first.`,
    link: ['/gym-management-app-free', 'Try the gym management app free.'],
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
      'Gym management app for gym owners, used in the phone or laptop browser: members, memberships, renewals, payments, pending dues, expenses, profit reports, supplement stock and automatic WhatsApp renewal reminders.',
    featureList: [
      'Members and membership plans',
      'Renewals and expired memberships',
      'Payments and pending dues',
      'Expense tracking and profit reports',
      'Supplement stock management',
      'Automatic WhatsApp renewal reminders (Pro plan)',
    ],
    offers: OFFERS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gymsolution.in/' },
      { '@type': 'ListItem', position: 2, name: 'Gym Management App', item: PAGE_URL },
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

function Cards({ items, columns = 'three' }) {
  return (
    <div className={`w-grid ${columns}`}>
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

export default function ManagementApp() {
  return (
    <SiteLayout
      title="Gym Management App for Gym Owners – Run Your Gym Anywhere | GymSolution"
      description={`GymSolution is a gym management app for owners: members, renewals, payments, dues, expenses, profit, supplement stock and WhatsApp reminders in one place, in your phone or laptop browser. From ${rupees(STARTER)}/year.`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">The gym owner app</span>
          <h1>Gym Management App for Gym Owners</h1>
          <p>
            You cannot stand at the counter all day, and you should not have to. GymSolution puts your members, renewals, dues, expenses, stock and profit
            in one app, so you can run the gym from wherever you are. It works in your phone’s browser: nothing to download.
          </p>
          <div className="w-hero-actions center">
            <a href={TRIAL_URL} className="w-btn primary" target="_blank" rel="noreferrer">
              Get started
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
            <h2>Run your gym without being there all the time</h2>
            <p>
              Most gym owners juggle more than one job: training clients, meeting suppliers, running a second branch, or simply being at home with family.
              Meanwhile the gym’s members and money sit in a register on the counter. GymSolution moves all of it into an app on your phone.
            </p>
            <Points
              items={[
                'See today’s renewals and expired members from home',
                'Renew a member and record a UPI payment from anywhere',
                'Know your pending dues without calling the gym',
                'Check income, expenses and profit at any time',
              ]}
            />
          </div>
          <div className="w-feature-visual">
            <DashboardMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">All in one app</span>
            <h2>Everything you need to run a gym, in one gym business management app</h2>
            <p>No separate apps for members, accounts and the supplement shop. Every plan includes all of this.</p>
          </div>
          <Cards items={IN_THE_APP} columns="" />
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">A day with GymSolution</span>
          <h2>How a gym owner uses the app through the day</h2>
          <p>An ordinary day, run from one phone.</p>
        </div>
        <ol className="w-steps">
          {DAY.map(([time, title, text]) => (
            <li key={time}>
              <span className="w-step-num">
                <Icon name="check" />
              </span>
              <h3>
                {time} · {title}
              </h3>
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
              <h2>Better member follow-ups, every day</h2>
              <p>
                Renewals are where a gym’s income comes from. The app sorts members by renewal date every day, so you always know who to talk to, and on the
                Pro plan it sends the WhatsApp reminders itself.
              </p>
              <Points
                items={[
                  'Overdue, due today and next 7 days',
                  'Call or WhatsApp a member from the list in one tap',
                  'Automatic reminder on the renewal date and 2 days later (Pro)',
                  'Pending dues with the date each member promised to pay',
                ]}
              />
              <Link to="/gym-membership-renewal-software" className="w-more">
                More on renewals <Icon name="arrow" />
              </Link>
            </div>
            <div className="w-feature-visual">
              <RenewalsMock />
            </div>
          </div>
          <div className="w-feature">
            <div className="w-feature-text">
              <span className="w-icon tone-green">
                <Icon name="chat" />
              </span>
              <h2>WhatsApp reminders that go out even when the app is closed</h2>
              <p>
                You do not need to be at the gym, or even open the app, for renewal reminders to reach your members. They come from your own gym number at a
                safe, human pace.
              </p>
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

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-orange">
              <Icon name="trend" />
            </span>
            <h2>Track your gym business, not just your members</h2>
            <p>
              A gym is a business, and the app treats it like one. Expenses, the supplement shop and membership income all feed into one profit figure for
              every month.
            </p>
            <Points
              items={[
                'Expenses by category with bill photos',
                'Stock counts that update with every sale and purchase',
                'Low-stock warnings before a product runs out',
                'Shop sales as income, stock bought as an expense',
              ]}
            />
            <p className="w-after">
              See <Link to="/gym-expense-tracking-software">expense tracking</Link> and <Link to="/gym-stock-management-software">stock management</Link>.
            </p>
          </div>
          <div className="w-feature-visual">
            <InventoryMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Register or app</span>
            <h2>Running a gym from a register vs from an app</h2>
            <p>The same daily jobs, with far less writing and adding up.</p>
          </div>
          <div className="w-table-wrap">
            <table className="w-compare">
              <thead>
                <tr>
                  <th scope="col">Job</th>
                  <th scope="col">Register at the gym</th>
                  <th scope="col">GymSolution app</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([job, before, withApp]) => (
                  <tr key={job}>
                    <th scope="row">{job}</th>
                    <td>{before}</td>
                    <td>
                      <Icon name="check" />
                      {withApp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Why owners switch</span>
          <h2>How a gym management app makes your work easier</h2>
          <p>Less time on records, more time on your members and your business.</p>
        </div>
        <Cards items={BENEFITS} />
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-price">
            <div className="w-price-card">
              <span>Gym management app from</span>
              <p className="w-price-amount">
                {rupees(STARTER)}
                <small>/ year</small>
              </p>
              <p>About ₹{perMonth(STARTER)} a month. Automatic WhatsApp reminders from {rupees(PRO)} a year.</p>
              <Link to="/gym-management-software-pricing" className="w-btn light">
                See all plans
                <Icon name="arrow" />
              </Link>
            </div>
            <div className="w-price-text">
              <span className="w-eyebrow dark">No download</span>
              <h2>An app that works on any phone or laptop</h2>
              <p>
                GymSolution runs in Chrome, Safari or any modern browser. There is no app store download and nothing to update, and you can add it to your
                home screen for one-tap access.
              </p>
              <ul className="w-ticks">
                <li>
                  <Icon name="check" />
                  Android and iPhone
                </li>
                <li>
                  <Icon name="check" />
                  Laptop and counter PC
                </li>
                <li>
                  <Icon name="check" />
                  Nothing to install
                </li>
                <li>
                  <Icon name="check" />
                  Light and dark mode
                </li>
              </ul>
            </div>
          </div>
          <p className="w-after">
            See the <Link to="/gym-membership-management-app">membership app on phone and laptop</Link>, the{' '}
            <Link to="/gym-management-website">online gym management system</Link>, or <Link to="/features">all features</Link>.
          </p>
        </div>
      </section>

      <Faq title="Gym management app: common questions" items={FAQS}>
        <p className="w-after">
          <Link to="/gym-management-app-free">Start with a free trial</Link> or <Link to="/gym-management-software-pricing">see GymSolution pricing</Link>.
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
