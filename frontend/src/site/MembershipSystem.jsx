import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { MembersMock, ReminderChatMock, RenewalsMock } from './mocks.jsx'
import { OFFERS, PRO, STARTER, perMonth, rupees } from './pricing.js'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const PAGE_URL = 'https://gymsolution.in/gym-membership-management-system'
const TRIAL_URL = whatsappLink('Hi, I want to set up the GymSolution gym membership management system for my gym.')

// Getting a gym onto the system. [heading, text]
const SETUP = [
  ['Add your plans', 'Enter the plans you sell, with their length in months and price, and your admission fee. It takes a few minutes.'],
  ['Add your current members', 'Add each member with the plan they are on and the date their current membership started. The renewal date is filled in.'],
  ['Record what they have paid', 'Enter the payment, or a part payment. Anyone with a balance appears in Pending Dues straight away.'],
  ['Let the system take over', 'From now on, every member’s status, every renewal list and every balance updates by itself.'],
]

// The rules the system follows, from shared/domain.mjs and the README.
const RULES = [
  ['calendar', 'blue', 'Renewal date from the plan', 'A membership runs from its start date for the plan’s number of months. You can change the dates for one member when you need to.'],
  ['users', 'purple', 'Status from the dates', 'Active, expiring soon, expired or not started is worked out from today’s date. Nobody has to update a status by hand.'],
  ['rupee', 'green', 'Balance from the money', 'Plan fee + admission fee − anything waived − payments. A refund never creates a new due.'],
  ['bell', 'orange', 'Overdue flag you control', 'Choose after how many days overdue a member is flagged as likely not coming back.'],
  ['edit', 'blue', 'Changes are logged', 'Edited, moved or cancelled payments and changed membership dates keep a record of what changed.'],
  ['shield', 'purple', 'Nothing deleted by accident', 'Deleting a whole membership made by mistake needs you to type “delete” first.'],
]

// The daily routine. [time, heading, text]
const ROUTINE = [
  ['Morning', 'Check the Renewals screen', 'Overdue, due today and due in the next 7 days, already sorted into lists.'],
  ['At the counter', 'Renew and take payments', 'Renew in a few taps, record cash, UPI, card or bank, and the next renewal date is set.'],
  ['During the day', 'Follow up', 'Call or WhatsApp members from the lists in one tap. On the Pro plan, renewal-day reminders go out by themselves.'],
  ['Evening', 'Look at the numbers', 'This month’s collection, expenses, profit and pending dues on the dashboard.'],
]

// [the job, a spreadsheet, the system]
const COMPARE = [
  ['Renewal dates', 'Typed in, or worked out with a formula you have to maintain', 'Set from the plan every time you add or renew'],
  ['Who is due this week', 'Sort and filter the sheet every morning', 'Listed for you, updated every day'],
  ['Balances after part payments', 'Add a column, hope nobody overwrites it', 'Worked out from the fee and payments'],
  ['Payment history', 'Separate sheet, easy to get out of step', 'Kept with each membership'],
  ['Reminders', 'Copy the number into WhatsApp and type a message', 'One tap, or automatic on the Pro plan'],
  ['On the phone', 'Hard to read and easy to break', 'Built for the phone screen'],
]

const FAQS = [
  {
    q: 'What is a gym membership management system?',
    a: 'It is a system that stores your members, the plans they are on and their payments, and uses them to work out renewal dates, membership status and balances for you. GymSolution does this and shows the results as simple lists: who is due, who has expired and who owes money.',
  },
  {
    q: 'How do I move my existing members into the system?',
    a: 'Add your plans first, then add each member with their plan and the date their current membership started. GymSolution fills in the renewal date and puts them straight into the right list. Most small gyms finish in an evening.',
  },
  {
    q: 'How does the system track renewal dates?',
    a: 'Each membership runs from its start date for the number of months in its plan, and the renewal date is the day after it ends. When the member renews on time, the new membership carries on from the old renewal date, so no days are lost or added.',
    link: ['/gym-membership-renewal-software', 'More on membership renewal management.'],
  },
  {
    q: 'What if a member renews early or late?',
    a: 'Renew early and the new membership waits under Not started until the current one ends. Renew late and you choose: continue from the old renewal date, or start from today if they were away for a long time.',
  },
  {
    q: 'Can the system send renewal reminders automatically?',
    a: `Yes, on the Pro plan at ${rupees(PRO)} a year. Members get a WhatsApp message from your gym number on the renewal date, and once more two days later if they have not renewed.`,
    link: ['/whatsapp-automation-for-gyms', 'How the WhatsApp reminders work.'],
  },
  {
    q: 'How is a member’s balance worked out?',
    a: 'Plan fee plus admission fee, minus anything you waived, minus the payments made. It is calculated for each membership, so an old balance is not lost when the member renews.',
    link: ['/gym-dues-collection-software', 'More on dues collection.'],
  },
  {
    q: 'Is my members’ data safe and can I take a copy?',
    a: 'Each gym’s data is kept in its own separate database. From Settings, you can download your members, payments, expenses and stock as Excel-ready CSV files, or a full backup file, whenever you like.',
  },
  {
    q: 'Is this different from gym membership management software?',
    a: 'They mean the same thing. This page explains how the GymSolution system works behind the screens. For an overview of the features, see the gym membership management software page.',
    link: ['/gym-membership-management-software', 'Gym membership management software.'],
  },
  {
    q: 'How much does the system cost?',
    a: `Every plan includes the full membership management system, starting at ${rupees(STARTER)} a year (about ₹${perMonth(STARTER)} a month). Automatic WhatsApp reminders come with the Pro plan at ${rupees(PRO)} a year.`,
    link: ['/gym-management-software-pricing', 'Compare all plans.'],
  },
]

