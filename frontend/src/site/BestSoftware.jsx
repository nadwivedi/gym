import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { DashboardMock, RenewalsMock } from './mocks.jsx'
import { MULTI_GYM, OFFERS, PRO, STARTER, perMonth, rupees } from './pricing.js'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const PAGE_URL = 'https://gymsolution.in/best-software-for-gym-management'
const TRIAL_URL = whatsappLink('Hi, I want to try GymSolution for my gym.')

// What to ask before choosing gym software. [icon, colour, heading, text]
const QUESTIONS = [
  ['users', 'blue', 'What kind of gym do you run?', 'A neighbourhood gym with monthly and quarterly plans needs different software from a class studio that books every session.'],
  ['rupee', 'green', 'Where do you lose money today?', 'Missed renewals, forgotten dues and untracked expenses cost most gyms more than any missing feature.'],
  ['phone', 'purple', 'Who will use it, and on what?', 'If you run the gym from your phone, the software has to work properly on a phone, not just on the counter PC.'],
  ['receipt', 'orange', 'What does it really cost?', 'Look past the monthly price: setup fees, hardware, per-message charges and add-ons change the total.'],
]

// The checklist, answered honestly for GymSolution. [feature, has it, note]
const CHECKLIST = [
  ['Member records and membership plans', true, 'Members, your own plans and prices, admission fee'],
  ['Renewal tracking: overdue, due today, next 7 days', true, 'Lists update every day'],
  ['Payment tracking with part payments and dues', true, 'Cash, UPI, card and bank; promised dates'],
  ['Automatic WhatsApp renewal reminders', true, `From your gym number, Pro plan (${rupees(PRO)}/year)`],
  ['Expense tracking with bill photos', true, 'Your own categories, paid and pending bills'],
  ['Income, expense and profit reports', true, 'Month by month and for the year'],
  ['Supplement stock and shop sales', true, 'Stock counts and low-stock warnings'],
  ['Works on phone and laptop browser', true, 'No installation; no Play Store app'],
  ['Excel export and full backup', true, 'Members, payments, expenses, stock'],
  ['Attendance or biometric check-in', false, 'Not available'],
  ['Class or session booking', false, 'Not available'],
  ['Member app or member login', false, 'Members only receive WhatsApp messages'],
  ['Separate staff logins with permissions', false, 'Not available'],
  ['GST invoices and online payment collection', false, 'Payments are recorded, not collected online'],
]

// Who GymSolution suits, and who it does not.
const GOOD_FIT = [
  'Independent gyms and fitness centres with monthly to yearly plans',
  'Owners who want renewals, dues and profit under control',
  'Gyms that remind members on WhatsApp today, by hand',
  'Owners who manage from their phone as much as from the counter',
  'Gyms that want low, predictable yearly pricing',
]
const NOT_FIT = [
  'Studios that need class timetables and online booking',
  'Gyms that need biometric or turnstile entry',
  'Clubs that want members to log in to their own app',
  'Large teams that need separate staff logins and permissions',
]

// Practical use cases. [heading, text]
const USE_CASES = [
  ['Renewals slipping through', 'A 150-member gym loses a few members every month simply because nobody reminded them. The Renewals list and automatic WhatsApp reminders close that gap.'],
  ['“Pay the rest later”', 'Part payments written on slips get forgotten. GymSolution keeps every balance with the member and lists the total to collect.'],
  ['Profit is a guess', 'Fees are counted, but rent, electricity and stock purchases are not. The dashboard puts them together into a monthly profit.'],
  ['The owner is never at the counter', 'Training clients, a second job, family. The whole gym is on the owner’s phone, in the browser.'],
]

// What the owner gets. [icon, colour, heading, text]
const BENEFITS = [
  ['bolt', 'orange', 'Saves time', 'Renewal dates, balances and monthly totals are worked out for you.'],
  ['receipt', 'blue', 'Less paperwork', 'No register, receipt book or expense diary to maintain.'],
  ['bell', 'green', 'Better renewal follow-ups', 'Daily lists, one-tap messages and automatic reminders on the Pro plan.'],
  ['chart', 'purple', 'Clear gym finances', 'Income, expenses and profit for every month, with stock included.'],
  ['home', 'blue', 'Daily operations from anywhere', 'Laptop at the counter, phone at home, the same records on both.'],
  ['shield', 'green', 'Your data stays yours', 'Each gym’s data is kept separate, and you can download a full backup any time.'],
]

