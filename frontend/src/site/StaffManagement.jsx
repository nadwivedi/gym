import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { ExpensesMock, RenewalsMock } from './mocks.jsx'
import { OFFERS, PRO, STARTER, perMonth, rupees } from './pricing.js'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const PAGE_URL = 'https://gymsolution.in/gym-staff-management-software'
const TRIAL_URL = whatsappLink('Hi, I want to know more about GymSolution for my gym and its staff.')

// Where each staff feature stands today. [feature, status, note]; status: 'yes' | 'soon' | 'no'
const STATUS = [
  ['Staff salaries recorded as expenses', 'yes', 'Add a Salaries category; note who was paid and how'],
  ['Change history on payments and memberships', 'yes', 'Edits, moves and cancellations are logged'],
  ['Routine front-desk work automated', 'yes', 'Renewal dates, balances, lists and WhatsApp reminders'],
  ['Separate staff logins', 'soon', 'Today each gym has one owner login'],
  ['Role-based permissions and access control', 'soon', 'For example, hide profit and expenses from staff'],
  ['“Added by” activity tracking', 'soon', 'See which staff member made each entry'],
  ['Trainer assignment and sessions', 'no', 'Not available'],
  ['Shift scheduling, attendance and payroll', 'no', 'Not available'],
]
const STATUS_LABEL = { yes: 'Available', soon: 'Coming soon', no: 'Not available' }

// What already takes work off the staff. [icon, colour, heading, text]
const AVAILABLE = [
  ['calendar', 'purple', 'No more renewal registers', 'Renewal dates are set from the plan and members are sorted into overdue, due today and next 7 days. Nobody has to turn pages.'],
  ['chat', 'green', 'No calling members one by one', 'On the Pro plan, WhatsApp renewal reminders go out by themselves. Front-desk staff can spend that time with members.'],
  ['rupee', 'blue', 'Balances worked out for you', 'Part payments and pending dues are calculated, so nobody at the counter has to do sums or keep slips.'],
  ['box', 'orange', 'Stock that counts itself', 'Every sale and purchase updates the stock count. Low-stock warnings show what to reorder.'],
  ['receipt', 'purple', 'Expenses with proof', 'Each expense keeps its category, payment mode and a photo of the bill.'],
  ['shield', 'blue', 'Changes are logged', 'When a payment is edited, moved or cancelled, or membership dates are changed, the change is recorded.'],
]

// Coming soon. [icon, colour, heading, text]
const COMING = [
  ['user', 'blue', 'Staff logins', 'Give each front-desk or reception staff member their own login, instead of sharing the owner’s.'],
  ['lock', 'purple', 'Role-based permissions', 'Choose what each staff member can see and do. For example, let them renew members and take payments, but keep profit and expenses private.'],
  ['eye', 'green', '“Added by” tracking', 'See which staff member added each member, payment or expense, so every entry has a name against it.'],
]

// Practical use cases, with what works today. [heading, text]
const USE_CASES = [
  ['The front desk is always busy', 'Instead of calling every member whose plan ended, reminders go out on WhatsApp automatically (Pro plan). The desk handles the members who walk in.'],
  ['Paying salaries at month end', 'Record each salary as an expense under your Salaries category, with the staff member’s name in “Paid to”. It counts in the month’s profit.'],
  ['A payment was entered wrongly', 'Correct it. The change is logged, so you can see what the payment was before and what it is now.'],
  ['Checking up from home', 'Open GymSolution on your phone and see the day’s renewals, pending dues and this month’s numbers, without calling the gym.'],
]

