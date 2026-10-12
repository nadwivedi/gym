import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { DuesMock, MembersMock, ReminderChatMock } from './mocks.jsx'
import { OFFERS, PRO, STARTER, perMonth, rupees } from './pricing.js'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const PAGE_URL = 'https://gymsolution.in/gym-membership-management-software'
const TRIAL_URL = whatsappLink('Hi, I want to try the GymSolution gym membership management software for my gym.')

// What each member record holds, as the app's member forms save it.
const RECORD_POINTS = [
  'Name, mobile number and gender, with an automatic member number',
  'Address, date of birth or age, and your own notes',
  'First joining date, current plan, start date and expiry date',
  'Every membership, payment and change, in one history',
  'A warning when you add a mobile number another member already has',
]

// The member list filters, as the app shows them.
const FILTERS = [
  ['users', 'blue', 'Active', 'Members with a running membership. The count on the filter tells you how many you have today.'],
  ['calendar', 'orange', 'Expiring soon', 'Active members whose membership ends in the next 7 days, so you can talk to them before it lapses.'],
  ['alert', 'purple', 'Expired', 'Memberships that have ended and were not renewed. Each one shows how many days overdue it is.'],
  ['rupee', 'green', 'Due pending', 'Members who still owe part of their fee, with the balance on every row.'],
  ['bell', 'blue', 'Not started', 'Members who renewed or joined in advance, whose new membership starts on a later date.'],
  ['eye', 'purple', 'Hidden', 'Members who stopped coming, kept out of the way with the reason you gave, and ready to rejoin.'],
]

// A membership from joining to rejoining. [heading, text]
const LIFECYCLE = [
  ['Join', 'Add the member, pick a plan and take the admission fee and first payment. The expiry date is worked out from the plan.'],
  ['Track', 'The member moves from Active to Expiring soon to Expired by themselves as the dates pass. No status to update by hand.'],
  ['Renew', 'Renew on the same plan or a different one. The new membership carries on from the old expiry date, so no days are lost.'],
  ['Hide or rejoin', 'Hide a member who has left. If they come back months later, rejoin them with their full history intact.'],
]

// Membership plans, as set under Plans and prices.
const PLAN_POINTS = [
  'Create plans with your own name, length in months and price',
  'Monthly, quarterly, half-yearly, yearly or any length you sell',
  'A default admission fee for new members',
  'Change the fee for one member when you give a discount',
  'Stop offering a plan without touching members already on it',
]

// What changes for the owner. [icon, colour, heading, text]
const BENEFITS = [
  ['calendar', 'blue', 'Fewer missed renewals', 'Every expiry date is tracked and listed, so no membership quietly ends without anyone noticing.'],
  ['receipt', 'orange', 'No more registers', 'Member details, plans, dates and payments are in one place instead of across register pages and slips.'],
  ['bolt', 'green', 'Hours saved every week', 'No dates to count, no balances to add up and no lists to rewrite. The software keeps it current.'],
  ['search', 'purple', 'Find anyone in seconds', 'Search by name, mobile number or member number, from your phone or the counter computer.'],
  ['shield', 'blue', 'A record you can trust', 'Changes to memberships and payments are logged, so you can always see what was changed and when.'],
  ['upload', 'green', 'Your data in Excel', 'Download your member list with plan, expiry date, status and balance whenever you need it.'],
]

// Practical examples. [heading, text]
const EXAMPLES = [
  ['A member says “I paid for three months”', 'Open their profile. Every membership is listed with its plan, dates, fee and the payments made against it.'],
  ['You want to call everyone expiring this week', 'Tap the Expiring soon filter. Each row has a call and a WhatsApp button.'],
  ['A member returns after six months', 'Search their name, tap Rejoin, pick a plan. Their old history stays with them.'],
  ['Your accountant asks for the member list', 'Download it to Excel with the plan, expiry date, status and balance of every member.'],
]

