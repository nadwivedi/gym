import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { DashboardMock, ExpensesMock, InventoryMock, RenewalsMock } from './mocks.jsx'
import { OFFERS, PRO, STARTER, perMonth, rupees } from './pricing.js'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const PAGE_URL = 'https://gymsolution.in/gym-management-website'
const TRIAL_URL = whatsappLink('Hi, I want to start managing my gym online with GymSolution.')

// Everything the website manages. [icon, colour, heading, text, link]
const MODULES = [
  ['users', 'blue', 'Members and memberships', 'Member records, plans, joining and renewal dates, and filters for active, expiring, expired and hidden members.', '/gym-membership-management-software'],
  ['calendar', 'purple', 'Renewals', 'Overdue, due today and next 7 days, sorted for you every day. Renew in a few clicks.', '/gym-membership-renewal-software'],
  ['rupee', 'green', 'Payments and dues', 'Full and part payments by cash, UPI, card or bank, with a Pending Dues list and promised dates.', '/gym-dues-collection-software'],
  ['receipt', 'orange', 'Expenses', 'Every bill with its category, payment mode and photo, and spending month by month.', '/gym-expense-tracking-software'],
  ['chart', 'blue', 'Profit reports', 'Income, expenses and profit for each month and the year, with charts and a category split.', '/features'],
  ['box', 'purple', 'Supplement stock', 'Products, buying and selling prices, stock counts and low-stock warnings for your gym shop.', '/gym-stock-management-software'],
  ['chat', 'green', 'WhatsApp reminders', 'Automatic renewal reminders from your gym number on the Pro plan, and one-tap messages on every plan.', '/whatsapp-automation-for-gyms'],
  ['upload', 'orange', 'Excel and backup', 'Download members, payments, expenses and stock as CSV files, or a full backup, at any time.', '/features'],
]

// [the question, desktop software on one PC, GymSolution website]
const COMPARE = [
  ['Installation', 'Installed on one computer, often by a technician', 'Nothing to install: open the website and log in'],
  ['Where you can use it', 'Only at that computer', 'Any phone or laptop with a browser'],
  ['If the PC breaks', 'Data may be lost without a backup', 'Data stays in your account; log in from another device'],
  ['Updates', 'Installed by hand, sometimes paid', 'Always the latest version when you open it'],
  ['Checking from home', 'Not possible, or needs remote access tools', 'Same screens as at the gym'],
  ['Internet', 'Works offline', 'Needs an internet connection'],
]

// Real-world situations. [heading, text]
const USE_CASES = [
  ['The counter PC stops working', 'Your front desk computer will not start on a busy Monday. Open GymSolution on your phone and keep renewing members as usual.'],
  ['You are out of town for a wedding', 'Check renewals and today’s payments from your phone in the evening. On the Pro plan, reminders keep going out on WhatsApp while you are away.'],
  ['Month end with your accountant', 'Open the dashboard on the laptop for the month’s income, expenses and profit, then download the expenses to Excel.'],
  ['A supplier visit', 'Look at the stock page to see what is low before the supplier leaves, and add the purchase straight away.'],
]

// Benefits. [icon, colour, heading, text]
const BENEFITS = [
  ['bolt', 'orange', 'Save time every day', 'Dates, balances, lists and totals are worked out by the website, not by hand.'],
  ['receipt', 'blue', 'Less paperwork', 'No register, receipt book or expense diary to maintain, and nothing to add up at month end.'],
  ['calendar', 'green', 'Simpler daily operations', 'Start the day with the Renewals list, take payments at the counter, and the rest follows.'],
  ['trend', 'purple', 'Track gym performance', 'See whether this month beat last month, and where the money is going.'],
  ['home', 'blue', 'Manage from anywhere', 'Laptop at the counter, phone at home. The same website, the same records.'],
  ['shield', 'green', 'Your gym’s data kept apart', 'Each gym’s records are stored in a separate database of their own, and you can download a full backup any time.'],
]

