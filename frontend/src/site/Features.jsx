import { Icon } from '../components/ui.jsx'
import Faq from './Faq.jsx'
import { FEATURES } from './features.js'
import { DashboardMock, ExpensesMock, InventoryMock, MembersMock, MultiGymMock, RenewalsMock, StaffMock, TrainersMock, WhatsAppMock } from './mocks.jsx'
import SiteLayout, { CtaBand } from './SiteLayout.jsx'

const MOCKS = {
  renewals: RenewalsMock,
  members: MembersMock,
  whatsapp: WhatsAppMock,
  expenses: ExpensesMock,
  dashboard: DashboardMock,
  'multi-gym': MultiGymMock,
  staff: StaffMock,
  trainers: TrainersMock,
  inventory: InventoryMock,
}

const FAQS = [
  {
    q: 'How does GymSolution keep track of membership renewals?',
    a: 'Every membership gets a renewal date worked out from its plan. The Renewals screen lists who is overdue, who is due today and who is due in the next 7 days, and you can renew on the same plan or a new one in a few taps.',
  },
  {
    q: 'Can I set my own membership plans, prices and admission fee?',
    a: 'Yes. In Settings you create plans with your own name, length in months and price, and set a default admission fee for new members. You can stop offering a plan at any time without touching members already on it.',
  },
  {
    q: 'How do I track gym expenses and monthly profit?',
    a: 'Add each expense with its category, amount and payment mode, and attach a photo or PDF of the bill if you like. The dashboard puts membership fees and supplement sales next to your expenses, so you see the profit for every month.',
  },
  {
    q: 'Can GymSolution manage supplement stock like protein and creatine?',
    a: 'Yes. Add each product with its buying and selling price, record purchases and sales, and the stock count updates by itself. Set a low-stock level for each product to see what needs reordering, and open any product to see everything that came in and went out.',
    link: ['/gym-stock-management-software', 'See gym stock management in detail.'],
  },
  {
    q: 'Can I export my member list to Excel?',
    a: 'Yes. You can download members, payments, expenses and stock as CSV files, which open in Excel or Google Sheets.',
  },
  {
    q: 'Does GymSolution work with biometric attendance machines?',
    a: 'No. GymSolution does not connect to biometric, RFID or door-access machines, so there is no hardware to buy. It runs in the browser on the phone or computer you already use and focuses on members, renewals, payments, expenses and stock.',
    link: ['/affordable-gym-management-software', 'See what GymSolution costs.'],
  },
]

export default function Features() {
  return (
    <SiteLayout title="Features – GymSolution Gym Management Software">
      <section className="w-hero small">
        <div className="w-container w-page-head">
          <span className="w-eyebrow">Features</span>
          <h1>Everything you need to manage your gym</h1>
          <p>From the first admission to supplement sales and monthly profit — GymSolution is a complete gym management software for gym owners.</p>
          <div className="w-chips">
            {FEATURES.map((f) => (
              <a key={f.id} href={`#${f.id}`} className="w-chip">
                <Icon name={f.icon} />
                {f.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="w-container">
        {FEATURES.map((f) => {
          const Mock = MOCKS[f.id]
          return (
            <section key={f.id} id={f.id} className="w-feature">
              <div className="w-feature-text">
                <span className={`w-icon tone-${f.tone}`}>
                  <Icon name={f.icon} />
                </span>
                <h2>{f.title}</h2>
                <p>{f.short}</p>
                <ul className="w-points">
                  {f.points.map((pt) => (
                    <li key={pt}>
                      <Icon name="check" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-feature-visual">
                <Mock />
              </div>
            </section>
          )
        })}
      </div>

      <Faq title="Gym management software features: common questions" items={FAQS} band />

      <CtaBand />
    </SiteLayout>
  )
}
