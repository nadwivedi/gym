import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { DashboardMock, InventoryMock, ReminderChatMock } from './mocks.jsx'
import { OFFERS, PRO, STARTER, perMonth, rupees } from './pricing.js'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'
import { whatsappLink } from './whatsapp.js'

const PAGE_URL = 'https://gymsolution.in/ai-gym-management-software'
const TRIAL_URL = whatsappLink('Hi, I want to try GymSolution for my gym.')

// What "AI" gym software is usually sold on. [icon, colour, heading, text]
const AI_CLAIMS = [
  ['trend', 'purple', 'Churn prediction', 'A score that guesses which members are about to leave, based on their visits and payments.'],
  ['chat', 'blue', 'Chatbots', 'A bot that answers member questions on WhatsApp or the website, day and night.'],
  ['dumbbell', 'green', 'Personalised plans', 'Workout and diet plans written for each member, usually inside a member app.'],
]

// What GymSolution automates today. [what happens, how it decides, the work it saves]
const AUTOMATION = [
  ['Renewal reminders go out on WhatsApp', 'On the renewal date and 2 days later, only if the member has not renewed (Pro plan)', 'Calling or messaging members one by one'],
  ['Renewal dates are set', 'Worked out from the plan length when you add or renew a member', 'Counting months on a calendar'],
  ['Members are sorted into lists', 'Overdue, due today, next 7 days and starting soon, updated every day', 'Turning register pages every morning'],
  ['Balances are calculated', 'Plan fee + admission fee − waived − payments', 'Adding up part payments by hand'],
  ['Long-overdue members are flagged', 'Overdue for more days than the limit you set in Settings', 'Guessing who has stopped coming'],
  ['Low-stock warnings', 'Stock at or below the level you set for each product', 'Counting tins on the shelf'],
  ['Profit is worked out', 'Fees and shop sales minus expenses and stock bought, for every month', 'Month-end accounts'],
]

// What the owner gets out of it. [icon, colour, heading, text]
const FEATURES = [
  ['users', 'blue', 'Membership management', 'Every member with their plan, renewal date, payments and full history. Search by name or mobile number.'],
  ['chat', 'green', 'Automatic WhatsApp reminders', 'Renewal reminders from your own gym number, sent on time without anyone remembering to send them.'],
  ['rupee', 'orange', 'Payments and dues', 'Part payments, pending balances and promised dates, with one-tap WhatsApp messages for the exact amount due.'],
  ['receipt', 'purple', 'Expenses and profit', 'Every bill with its category and photo, and income, expenses and profit for every month and year.'],
  ['box', 'blue', 'Stock management', 'Protein, creatine and other products: buying and selling price, stock count and low-stock warnings.'],
  ['upload', 'green', 'Export to Excel', 'Download members, payments, expenses and stock whenever you or your accountant need them.'],
]

// Realistic examples of decisions made easier. [heading, text]
const EXAMPLES = [
  ['Is this month better than last?', 'The dashboard shows September’s profit next to October’s. If expenses went up, the category split shows where: electricity, repairs or stock.'],
  ['Who should I call today?', 'Open Renewals: 6 due today, 3 overdue. Each overdue member shows how many days late they are, so you start with the members you can still win back.'],
  ['How much money is stuck in dues?', 'The dues list shows ₹18,400 pending from 11 members, biggest first, with the dates they promised to pay.'],
  ['What should I reorder?', 'The stock page shows creatine is down to 3 and pre-workout is out, before a member asks for it.'],
]