const FAQS = [
  {
    q: 'What is a gym management website?',
    a: 'It is gym management software that you use through a website instead of installing it on a computer. You log in from a browser and manage your members, renewals, payments, expenses and reports online. GymSolution is a gym management website of this kind.',
  },
  {
    q: 'Will GymSolution make a public website for my gym?',
    a: 'No. GymSolution is a website for you to run your gym, not a website builder for your members to visit. It does not publish class timetables or take online sign-ups. If you need a public gym website, you can use any website builder alongside GymSolution.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. Open GymSolution in Chrome, Safari, Edge or any modern browser on your laptop or phone and log in. There is no software to install and nothing to update.',
  },
  {
    q: 'Can I use it on my laptop and my phone?',
    a: 'Yes. Log in on both with the same account. The laptop gets a sidebar and more room; the phone gets large buttons and a bottom bar. Both show the same records.',
    link: ['/gym-membership-management-app', 'See how it works on the phone.'],
  },
  {
    q: 'Does it work without internet?',
    a: 'No. As an online gym management system, GymSolution needs an internet connection to load and save your records. Ordinary mobile data is enough.',
  },
  {
    q: 'Is my gym’s data safe?',
    a: 'Each gym has its own account and its records are stored in a separate database of their own, so one gym can never see another’s data. You can download a full backup and Excel files from Settings whenever you want.',
  },
  {
    q: 'Does it send WhatsApp reminders?',
    a: `Yes. On the Pro plan (${rupees(PRO)} a year), renewal reminders go out automatically from your gym’s WhatsApp number on the renewal date and 2 days later. On every plan, ready-written messages are one tap away.`,
    link: ['/whatsapp-automation-for-gyms', 'More on WhatsApp automation.'],
  },
  {
    q: 'How much does the gym management website cost?',
    a: `From ${rupees(STARTER)} a year (about ₹${perMonth(STARTER)} a month), with members, renewals, payments, dues, expenses, profit reports and stock included. There is no installation fee.`,
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
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires a modern web browser such as Chrome, Safari or Edge',
    url: PAGE_URL,
    description:
      'Online gym management website for gym owners: members, memberships, renewals, payments, pending dues, expenses, profit reports, supplement stock and automatic WhatsApp reminders, in the browser on laptop or phone.',
    featureList: [
      'Member and membership management',
      'Renewal lists and automatic WhatsApp reminders',
      'Payments and pending dues',
      'Expense tracking and profit reports',
      'Supplement stock management',
      'CSV export and full backup',
    ],
    offers: OFFERS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gymsolution.in/' },
      { '@type': 'ListItem', position: 2, name: 'Gym Management Website', item: PAGE_URL },
    ],
  },
]

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

