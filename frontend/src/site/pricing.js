// GymSolution plans, in rupees per year. Every website page reads its prices from here.
// whatsapp: automatic WhatsApp renewal reminders. multiGym: several branches from one login.
export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 3500,
    whatsapp: false,
    multiGym: false,
    tagline: 'For one gym: members, renewals, dues, expenses and profit in order.',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 5000,
    whatsapp: true,
    multiGym: false,
    featured: true,
    tagline: 'Everything in Starter, plus automatic WhatsApp renewal reminders.',
  },
  {
    id: 'multi-gym',
    name: 'Multi-Gym',
    price: 7000,
    whatsapp: true,
    multiGym: true,
    tagline: 'Everything in Pro, for owners with more than one gym or branch.',
  },
]

const byId = Object.fromEntries(PLANS.map((p) => [p.id, p]))
export const STARTER = byId.starter.price
export const PRO = byId.pro.price
export const MULTI_GYM = byId['multi-gym'].price

export const rupees = (n) => `₹${n.toLocaleString('en-IN')}`
export const perMonth = (yearly) => Math.round(yearly / 12)

// For the search-engine data on each page: every plan as an offer.
export const OFFERS = PLANS.map((p) => ({
  '@type': 'Offer',
  name: `${p.name} plan`,
  price: String(p.price),
  priceCurrency: 'INR',
  description: `${p.tagline} Billed yearly.`,
  priceSpecification: { '@type': 'UnitPriceSpecification', price: String(p.price), priceCurrency: 'INR', unitText: 'YEAR' },
}))