const FAQS = [
  {
    q: 'What is gym membership management software?',
    a: 'It is software that keeps your gym’s member records, membership plans, joining and expiry dates, renewals and payments in one place. GymSolution also sorts members by status, tracks pending dues and can send renewal reminders on WhatsApp.',
  },
  {
    q: 'What details can I keep for each member?',
    a: 'Name, mobile number, gender, address, date of birth or age, notes and the first joining date. Each member also gets an automatic member number, and their full membership and payment history.',
  },
  {
    q: 'How does GymSolution know when a membership expires?',
    a: 'When you add or renew a member, the expiry date is worked out from the plan’s length and the start date. You can still change it for a member if you need to. The member’s status then updates by itself as the dates pass.',
  },
  {
    q: 'Can I create my own membership plans?',
    a: 'Yes. Under Plans and prices you create plans with your own name, length in months and price, and set a default admission fee. You can change the fee for an individual member, and stop offering a plan at any time.',
  },
  {
    q: 'How do I see expired and expiring members?',
    a: 'The member list has filters for Active, Expiring soon, Expired, Due pending, Not started and Hidden, each with a count. The Renewals screen also lists who is overdue, due today and due in the next 7 days.',
    link: ['/gym-membership-renewal-software', 'More on renewal tracking.'],
  },
  {
    q: 'Does it send renewal reminders automatically?',
    a: `Yes, on the Pro plan at ${rupees(PRO)} a year. A WhatsApp message goes from your gym number on the expiry date, and once more two days later if the member has not renewed. Members who renewed or were hidden are skipped.`,
    link: ['/whatsapp-automation-for-gyms', 'How the WhatsApp reminders work.'],
  },
  {
    q: 'Can I track part payments and pending dues?',
    a: 'Yes. Record each payment against the membership it is for, by cash, UPI, card or bank. The balance is worked out for you, and you can note the date the member promised to pay the rest.',
    link: ['/gym-dues-collection-software', 'More on dues collection.'],
  },
  {
    q: 'What happens to members who stop coming?',
    a: 'Hide them with a reason, such as “moved to another city”. They leave your renewal lists but keep their history. If they come back, rejoin them in one tap.',
  },
  {
    q: 'How much does the gym membership management software cost?',
    a: `Membership management is in every plan, starting at ${rupees(STARTER)} a year (about ₹${perMonth(STARTER)} a month). The Pro plan with automatic WhatsApp reminders is ${rupees(PRO)} a year.`,
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
      'Gym membership management software: member records, membership plans, joining and expiry dates, renewals, expired memberships, pending dues, payment history and automatic WhatsApp renewal reminders.',
    featureList: [
      'Member records with automatic member numbers',
      'Custom membership plans and admission fee',
      'Automatic expiry dates and member status',
      'Active, expiring soon, expired, due pending and hidden filters',
      'Payment history and pending dues',
      'Automatic WhatsApp renewal reminders',
      'Export members to Excel',
    ],
    offers: OFFERS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gymsolution.in/' },
      { '@type': 'ListItem', position: 2, name: 'Gym Membership Management Software', item: PAGE_URL },
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

function Steps({ items }) {
  return (
    <ol className="w-steps">
      {items.map(([title, text], i) => (
        <li key={title}>
          <span className="w-step-num">{i + 1}</span>
          <h3>{title}</h3>
          <p>{text}</p>
        </li>
      ))}
    </ol>
  )
}

export default function MembershipManagement() {
  return (
    <SiteLayout
      title="Gym Membership Management Software – Members, Plans & Renewals | GymSolution"
      description={`GymSolution gym membership management software keeps member records, plans, joining and expiry dates, renewals, dues and payment history in one place, with automatic WhatsApp reminders. From ${rupees(STARTER)}/year.`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Every member, organised</span>
          <h1>Gym Membership Management Software</h1>
          <p>
            GymSolution keeps every member’s details, plan, joining date, expiry date, payments and dues in one place, and tells you who is active, who is
            expiring and who has lapsed. Replace the register with software that keeps itself up to date.
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
            <span className="w-icon tone-blue">
              <Icon name="users" />
            </span>
            <h2>A complete record for every gym member</h2>
            <p>
              Each member gets a profile that holds everything you would otherwise search a register for. Open it from your phone or the counter computer and
              the whole story is there.
            </p>
            <Points items={RECORD_POINTS} />
          </div>
          <div className="w-feature-visual">
            <MembersMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Membership tracking</span>
            <h2>Know the status of every membership at a glance</h2>
            <p>
              GymSolution works out each member’s status from their dates, every day. One tap on a filter shows exactly the members you are looking for.
            </p>
          </div>
          <Cards items={FILTERS} />
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">From joining to rejoining</span>
          <h2>How GymSolution manages a membership from start to finish</h2>
          <p>The full membership lifecycle, with the dates and statuses handled for you.</p>
        </div>
        <Steps items={LIFECYCLE} />
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-feature">
            <div className="w-feature-text">
              <span className="w-icon tone-purple">
                <Icon name="settings" />
              </span>
              <h2>Membership plans set up your way</h2>
              <p>
                Every gym prices differently. Set up the plans you actually sell, and GymSolution uses them to fill in fees and expiry dates whenever you
                add or renew a member.
              </p>
              <Points items={PLAN_POINTS} />
            </div>
            <div className="w-feature-visual">
              <div className="w-card plain">
                <span className="w-icon tone-blue">
                  <Icon name="calendar" />
                </span>
                <h3>Example plans</h3>
                <ul className="w-points">
                  <li>
                    <Icon name="check" />
                    Monthly · 1 month · ₹1,200
                  </li>
                  <li>
                    <Icon name="check" />
                    Quarterly · 3 months · ₹3,300
                  </li>
                  <li>
                    <Icon name="check" />
                    Half-yearly · 6 months · ₹6,000
                  </li>
                  <li>
                    <Icon name="check" />
                    Yearly · 12 months · ₹10,000
                  </li>
                  <li>
                    <Icon name="check" />
                    Admission fee · ₹500
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-orange">
              <Icon name="rupee" />
            </span>
            <h2>Payment history and pending dues for every membership</h2>
            <p>
              Each payment is saved against the membership it pays for, so you always know what a member has paid and what is still due, even across
              several renewals.
            </p>
            <Points
              items={[
                'Full payments and part payments, by cash, UPI, card or bank',
                'Balance worked out from plan fee, admission fee and payments',
                'The date a member promised to pay the rest',
                'A Pending Dues list with the total to collect',
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
              <h2>Automatic WhatsApp renewal reminders</h2>
              <p>
                On the Pro plan, members are reminded on WhatsApp when their membership expires, from your own gym number. Fewer renewals slip through, and
                nobody has to make the calls.
              </p>
              <Points
                items={[
                  'Sent on the expiry date, and 2 days later if not renewed',
                  'Skips members who renewed or are hidden',
                  'One-tap messages for upcoming renewals and dues',
                ]}
              />
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
          <span className="w-eyebrow dark">Why it helps</span>
          <h2>Benefits of a gym member management system</h2>
          <p>Less paperwork, fewer missed renewals and members who feel looked after.</p>
        </div>
        <Cards items={BENEFITS} />
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">In practice</span>
            <h2>Everyday membership questions, answered in seconds</h2>
            <p>Situations every gym owner knows, and how GymSolution handles them.</p>
          </div>
          <Steps items={EXAMPLES} />
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-price">
          <div className="w-price-card">
            <span>Membership management from</span>
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
            <span className="w-eyebrow dark">Complete gym management software</span>
            <h2>Membership management, and the rest of your gym too</h2>
            <p>
              Members are the heart of the gym, but not the whole of it. The same GymSolution account tracks your expenses, monthly profit and supplement
              stock.
            </p>
            <ul className="w-ticks">
              <li>
                <Icon name="check" />
                Members and plans
              </li>
              <li>
                <Icon name="check" />
                Renewals and dues
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
          See <Link to="/gym-membership-management-system">how the membership system works</Link>, <Link to="/features">all features</Link>,{' '}
          <Link to="/gym-expense-tracking-software">expense tracking</Link> and{' '}
          <Link to="/gym-stock-management-software">stock management</Link>.
        </p>
      </section>

      <Faq title="Gym membership management software: common questions" items={FAQS} band>
        <p className="w-after">
          <Link to="/gym-management-app-free">Start with a free trial</Link> or <Link to="/gym-management-software-pricing">see GymSolution pricing</Link>.
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