export default function ManagementWebsite() {
  return (
    <SiteLayout
      title="Gym Management Website – Run Your Gym Online | GymSolution"
      description={`GymSolution is an online gym management website: members, renewals, payments, dues, expenses, profit reports, supplement stock and WhatsApp reminders in one place, on laptop or phone. From ${rupees(STARTER)}/year.`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Online gym management</span>
          <h1>Gym Management Website for Gym Owners</h1>
          <p>
            GymSolution is a website you log in to and run your whole gym from: members, renewals, payments, dues, expenses, profit and supplement stock,
            with WhatsApp reminders built in. Open it on the counter laptop or your phone. Nothing to install.
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
          <span className="w-eyebrow dark">Good to know</span>
          <h2>A website to run your gym, not a website for your members</h2>
          <p>
            “Gym management website” can mean two things. GymSolution is the first: online gym management software for the owner. It is not a public
            website builder, and it does not publish class timetables or take online sign-ups from members.
          </p>
        </div>
        <div className="w-grid three">
          <div className="w-card plain">
            <span className="w-icon tone-green">
              <Icon name="check" />
            </span>
            <h3>What GymSolution is</h3>
            <p>A private, logged-in website where you and your gym’s records live: members, money, stock and reports.</p>
          </div>
          <div className="w-card plain">
            <span className="w-icon tone-blue">
              <Icon name="lock" />
            </span>
            <h3>Who uses it</h3>
            <p>The gym owner, with their own login. Members never see it; they only receive WhatsApp messages from your gym.</p>
          </div>
          <div className="w-card plain">
            <span className="w-icon tone-orange">
              <Icon name="alert" />
            </span>
            <h3>What it is not</h3>
            <p>A website builder, a class booking page or a member portal. Use any website builder for that, alongside GymSolution.</p>
          </div>
        </div>
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Everything in one place</span>
            <h2>What you can manage on the GymSolution website</h2>
            <p>One login for every part of the gym. Each card links to the full details.</p>
          </div>
          <div className="w-grid three">
            {MODULES.map(([icon, tone, title, text, to]) => (
              <Link key={title} to={to} className="w-card plain">
                <span className={`w-icon tone-${tone}`}>
                  <Icon name={icon} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-blue">
              <Icon name="chart" />
            </span>
            <h2>Track your gym’s performance online</h2>
            <p>
              Open the dashboard on a laptop and the month is laid out in front of you: what came in, what went out, and what the gym actually earned.
            </p>
            <Points
              items={[
                'Membership fees and shop sales for the month or year',
                'Expenses by category, including stock bought',
                'Profit or loss for every month',
                'Active members and pending dues at the top',
              ]}
            />
          </div>
          <div className="w-feature-visual">
            <DashboardMock />
          </div>
        </section>

        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-purple">
              <Icon name="calendar" />
            </span>
            <h2>Renewals and reminders, handled online</h2>
            <p>
              The website sorts members by renewal date every day. On the Pro plan, it also sends the WhatsApp reminders from your gym number, so renewals
              are followed up even on your busiest days.
            </p>
            <Points items={['Overdue, due today and next 7 days', 'Renew in a few clicks with the next date set for you', 'Automatic reminders on the renewal date and 2 days later']} />
          </div>
          <div className="w-feature-visual">
            <RenewalsMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Website or desktop software</span>
            <h2>Online gym management vs software installed on one PC</h2>
            <p>Many gyms still run desktop software on the counter computer. Here is an honest comparison, including the one thing desktop does better.</p>
          </div>
          <div className="w-table-wrap">
            <table className="w-compare">
              <thead>
                <tr>
                  <th scope="col">Question</th>
                  <th scope="col">Desktop software</th>
                  <th scope="col">GymSolution website</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([q, desktop, web]) => (
                  <tr key={q}>
                    <th scope="row">{q}</th>
                    <td>{desktop}</td>
                    <td>
                      <Icon name="check" />
                      {web}
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
          <span className="w-eyebrow dark">Real situations</span>
          <h2>When an online gym management system pays off</h2>
          <p>Moments every gym owner has had, and how the website helps.</p>
        </div>
        <ol className="w-steps">
          {USE_CASES.map(([title, text], i) => (
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
              <span className="w-icon tone-orange">
                <Icon name="receipt" />
              </span>
              <h2>Expenses and stock in the same website</h2>
              <p>
                Running a gym is more than memberships. Bills, salaries, repairs and the supplement shop are tracked in the same place, so your profit report
                is complete.
              </p>
              <Points items={['Expenses with bill photos and categories', 'Stock counts that update with every sale and purchase', 'Low-stock warnings before you run out']} />
            </div>
            <div className="w-feature-visual">
              <ExpensesMock />
            </div>
          </div>
          <div className="w-feature">
            <div className="w-feature-text">
              <span className="w-icon tone-purple">
                <Icon name="box" />
              </span>
              <h2>A gym shop that runs itself</h2>
              <p>Sell protein, creatine and shakers from the same login. Every sale counts as income and every purchase as an expense.</p>
              <Link to="/gym-stock-management-software" className="w-more">
                More on stock management <Icon name="arrow" />
              </Link>
            </div>
            <div className="w-feature-visual">
              <InventoryMock />
            </div>
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Why owners switch</span>
          <h2>Benefits of managing your gym through a website</h2>
          <p>Less time on records, and a clearer view of the business.</p>
        </div>
        <Cards items={BENEFITS} />
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-price">
            <div className="w-price-card">
              <span>Gym management website from</span>
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
              <span className="w-eyebrow dark">Start today</span>
              <h2>Your gym online in one evening</h2>
              <p>Add your plans, add your members and what they have paid, and the website takes it from there. No technician, no installation, no hardware.</p>
              <ul className="w-ticks">
                <li>
                  <Icon name="check" />
                  No installation fee
                </li>
                <li>
                  <Icon name="check" />
                  Laptop and phone
                </li>
                <li>
                  <Icon name="check" />
                  Full backup any time
                </li>
                <li>
                  <Icon name="check" />
                  Free trial
                </li>
              </ul>
            </div>
          </div>
          <p className="w-after">
            See <Link to="/gym-membership-management-system">how the gym membership management system works</Link>,{' '}
            <Link to="/features">all features</Link>, or why it is <Link to="/affordable-gym-management-software">affordable gym management software</Link>.
          </p>
        </div>
      </section>

      <Faq title="Gym management website: common questions" items={FAQS}>
        <p className="w-after">
          <Link to="/gym-management-app-free">Start with a free trial</Link> or <Link to="/gym-management-software-pricing">see GymSolution pricing</Link>.
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