const FAQS = [
  {
    q: 'What is the best software for gym management?',
    a: 'There is no single best software for every gym. The best gym management software is the one that fixes your biggest problems at a price that makes sense. For an independent gym, that is usually renewals, dues and knowing the monthly profit. For a class studio, it may be booking and scheduling.',
  },
  {
    q: 'Is GymSolution the best gym management software for my gym?',
    a: 'It is a strong fit if you run an independent gym with membership plans and want renewals, dues, expenses, profit and supplement stock in one place, with WhatsApp reminders. It is not the right choice if you need class booking, biometric attendance, a member app or staff logins.',
  },
  {
    q: 'What features should good gym management software have?',
    a: 'At minimum: member records, membership plans, renewal tracking, payment and dues tracking, and reports. Most owners also benefit from expense tracking, reminders to members and access from a phone. Check the checklist on this page against your own needs.',
  },
  {
    q: 'What is the most affordable gym software?',
    a: `Prices vary a lot, so compare the full yearly cost including setup, hardware and message charges. GymSolution costs ${rupees(STARTER)} a year for Starter, ${rupees(PRO)} for Pro with automatic WhatsApp reminders and ${rupees(MULTI_GYM)} for Multi-Gym, with no setup fee and no charge per message.`,
    link: ['/affordable-gym-management-software', 'Why GymSolution is affordable gym software.'],
  },
  {
    q: 'Does GymSolution have a mobile app?',
    a: 'It works in the browser on any phone, tablet or laptop, so there is nothing to install. There is no Play Store or App Store app, but you can add it to your home screen to open it in one tap.',
    link: ['/gym-management-app', 'More on the gym management app.'],
  },
  {
    q: 'Can I try GymSolution before paying?',
    a: 'Yes. Start a free trial, add your plans and a few members, and see whether it fits the way you run your gym.',
    link: ['/gym-management-app-free', 'Start the free trial.'],
  },
  {
    q: 'Can I take my data out if I switch software later?',
    a: 'Yes. Download your members, payments, expenses and stock as Excel-ready CSV files, or a full backup file, whenever you like.',
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
      'Gym management software for independent gyms: member records, membership renewals, payment and dues tracking, expenses, profit reports, supplement stock and automatic WhatsApp renewal reminders, in the browser on phone or laptop.',
    featureList: CHECKLIST.filter(([, has]) => has).map(([feature]) => feature),
    offers: OFFERS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gymsolution.in/' },
      { '@type': 'ListItem', position: 2, name: 'Best Software for Gym Management', item: PAGE_URL },
    ],
  },
]

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

function Points({ items, no = false }) {
  return (
    <ul className="w-points">
      {items.map((point) => (
        <li key={point}>
          <Icon name={no ? 'close' : 'check'} />
          {point}
        </li>
      ))}
    </ul>
  )
}