const FAQS = [
  {
    q: 'What is AI gym management software?',
    a: 'It is gym management software that adds artificial intelligence on top of the usual member, payment and renewal records. Common examples are churn prediction, chatbots and personalised workout plans. The everyday work of a gym, such as renewals, dues and accounts, is mostly handled by automation and clear rules, not AI.',
  },
  {
    q: 'Does GymSolution use AI?',
    a: 'No, not today. GymSolution uses automation and simple rules that you can see and control: renewal dates from the plan length, lists by renewal date, balances from fees and payments, and WhatsApp reminders on fixed days. We would rather tell you exactly what the software does than call it AI.',
  },
  {
    q: 'What is the difference between automation and AI in gym software?',
    a: 'Automation follows rules you can predict: “send a reminder on the renewal date if the member has not renewed”. AI makes guesses from patterns, such as “this member is 70% likely to leave”. Automation is reliable and easy to check; AI can find patterns but can also be wrong.',
  },
  {
    q: 'Can GymSolution predict which members will leave?',
    a: 'It does not predict. It shows the facts that matter instead: members whose membership has ended and not been renewed, how many days late each one is, and a flag for members overdue longer than the limit you set.',
    link: ['/gym-membership-renewal-software', 'See how renewal tracking works.'],
  },
  {
    q: 'Which tasks does GymSolution automate?',
    a: 'Renewal reminders on WhatsApp (Pro plan), renewal dates, the daily renewal and overdue lists, member balances, long-overdue flags, low-stock warnings, and monthly income, expense and profit totals.',
  },
  {
    q: 'Does it send WhatsApp messages automatically?',
    a: `Yes, on the Pro plan at ${rupees(PRO)} a year. A reminder goes from your gym’s WhatsApp number on the renewal date, and again 2 days later if the member has not renewed. Messages for dues and upcoming renewals are written for you and sent in one tap.`,
    link: ['/whatsapp-automation-for-gyms', 'More on WhatsApp automation.'],
  },
  {
    q: 'Will GymSolution add AI features?',
    a: 'If we add AI, it will be where it clearly saves gym owners time, and this page will say exactly what it does. Until then, everything listed here works today.',
  },
  {
    q: 'How much does GymSolution cost?',
    a: `The Starter plan is ${rupees(STARTER)} a year (about ₹${perMonth(STARTER)} a month) and includes members, renewals, payments, dues, expenses and stock. Automatic WhatsApp reminders come with the Pro plan at ${rupees(PRO)} a year.`,
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
      'Gym management software with automation: automatic WhatsApp renewal reminders, renewal and overdue lists, payment and dues tracking, expense and profit reports, and stock management.',
    featureList: [
      'Automatic WhatsApp renewal reminders',
      'Renewal, overdue and expiring-soon lists',
      'Payments, part payments and pending dues',
      'Expense tracking and monthly profit',
      'Stock management with low-stock warnings',
      'Export to Excel',
    ],
    offers: OFFERS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gymsolution.in/' },
      { '@type': 'ListItem', position: 2, name: 'AI Gym Management Software', item: PAGE_URL },
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

export default function AiGymSoftware() {
  return (
    <SiteLayout
      title="AI Gym Management Software: What It Does & What You Need | GymSolution"
      description={`Looking for AI gym management software? See what AI really adds, and how GymSolution’s automation handles renewals, WhatsApp reminders, dues, expenses, profit and stock for gym owners. From ${rupees(STARTER)}/year.`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED) }} />

      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Smart automation, explained honestly</span>
          <h1>AI Gym Management Software: What Gym Owners Really Need</h1>
          <p>
            Every gym software now calls itself AI. Most of the time you save comes from something simpler: automation that sends the reminders, works out
            the dates and adds up the money for you. That is what GymSolution does, and this page shows exactly how.
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

      <section className="w-container w-section">
        <div className="w-section-head">
          <span className="w-eyebrow dark">What AI usually means</span>
          <h2>What AI gym management software promises</h2>
          <p>
            When gym software is sold as AI, it usually means one of these three. They can help large clubs with thousands of members and a lot of data to
            learn from.
          </p>
        </div>
        <Cards items={AI_CLAIMS} />
        <p className="w-after">
          For most gyms, though, members are not lost because nobody predicted it. They are lost because nobody reminded them, a due was forgotten, or the
          owner never saw the numbers. Those problems are solved by automation.
        </p>
      </section>

      <section className="w-band">
        <div className="w-container w-section">
          <div className="w-section-head">
            <span className="w-eyebrow dark">Automation, not AI</span>
            <h2>What GymSolution automates for you today</h2>
            <p>
              GymSolution does not use artificial intelligence. It uses clear rules you can check and control, so it never surprises you. Here is every
              automatic job and how it decides.
            </p>
          </div>
          <div className="w-table-wrap">
            <table className="w-compare">
              <thead>
                <tr>
                  <th scope="col">What happens automatically</th>
                  <th scope="col">How it decides</th>
                  <th scope="col">Work it saves you</th>
                </tr>
              </thead>
              <tbody>
                {AUTOMATION.map(([what, how, saves]) => (
                  <tr key={what}>
                    <th scope="row">{what}</th>
                    <td>{how}</td>
                    <td>
                      <Icon name="check" />
                      {saves}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-green">
              <Icon name="chat" />
            </span>
            <h2>The automation that saves the most time: WhatsApp renewal reminders</h2>
            <p>
              Reminding members to renew is the job gym owners skip most on a busy day. On the Pro plan, GymSolution does it for you from your own gym
              WhatsApp number, at a safe, human pace.
            </p>
            <Points
              items={[
                'Sent on the renewal date, and 2 days later if not renewed',
                'Skips members who renewed or whom you have hidden',
                'Only between 8 am and 9 pm',
                'A log of every message: sent, waiting or failed',
              ]}
            />
            <Link to="/whatsapp-automation-for-gyms" className="w-more">
              How WhatsApp automation works <Icon name="arrow" />
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
            <span className="w-eyebrow dark">Everything in one place</span>
            <h2>Gym management software that runs the whole business</h2>
            <p>Automation works best when all your records are in one place. GymSolution keeps every part of the gym together.</p>
          </div>
          <Cards items={FEATURES} />
          <p className="w-after">
            Read more about <Link to="/gym-membership-renewal-software">renewals</Link>, <Link to="/gym-dues-collection-software">dues collection</Link>,{' '}
            <Link to="/gym-expense-tracking-software">expense tracking</Link> and <Link to="/gym-stock-management-software">stock management</Link>.
          </p>
        </div>
      </section>

      <div className="w-container">
        <section className="w-feature">
          <div className="w-feature-text">
            <span className="w-icon tone-blue">
              <Icon name="chart" />
            </span>
            <h2>Smarter decisions from clear numbers</h2>
            <p>
              You do not need a prediction to run a better gym. You need the right numbers in front of you. The dashboard shows income, expenses and profit
              for every month, so you can see what is working.
            </p>
            <Points
              items={[
                'Membership fees and shop sales, month by month',
                'Expenses by category, including stock bought',
                'Profit or loss for each month and the year',
                'Active members and pending dues at the top',
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
            <span className="w-eyebrow dark">Real examples</span>
            <h2>Everyday questions GymSolution answers in seconds</h2>
            <p>The questions gym owners ask every week, and where the answer is.</p>
          </div>
          <ol className="w-steps">
            {EXAMPLES.map(([title, text], i) => (
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
            <span className="w-icon tone-purple">
              <Icon name="box" />
            </span>
            <h2>Less manual work in the supplement shop too</h2>
            <p>
              Sell protein, creatine and other products from the same software. Every sale and purchase updates the stock count, and products running low are
              flagged before they run out.
            </p>
            <Points items={['Buying and selling price for each product', 'Stock count updated with every sale and purchase', 'Low-stock warning at the level you choose', 'Shop sales and purchases counted in your profit']} />
            <Link to="/gym-stock-management-software" className="w-more">
              More on stock management <Icon name="arrow" />
            </Link>
          </div>
          <div className="w-feature-visual">
            <InventoryMock />
          </div>
        </section>
      </div>

      <section className="w-band">
        <div className="w-container w-section">
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
              <span className="w-eyebrow dark">No hype</span>
              <h2>Pay for what works, not for a label</h2>
              <p>
                With GymSolution you pay for the jobs it actually does: members, renewals, reminders, dues, expenses, profit and stock. Every one of them
                works today.
              </p>
              <ul className="w-ticks">
                <li>
                  <Icon name="check" />
                  No setup fee
                </li>
                <li>
                  <Icon name="check" />
                  No charge per message
                </li>
                <li>
                  <Icon name="check" />
                  Works on phone and computer
                </li>
                <li>
                  <Icon name="check" />
                  Nothing to install
                </li>
              </ul>
            </div>
          </div>
          <p className="w-after">
            See why it is <Link to="/affordable-gym-management-software">affordable gym management software</Link>, or{' '}
            <Link to="/gym-management-app-free">start with a free trial</Link>.
          </p>
        </div>
      </section>

      <Faq title="AI gym management software: common questions" items={FAQS}>
        <p className="w-after">
          <Link to="/gym-management-app-free">Start with a free trial</Link> or <Link to="/gym-management-software-pricing">see GymSolution pricing</Link>.
        </p>
      </Faq>

      <CtaBand />
    </SiteLayout>
  )
}