const FAQS = [
  {
    q: 'What is gym staff management software?',
    a: 'It is software that helps gym owners organise their employees: who can log in, what each person can see and change, which trainer looks after which member, shifts, attendance and salaries. Different products cover different parts of this.',
  },
  {
    q: 'Can my staff have their own GymSolution login?',
    a: 'Not yet. Separate staff logins are coming soon. Today each gym has one login for the owner, and anyone using it can see everything, including profit and expenses.',
  },
  {
    q: 'Can I control what my staff can see?',
    a: 'Role-based permissions are coming soon, together with staff logins. The plan is to let you allow tasks like renewals and payments while keeping profit and expense reports private.',
  },
  {
    q: 'Can I see which staff member made an entry?',
    a: '“Added by” tracking is coming soon. Today, changes to payments and memberships are logged with what changed and when, but not by whom.',
  },
  {
    q: 'Does GymSolution manage trainers?',
    a: 'Not at the moment. GymSolution does not assign members to trainers or track personal training sessions, shifts or attendance.',
  },
  {
    q: 'How can I track staff salaries in GymSolution?',
    a: 'Add an expense category such as “Salaries”, then record each payment with the staff member’s name in “Paid to”, the amount and the payment mode. Salaries are counted in your monthly expenses and profit.',
    link: ['/gym-expense-tracking-software', 'More on expense tracking.'],
  },
  {
    q: 'How does GymSolution help my gym operations today?',
    a: 'It takes the routine work off you and your staff: renewal dates and lists, balances, automatic WhatsApp reminders on the Pro plan, stock counts, expenses and monthly profit, all in one place.',
    link: ['/gym-management-app', 'See the gym management app.'],
  },
  {
    q: 'How much does GymSolution cost?',
    a: `From ${rupees(STARTER)} a year (about ₹${perMonth(STARTER)} a month). The Pro plan with automatic WhatsApp reminders is ${rupees(PRO)} a year.`,
    link: ['/gym-management-software-pricing', 'Compare all plans.'],
  },
]

// What search engines read about the page: only what works today. The questions are added by Faq.
const STRUCTURED = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'GymSolution',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Android, iOS, Windows',
    url: PAGE_URL,
    description:
      'Gym business management software that automates routine gym operations: renewal tracking, payments and dues, automatic WhatsApp reminders, stock, expenses including staff salaries, and profit reports.',
    featureList: [
      'Renewal tracking and automatic WhatsApp reminders',
      'Payments, part payments and pending dues',
      'Expense tracking, including staff salaries',
      'Change history on payments and memberships',
      'Supplement stock with low-stock warnings',
    ],
    offers: OFFERS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gymsolution.in/' },
      { '@type': 'ListItem', position: 2, name: 'Gym Staff Management Software', item: PAGE_URL },
    ],
  },
]

function Cards({ items, soon = false }) {
  return (
    <div className="w-grid three">
      {items.map(([icon, tone, title, text]) => (
        <div key={title} className="w-card plain">
          <span className={`w-icon tone-${tone}`}>
            <Icon name={icon} />
          </span>
          {soon && <span className="w-soon">Coming soon</span>}
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      ))}
    </div>
  )
}

