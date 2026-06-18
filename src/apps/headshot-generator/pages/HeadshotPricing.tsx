import { useState } from 'react'
import { AlertCircle, Bolt, CheckCircle, Coins, Loader2 } from 'lucide-react'

interface Tier {
  name: string
  credits: number
  price: number
  description: string
  features: string[]
  highlight: boolean
  priceEnvVar: string
}

const TIERS: Tier[] = [
  {
    name: 'Starter Session',
    credits: 3800,
    price: 19,
    description: 'Perfect for a single high-fidelity headshot refresh.',
    features: ['63 Professional Photo Packs', 'Full Style Selection', 'Permanent Storage', 'Standard Processing'],
    highlight: false,
    priceEnvVar: 'VITE_STRIPE_PRICE_STARTER',
  },
  {
    name: 'Professional Studio',
    credits: 9000,
    price: 45,
    description: 'Complete portfolio for career transitions.',
    features: ['150 Professional Photo Packs', 'Priority Extraction', 'Style Consultation', 'Priority Support'],
    highlight: true,
    priceEnvVar: 'VITE_STRIPE_PRICE_PROFESSIONAL',
  },
  {
    name: 'Executive Suite',
    credits: 19800,
    price: 99,
    description: 'Bulk portraits for teams and emerging leaders.',
    features: ['330 Professional Photo Packs', 'Bulk Generation Support', 'Direct API Access', '24/7 Priority Support'],
    highlight: false,
    priceEnvVar: 'VITE_STRIPE_PRICE_EXECUTIVE',
  },
]

function getEnvVar(name: string): string | undefined {
  const env = import.meta.env as unknown as Record<string, string | undefined>
  const value = env[name]
  return value && !value.includes('placeholder') ? value : undefined
}

function isTierEnabled(tier: Tier): boolean {
  return Boolean(getEnvVar(tier.priceEnvVar))
}

export default function HeadshotPricing() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null)

  const handleCheckout = async (tier: Tier) => {
    const priceId = getEnvVar(tier.priceEnvVar)
    if (!priceId) return

    try {
      setLoadingTier(tier.name)
      const response = await fetch('/.netlify/functions/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, credits: tier.credits }),
      })
      const data = (await response.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Checkout session creation failed')
      }
    } catch (err) {
      console.error('Stripe checkout error:', err)
      alert('Checkout is unavailable. Please try again later.')
    } finally {
      setLoadingTier(null)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
      <header className="max-w-7xl mx-auto mb-16 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold tracking-[0.4em] uppercase">
          Establish your professional presence
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-white">CREDIT TIERS</h1>
        <p className="text-secondary font-medium text-xs uppercase tracking-widest max-w-xl mx-auto leading-loose">
          Unlock higher fidelity, faster processing, and permanent archive access. Choose your portrait session.
        </p>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
        {TIERS.map((tier, index) => {
          const enabled = isTierEnabled(tier)
          return (
            <div
              key={tier.name}
              className={`relative p-8 rounded-2xl border transition-all flex flex-col animate-fade-in-up ${
                tier.highlight
                  ? 'bg-bg-card border-primary shadow-xl'
                  : 'bg-bg-card border-border-color shadow-sm'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-black rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg">
                  Most Potent
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold tracking-tight mb-2 text-white">{tier.name}</h3>
                <p className="text-xs text-secondary font-medium leading-relaxed">{tier.description}</p>
              </div>

              <div className="mb-8 flex items-end gap-1">
                <span className="text-4xl font-bold tracking-tight text-white">${tier.price}</span>
                <span className="text-xs font-medium text-secondary mb-1.5 uppercase tracking-widest">/ Month</span>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-panel border border-border-color">
                  <Coins className="text-yellow-500 text-lg" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-secondary uppercase tracking-widest leading-none mb-1">
                      Yields
                    </span>
                    <span className="text-lg font-bold text-white">{tier.credits} CREDITS</span>
                  </div>
                </div>

                <ul className="space-y-3 pt-2">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-3 text-xs font-medium text-secondary">
                      <CheckCircle className="text-primary shrink-0" size={14} />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleCheckout(tier)}
                disabled={!enabled || loadingTier === tier.name}
                title={enabled ? 'Book this session' : 'Checkout unavailable — Stripe price ID not configured'}
                className={`w-full h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  tier.highlight
                    ? 'bg-primary text-black hover:bg-primary-hover shadow-primary/20'
                    : 'bg-bg-panel text-white hover:bg-white/5 border border-border-color'
                }`}
              >
                {loadingTier === tier.name ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Book Session
                    <Bolt size={14} className={tier.highlight ? 'text-black' : 'text-secondary'} />
                  </>
                )}
              </button>

              {!enabled && (
                <div className="mt-4 flex items-start gap-2 text-[10px] text-secondary">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>Configure {tier.priceEnvVar} to enable checkout.</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