// What search engines read about the page: the product, its plans, and where the page sits. The questions are added by Faq.
const STRUCTURED = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'GymSolution',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Android, iOS, Windows',
    url: PAGE_URL,
    description:
      'Gym membership management system that works out renewal dates, membership status and balances from your plans and payments, lists upcoming and expired memberships, and sends automatic WhatsApp renewal reminders.',
    featureList: [
      'Renewal dates set from the membership plan',
      'Automatic membership status',
      'Upcoming, due today and expired renewal lists',
      'Payment history and balances per membership',
      'Automatic WhatsApp renewal reminders',
      'CSV export and full backup',
    ],
    offers: OFFERS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gymsolution.in/' },
      { '@type': 'ListItem', position: 2, name: 'Gym Membership Management System', item: PAGE_URL },
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

export default function MembershipSystem() {
  return (
    <SiteLayout
      title="Gym Membership Management System – How It Works | GymSolution"
      description={`See how the GymSolution gym membership management system works: set up plans and members, track renewal dates, expired and upcoming renewals, payments and dues, with automatic WhatsApp reminders. From ${rupees(STARTER)}/year.`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">How the system works</span>
          <h1>Gym Membership Management System</h1>
          <p>
            Tell GymSolution your plans, your members and what they paid. From then on the system keeps every renewal date, membership status and balance
            up to date by itself, and shows you who to follow up with each day.
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

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Setting up</span>
          <h2>Set up your gym membership system in one evening</h2>
          <p>No consultant, no hardware and no training course. Four steps, and your gym is on the system.</p>
        </div>
        <ol className="w-steps">
          {SETUP.map(([title, text], i) => (
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
          <div className="w-section-head">
            <span className="w-eyebrow dark">Behind the screens</span>
            <h2>The rules the system follows for you</h2>
            <p>A good system is predictable. These are the rules GymSolution uses, so you always know why a member is where they are.</p>
          </div>
          <Cards items={RULES} />
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-purple">
              <Icon name="calendar" />
            </span>
            <h2>Membership renewal management, day by day</h2>
            <p>
              The system sorts every member by their renewal date and refreshes the lists each day. Upcoming renewals, renewals due today and expired
              memberships are always one tap away.
            </p>
            <Points
              items={[
                'Overdue: expired and not renewed, with days overdue',
                'Due today and due in the next 7 days',
                'Starting soon: renewals paid in advance',
                'Renew early, or late from the old date or from today',
              ]}
            />
            <Link to="/gym-membership-renewal-software" className="w-more">
              More on renewal management <Icon name="arrow" />
            </Link>
          </div>
          <div className="w-feature-visual">
            <RenewalsMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">A day on the system</span>
            <h2>How gym owners follow up with members on time</h2>
            <p>A simple routine that keeps renewals and payments from slipping.</p>
          </div>
          <ol className="w-steps">
            {ROUTINE.map(([time, title, text]) => (
              <li key={time}>
                <span className="w-step-num">
                  <Icon name="check" />
                </span>
                <h3>
                  {time}: {title}
                </h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-blue">
              <Icon name="users" />
            </span>
            <h2>Organised member records you can search in seconds</h2>
            <p>
              Every member’s details, joining date, current plan, renewal date and payment history live in one record. Filter the member list or search by
              name, mobile number or member number.
            </p>
            <Points
              items={[
                'Filters: Active, Expiring soon, Expired, Due pending, Not started, Hidden',
                'Full history of every membership and payment',
                'Hide members who left, rejoin them if they return',
                'A warning when a mobile number is already in use',
              ]}
            />
            <Link to="/gym-membership-management-software" className="w-more">
              See the membership management features <Icon name="arrow" />
            </Link>
          </div>
          <div className="w-feature-visual">
            <MembersMock />
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
              <h2>Automatic WhatsApp renewal reminders</h2>
              <p>
                On the Pro plan, the system sends each member a WhatsApp reminder from your gym number when their membership ends, and once more two days
                later if they have not renewed. Fewer missed renewals, without a single phone call.
              </p>
              <Points items={['From your own gym WhatsApp number', 'Skips members who renewed or are hidden', 'Sent between 8 am and 9 pm', 'A log of every message']} />
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
          <span className="w-eyebrow dark">Spreadsheet or system</span>
          <h2>Gym membership tracking in a spreadsheet vs a membership system</h2>
          <p>Many gyms move from a register to Excel. Here is what changes when you move to a proper system.</p>
        </div>
        <div className="w-table-wrap">
          <table className="w-compare">
            <thead>
              <tr>
                <th scope="col">Job</th>
                <th scope="col">Excel or Google Sheets</th>
                <th scope="col">GymSolution</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([job, sheet, system]) => (
                <tr key={job}>
                  <th scope="row">{job}</th>
                  <td>{sheet}</td>
                  <td>
                    <Icon name="check" />
                    {system}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="w-after">Still like Excel for reports? Download your members, payments and expenses as CSV files at any time.</p>
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-price">
            <div className="w-price-card">
              <span>Membership system from</span>
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
              <span className="w-eyebrow dark">One system for the whole gym</span>
              <h2>More than a membership system</h2>
              <p>
                The same system that manages your members also tracks your expenses, profit and supplement stock, so the whole gym runs from one place.
              </p>
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
            See <Link to="/features">all features</Link>, <Link to="/gym-expense-tracking-software">expense tracking</Link> and{' '}
            <Link to="/gym-stock-management-software">stock management</Link>.
          </p>
        </div>
      </section>

      <Faq title="Gym membership management system: common questions" items={FAQS}>
        <p className="w-after">
          <Link to="/gym-management-app-free">Start with a free trial</Link> or <Link to="/gym-management-software-pricing">see GymSolution pricing</Link>.
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
