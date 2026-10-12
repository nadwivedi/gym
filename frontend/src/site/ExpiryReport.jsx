import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { DashboardMock, MembersMock, ReminderChatMock, RenewalsMock } from './mocks.jsx'
import { OFFERS, PRO, STARTER, perMonth, rupees } from './pricing.js'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const PAGE_URL = 'https://gymsolution.in/gym-membership-expiry-report-software'
const TRIAL_URL = whatsappLink('Hi, I want to try the GymSolution membership expiry report for my gym.')

// The expiry lists on the Renewals screen, as the app builds them. [icon, colour, heading, text]
const LISTS = [
  ['alert', 'orange', 'Expired (overdue)', 'Memberships that have ended and were not renewed, with how many days overdue each one is.'],
  ['calendar', 'purple', 'Expiring today', 'Members whose membership ends today, to catch at the counter or message straight away.'],
  ['bell', 'blue', 'Expiring in the next 7 days', 'Upcoming expiries for the week, so you can talk to members before their plan lapses.'],
  ['check', 'green', 'Starting soon', 'Members who renewed in advance. Their next membership is paid and waiting to start.'],
  ['eye', 'purple', 'Hidden', 'Members who stopped coming, kept out of the expiry lists with the reason you gave.'],
  ['rupee', 'orange', 'Dues filter', 'Narrow any list to members with dues pending, or with no dues, to plan your follow-ups.'],
]

// The member export, as exportController.membersCsv writes it.
const EXPORT_COLUMNS = ['Member number and name', 'Phone', 'Status: active, expired or upcoming', 'Plan', 'Renewal (expiry) date', 'Balance due', 'Joining date', 'Hidden, with reason']

// A weekly routine with the report. [heading, text]
const ROUTINE = [
  ['Every morning: today and overdue', 'Open Renewals. Renew the members who come in, and tap Call or WhatsApp for the ones who do not.'],
  ['Monday: the week ahead', 'Check “Next 7 days” and remind members before their membership ends, while they are still coming in.'],
  ['Weekly: long-overdue members', 'Members overdue past your limit are flagged as likely not coming. Call them once more, or hide them to keep the list clean.'],
  ['Month end: the full report', 'Download the member list to Excel, sort by renewal date, and compare renewals with new admissions on the dashboard.'],
]

// Benefits. [icon, colour, heading, text]
const BENEFITS = [
  ['bolt', 'orange', 'No report to prepare', 'The expiry lists build themselves from the renewal dates every day. Nothing to compile or update.'],
  ['calendar', 'blue', 'Fewer missed renewals', 'Every expiry shows up before and after the date, so no membership ends unnoticed.'],
  ['users', 'green', 'Better retention', 'Following up in the first days after expiry brings back members while the habit is still fresh.'],
  ['receipt', 'purple', 'Organised member records', 'Each member’s plans, dates and payments are one tap away from any list.'],
  ['chat', 'green', 'Reminders built in', 'On the Pro plan, members on the expired list get a WhatsApp reminder automatically.'],
  ['upload', 'blue', 'Your report, your way', 'Export to Excel for date windows, plans or anything else you want to analyse.'],
]