export default function BestSoftware() {
  return (
    <SiteLayout
      title="Best Software for Gym Management: How to Choose (2026 Guide) | GymSolution"
      description="How to choose the best software for gym management: the questions to ask, a feature checklist, and an honest look at what GymSolution does and does not do for independent gyms."
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">A buyer’s guide for gym owners</span>
          <h1>Best Software for Gym Management: How to Choose the Right One</h1>
          <p>
            “Best” depends on your gym. This guide helps you work out what you actually need, gives you a checklist to compare any gym management system,
            and shows honestly where GymSolution fits and where it does not.
          </p>
          <div className="w-hero-actions center">
            <a href={TRIAL_URL} className="w-btn primary" target="_blank" rel="noreferrer">
              Try GymSolution free
              <Icon name="arrow" />
            </a>
            <a href="#checklist" className="w-btn ghost">
              Jump to the checklist
            </a>
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Start here</span>
          <h2>Four questions to answer before choosing gym software</h2>
          <p>Most “best gym management software” lists rank big platforms. The right answer for your gym starts with these questions.</p>
        </div>
        <Cards items={QUESTIONS} columns="" />
      </section>

      <section id="checklist" className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Feature checklist</span>
            <h2>Gym management software checklist, answered for GymSolution</h2>
            <p>
              Use this list to compare any gym management system. We have filled it in for GymSolution, including the features it does not have, so you can
              decide quickly.
            </p>
          </div>
          <div className="w-table-wrap">
            <table className="w-compare">
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  <th scope="col">GymSolution</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {CHECKLIST.map(([feature, has, note]) => (
                  <tr key={feature}>
                    <th scope="row">{feature}</th>
                    <td className={has ? '' : 'no'}>
                      <Icon name={has ? 'check' : 'close'} />
                      {has ? 'Yes' : 'No'}
                    </td>
                    <td>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">An honest fit</span>
          <h2>Who GymSolution is best for, and who it is not</h2>
          <p>No software is right for everyone. Here is where GymSolution works well and where you should look elsewhere.</p>
        </div>
        <div className="w-grid">
          <div className="w-card plain">
            <span className="w-icon tone-green">
              <Icon name="check" />
            </span>
            <h3>A good fit if you are</h3>
            <Points items={GOOD_FIT} />
          </div>
          <div className="w-card plain">
            <span className="w-icon tone-orange">
              <Icon name="alert" />
            </span>
            <h3>Probably not for</h3>
            <Points items={NOT_FIT} no />
          </div>
        </div>
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-feature">
            <div className="w-feature-text">
              <span className="w-icon tone-purple">
                <Icon name="calendar" />
              </span>
              <h2>Where GymSolution is strongest: renewals and follow-ups</h2>
              <p>
                For a membership gym, renewals are the income. GymSolution is built around them: every member’s renewal date, daily lists of who is due and
                who has lapsed, and reminders that go out on WhatsApp.
              </p>
              <Points
                items={[
                  'Overdue, due today and next 7 days, updated daily',
                  'Automatic WhatsApp reminder on the renewal date and 2 days later (Pro)',
                  'One-tap messages for upcoming renewals and pending dues',
                  'Part payments with promised dates and a dues total',
                ]}
              />
              <Link to="/gym-membership-renewal-software" className="w-more">
                More on renewal tracking <Icon name="arrow" />
              </Link>
            </div>
            <div className="w-feature-visual">
              <RenewalsMock />
            </div>
          </div>
          <div className="w-feature">
            <div className="w-feature-text">
              <span className="w-icon tone-blue">
                <Icon name="chart" />
              </span>
              <h2>Gym business management, not just member lists</h2>
              <p>
                Good gym business management software should tell you whether the gym is making money. GymSolution adds expenses and supplement stock to
                your membership income, and shows the profit for every month.
              </p>
              <Points items={['Expenses with categories and bill photos', 'Shop sales and stock purchases counted', 'Profit or loss by month and year']} />
              <p className="w-after">
                See <Link to="/gym-expense-tracking-software">expense tracking</Link> and <Link to="/gym-stock-management-software">stock management</Link>.
              </p>
            </div>
            <div className="w-feature-visual">
              <DashboardMock />
            </div>
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Practical use cases</span>
          <h2>Problems the right gym software should solve</h2>
          <p>Common situations at independent gyms, and how GymSolution handles them.</p>
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
          <div className="w-section-head">
            <span className="w-eyebrow dark">Benefits</span>
            <h2>What gym owners gain from GymSolution</h2>
            <p>The day-to-day difference once your gym runs on software instead of a register.</p>
          </div>
          <Cards items={BENEFITS} />
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-price">
          <div className="w-price-card">
            <span>Affordable gym software from</span>
            <p className="w-price-amount">
              {rupees(STARTER)}
              <small>/ year</small>
            </p>
            <p>
              About ₹{perMonth(STARTER)} a month. Pro with automatic WhatsApp reminders: {rupees(PRO)} a year. No setup fee, no charge per message.
            </p>
            <Link to="/gym-management-software-pricing" className="w-btn light">
              Compare plans
              <Icon name="arrow" />
            </Link>
          </div>
          <div className="w-price-text">
            <span className="w-eyebrow dark">Decide for yourself</span>
            <h2>The best test is your own gym</h2>
            <p>
              Lists and checklists only go so far. Start a free trial, add your plans and a handful of members, and see whether GymSolution makes your
              renewals, dues and accounts easier.
            </p>
            <ul className="w-ticks">
              <li>
                <Icon name="check" />
                Free trial
              </li>
              <li>
                <Icon name="check" />
                Nothing to install
              </li>
              <li>
                <Icon name="check" />
                Phone and laptop
              </li>
              <li>
                <Icon name="check" />
                Export your data any time
              </li>
            </ul>
          </div>
        </div>
        <p className="w-after">
          Read more about <Link to="/gym-membership-management-software">gym membership management software</Link>, the{' '}
          <Link to="/gym-management-website">online gym management system</Link> and <Link to="/features">all features</Link>.
        </p>
      </section>

      <Faq title="Best software for gym management: common questions" items={FAQS} band>
        <p className="w-after">
          <Link to="/gym-management-app-free">Start with a free trial</Link> or <Link to="/gym-management-software-pricing">see GymSolution pricing</Link>.
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