export default function StaffManagement() {
  return (
    <SiteLayout
      title="Gym Staff Management Software – What’s Available & Coming Soon | GymSolution"
      description="Gym staff management software from GymSolution: automate routine front-desk work, record staff salaries and keep a change history today. Staff logins, permissions and “Added by” tracking are coming soon."
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Staff and gym operations</span>
          <h1>Gym Staff Management Software</h1>
          <p>
            A well-run gym needs less routine work for its staff, clear records and control over who sees what. GymSolution already automates the routine
            work. Staff logins, permissions and activity tracking are coming soon, and this page shows exactly what is ready today.
          </p>
          <div className="w-hero-actions center">
            <a href={TRIAL_URL} className="w-btn primary" target="_blank" rel="noreferrer">
              Talk to us
              <Icon name="arrow" />
            </a>
            <a href="#status" className="w-btn ghost">
              What’s available
            </a>
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">What to look for</span>
          <h2>What gym staff management software should do</h2>
          <p>
            Most gym employee management software covers some of these. Knowing which ones you need makes choosing much easier, whichever software you pick.
          </p>
        </div>
        <div className="w-grid three">
          {[
            ['lock', 'blue', 'Control access', 'Separate logins and permissions, so staff do their job without seeing the gym’s finances.'],
            ['receipt', 'purple', 'Track activity', 'A record of who added or changed each member, payment and expense.'],
            ['bolt', 'green', 'Reduce routine work', 'Automate reminders, dates and calculations so staff spend time with members, not registers.'],
            ['dumbbell', 'orange', 'Organise trainers', 'Which trainer looks after which member, and how many sessions they take.'],
            ['calendar', 'blue', 'Plan shifts', 'Who is on the floor and at the desk, and when.'],
            ['rupee', 'purple', 'Pay staff', 'Salaries and incentives, recorded with the rest of the gym’s expenses.'],
          ].map(([icon, tone, title, text]) => (
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

      <section id="status" className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Honest status</span>
            <h2>GymSolution staff features: available, coming soon and not available</h2>
            <p>No surprises after you sign up. This is where every staff management feature stands today.</p>
          </div>
          <div className="w-table-wrap">
            <table className="w-compare">
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  <th scope="col">Status</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {STATUS.map(([feature, status, note]) => (
                  <tr key={feature}>
                    <th scope="row">{feature}</th>
                    <td className={status === 'yes' ? '' : 'no'}>
                      <Icon name={status === 'yes' ? 'check' : status === 'soon' ? 'calendar' : 'close'} />
                      {STATUS_LABEL[status]}
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
          <span className="w-eyebrow dark">Available today</span>
          <h2>How GymSolution lightens your staff’s daily work</h2>
          <p>The best way to manage a busy front desk is to give it less routine work. These features do that now.</p>
        </div>
        <Cards items={AVAILABLE} />
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-feature">
            <div className="w-feature-text">
              <span className="w-icon tone-purple">
                <Icon name="calendar" />
              </span>
              <h2>Front-desk work that runs itself</h2>
              <p>
                Renewals are the front desk’s biggest job. GymSolution lists who is due every day and, on the Pro plan, sends the WhatsApp reminders from your
                gym number, so your staff do not have to call members one by one.
              </p>
              <ul className="w-points">
                <li>
                  <Icon name="check" />
                  Overdue, due today and next 7 days
                </li>
                <li>
                  <Icon name="check" />
                  Renew and take payment in a few taps
                </li>
                <li>
                  <Icon name="check" />
                  Automatic reminders on the renewal date and 2 days later
                </li>
              </ul>
              <Link to="/whatsapp-reminder-software-for-gym" className="w-more">
                How the reminders work <Icon name="arrow" />
              </Link>
            </div>
            <div className="w-feature-visual">
              <RenewalsMock />
            </div>
          </div>
          <div className="w-feature">
            <div className="w-feature-text">
              <span className="w-icon tone-orange">
                <Icon name="rupee" />
              </span>
              <h2>Staff salaries in your expenses and profit</h2>
              <p>
                Create a Salaries category once. Each month, record every salary with the staff member’s name in “Paid to”, the amount and how it was paid.
                Salaries then show in your monthly expenses and profit, with everything else the gym spends.
              </p>
              <Link to="/gym-expense-tracking-software" className="w-more">
                More on expense tracking <Icon name="arrow" />
              </Link>
            </div>
            <div className="w-feature-visual">
              <ExpensesMock />
            </div>
          </div>
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">Coming soon</span>
          <h2>Staff logins, permissions and activity tracking</h2>
          <p>
            These staff management features are not available yet. Until they are, each gym has one login for the owner, and anyone using it can see
            everything.
          </p>
        </div>
        <Cards items={COMING} soon />
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">In practice</span>
            <h2>How gym owners use GymSolution with their staff today</h2>
            <p>Realistic situations, using only features that work now.</p>
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
        </div>
      </section>

      <section className="w-container w-section">
        <div className="w-price">
          <div className="w-price-card">
            <span>GymSolution from</span>
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
            <span className="w-eyebrow dark">Gym business management software</span>
            <h2>Run the whole gym from one place</h2>
            <p>
              Members, renewals, payments, dues, expenses, profit and supplement stock in one account, on your phone and laptop. Less routine work for
              everyone, and clear records for you.
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
                Expenses and salaries
              </li>
              <li>
                <Icon name="check" />
                Supplement stock
              </li>
            </ul>
          </div>
        </div>
        <p className="w-after">
          Comparing options? Read <Link to="/best-software-for-gym-management">how to choose the best software for gym management</Link>, or see{' '}
          <Link to="/features">all features</Link>.
        </p>
      </section>

      <Faq title="Gym staff management software: common questions" items={FAQS} band>
        <p className="w-after">
          <Link to="/gym-management-app-free">Start with a free trial</Link> or <Link to="/gym-management-software-pricing">see GymSolution pricing</Link>.
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