const FAQS = [
  {
    q: 'What is a gym membership expiry report?',
    a: 'It is a list of members whose membership is about to end or has already ended, usually with their plan, expiry date and contact number, so the gym can follow up for renewal. GymSolution keeps this list up to date for you every day.',
  },
  {
    q: 'How does GymSolution know when a membership expires?',
    a: 'Each membership’s expiry (renewal) date is set from its plan length and start date when you add or renew the member. The member then moves between the expiry lists by themselves as the date approaches and passes.',
  },
  {
    q: 'Can I see memberships expiring in the next 7 days?',
    a: 'Yes. The Renewals screen has a “Next 7 days” list, and the Members list has an “Expiring soon” filter. Both show each member’s expiry date and days left.',
  },
  {
    q: 'Can I get an expiry report for the next 30 days or for one plan?',
    a: 'The on-screen lists cover today, the next 7 days and expired memberships. For a 30-day window, a single plan or any other cut, download the member list to Excel; it includes each member’s status, plan and renewal date, so you can sort and filter it as you like.',
  },
  {
    q: 'Does GymSolution send reminders to expired members?',
    a: `On the Pro plan (${rupees(PRO)} a year), yes: a WhatsApp reminder from your gym number on the expiry date, and one more two days later if the member has not renewed. Upcoming expiries have a ready-written message you send in one tap.`,
    link: ['/whatsapp-reminder-software-for-gym', 'How the WhatsApp reminders work.'],
  },
  {
    q: 'Can the report be emailed to me automatically?',
    a: 'No. GymSolution does not email reports. The expiry lists are always up to date in the app, on your phone or laptop, and you can download the Excel file whenever you need it.',
  },
  {
    q: 'How do I see how many members renewed this month?',
    a: 'The dashboard shows the number of renewals and new admissions for the month or year you pick, next to income, expenses and profit.',
  },
  {
    q: 'How much does the expiry report software cost?',
    a: `Expiry tracking and reports are in every plan, from ${rupees(STARTER)} a year (about ₹${perMonth(STARTER)} a month). Automatic WhatsApp reminders come with the Pro plan at ${rupees(PRO)} a year.`,
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
      'Gym membership expiry report software: daily lists of expired, expiring today and expiring in the next 7 days, member filters, Excel export with status and renewal dates, and automatic WhatsApp renewal reminders.',
    featureList: [
      'Expired, expiring today and next 7 days lists',
      'Expiring soon and expired member filters',
      'Dues filter on the expiry lists',
      'Member export to Excel with status, plan and renewal date',
      'Monthly renewals and new admissions count',
      'Automatic WhatsApp renewal reminders (Pro plan)',
    ],
    offers: OFFERS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gymsolution.in/' },
      { '@type': 'ListItem', position: 2, name: 'Gym Membership Expiry Report Software', item: PAGE_URL },
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

export default function ExpiryReport() {
  return (
    <SiteLayout
      title="Gym Membership Expiry Report Software – Track Expiring Members | GymSolution"
      description={`GymSolution gym membership expiry report software lists expired memberships, expiries today and in the next 7 days, with Excel export and automatic WhatsApp renewal reminders. From ${rupees(STARTER)}/year.`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Gym membership expiry tracking</span>
          <h1>Gym Membership Expiry Report Software</h1>
          <p>
            Know every day which memberships have expired, which end today and which end this week, without preparing a report. GymSolution builds the
            expiry lists from your members’ renewal dates and keeps them up to date by itself.
          </p>
          <div className="w-hero-actions center">
            <a href={TRIAL_URL} className="w-btn primary" target="_blank" rel="noreferrer">
              Start free trial
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
            <span className="w-icon tone-purple">
              <Icon name="calendar" />
            </span>
            <h2>Your membership expiry report, ready every morning</h2>
            <p>
              The Renewals screen is a live gym renewal report. It shows how many active members you have, the dues to collect, and every expiring or
              expired membership in its own list, with a count on each tab.
            </p>
            <Points
              items={[
                'Active members and total dues at the top',
                'Each member’s plan, expiry date and days left or overdue',
                'Search by name, mobile or member number',
                'Renew, call or WhatsApp straight from the list',
              ]}
            />
          </div>
          <div className="w-feature-visual">
            <RenewalsMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">What the report shows</span>
            <h2>Every expiry, sorted into the right list</h2>
            <p>Status is worked out from the dates each day, so a member moves from list to list without anyone updating anything.</p>
          </div>
          <Cards items={LISTS} />
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-blue">
              <Icon name="users" />
            </span>
            <h2>Gym member tracking with expiry filters</h2>
            <p>
              The Members list gives you the same picture across your whole gym. Tap a filter and the count tells you how many members fall into it.
            </p>
            <Points
              items={[
                'Active, Expiring soon and Expired',
                'Due pending, Not started and Hidden',
                'Each member’s full membership and payment history',
              ]}
            />
            <Link to="/gym-membership-management-software" className="w-more">
              More on gym membership management software <Icon name="arrow" />
            </Link>
          </div>
          <div className="w-feature-visual">
            <MembersMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Download the report</span>
            <h2>Export the full expiry report to Excel</h2>
            <p>
              Need expiries for the next 30 days, one plan or a particular month? Download the member list as a CSV file, open it in Excel or Google Sheets,
              and sort or filter by renewal date. It includes:
            </p>
          </div>
          <div className="w-grid three">
            {EXPORT_COLUMNS.map((col) => (
              <div key={col} className="w-card plain">
                <span className="w-icon tone-blue">
                  <Icon name="upload" />
                </span>
                <h3>{col}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-green">
              <Icon name="chat" />
            </span>
            <h2>Expired membership management with WhatsApp reminders</h2>
            <p>
              A report only helps if someone acts on it. On the Pro plan, members on the expired list get a WhatsApp reminder from your gym number on the
              expiry date, and once more two days later if they have not renewed.
            </p>
            <Points items={['Skips members who renewed or are hidden', 'One-tap messages for upcoming expiries', 'A log of every reminder sent']} />
            <Link to="/whatsapp-reminder-software-for-gym" className="w-more">
              How the reminders work <Icon name="arrow" />
            </Link>
          </div>
          <div className="w-feature-visual">
            <ReminderChatMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Using the report</span>
            <h2>A simple weekly routine with the expiry report</h2>
            <p>How gym owners turn expiry tracking into renewals.</p>
          </div>
          <ol className="w-steps">
            {ROUTINE.map(([title, text], i) => (
              <li key={title}>
                <span className="w-step-num">{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-orange">
              <Icon name="chart" />
            </span>
            <h2>Renewals and admissions on the dashboard</h2>
            <p>
              See how many members renewed and how many joined in the month or year you pick, next to your income, expenses and profit. A quick way to tell
              whether retention is improving.
            </p>
          </div>
          <div className="w-feature-visual">
            <DashboardMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Why it matters</span>
            <h2>Benefits of gym membership expiry tracking software</h2>
            <p>Less time on lists, more time with the members who need a nudge.</p>
          </div>
          <Cards items={BENEFITS} />
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-price">
          <div className="w-price-card">
            <span>Expiry reports from</span>
            <p className="w-price-amount">
              {rupees(STARTER)}
              <small>/ year</small>
            </p>
            <p>About ₹{perMonth(STARTER)} a month, in every plan. Automatic WhatsApp reminders from {rupees(PRO)} a year.</p>
            <Link to="/gym-management-software-pricing" className="w-btn light">
              See all plans
              <Icon name="arrow" />
            </Link>
          </div>
          <div className="w-price-text">
            <span className="w-eyebrow dark">More than a report</span>
            <h2>Expiry tracking inside complete gym management software</h2>
            <p>
              The same account keeps your members, renewals, payments, dues, expenses, profit and supplement stock, so the expiry report always uses
              up-to-date records.
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
          See the <Link to="/gym-membership-renewal-software">gym membership renewal software</Link>, the{' '}
          <Link to="/gym-dues-collection-software">dues collection software</Link>, or <Link to="/features">all features</Link>.
        </p>
      </section>

      <Faq title="Gym membership expiry report software: common questions" items={FAQS} band>
        <p className="w-after">
          <Link to="/gym-management-app-free">Start with a free trial</Link> or <Link to="/gym-management-software-pricing">see GymSolution pricing</Link>.
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
