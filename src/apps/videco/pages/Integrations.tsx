import { useState } from 'react'
import { Plug, Search, ExternalLink, CheckCircle, Clock } from 'lucide-react'

const INTEGRATIONS = [
  { id: 'zapier', name: 'Zapier', desc: 'Connect to 5000+ apps with automated workflows', category: 'Automation', status: 'active', logo: '⚡' },
  { id: 'apollo', name: 'Apollo', desc: 'Enrich contacts and sync with your outreach', category: 'CRM', status: 'available', logo: '🔍' },
  { id: 'activecampaign', name: 'ActiveCampaign', desc: 'Email marketing and automation platform', category: 'Email', status: 'available', logo: '📧' },
  { id: 'aweber', name: 'AWeber', desc: 'Email marketing for small businesses', category: 'Email', status: 'available', logo: '📨' },
  { id: 'brevo', name: 'Brevo', desc: 'All-in-one digital marketing platform', category: 'Email', status: 'available', logo: '💌' },
  { id: 'lemlist', name: 'Lemlist', desc: 'Cold email outreach with personalization', category: 'Outreach', status: 'available', logo: '🎯' },
  { id: 'gohighlevel', name: 'GoHighLevel', desc: 'All-in-one marketing and CRM platform', category: 'CRM', status: 'available', logo: '🏢' },
  { id: 'mailchimp', name: 'Mailchimp', desc: 'Email marketing and automation', category: 'Email', status: 'available', logo: '🐵' },
  { id: 'hubspot', name: 'HubSpot', desc: 'Inbound marketing and sales platform', category: 'CRM', status: 'available', logo: '🟠' },
  { id: 'calendly', name: 'Calendly', desc: 'Schedule meetings without the back-and-forth', category: 'Scheduling', status: 'available', logo: '📅' },
  { id: 'youtube', name: 'YouTube', desc: 'Share videos on the world\'s largest platform', category: 'Video', status: 'available', logo: '▶️' },
  { id: 'vimeo', name: 'Vimeo', desc: 'Professional video hosting and sharing', category: 'Video', status: 'available', logo: '🎬' },
  { id: 'salesforce', name: 'Salesforce', desc: 'World\'s leading CRM platform', category: 'CRM', status: 'available', logo: '☁️' },
  { id: 'slack', name: 'Slack', desc: 'Team communication and collaboration', category: 'Communication', status: 'available', logo: '💬' },
  { id: 'notion', name: 'Notion', desc: 'All-in-one workspace for notes and docs', category: 'Productivity', status: 'available', logo: '📝' },
  { id: 'make', name: 'Make', desc: 'Visual automation platform (formerly Integromat)', category: 'Automation', status: 'available', logo: '🔧' },
]

const CATEGORIES = ['All', 'Automation', 'CRM', 'Email', 'Outreach', 'Scheduling', 'Video', 'Communication', 'Productivity']

export default function Integrations() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [configured, setConfigured] = useState<Set<string>>(new Set(['zapier']))

  const filtered = INTEGRATIONS.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || i.category === category
    return matchesSearch && matchesCategory
  })

  const handleConfigure = (id: string) => {
    setConfigured((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Plug size={24} className="text-cyan-400" />
          Integrations
        </h1>
        <p className="text-secondary mt-1">Connect VideoCo with your favorite tools and platforms</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm placeholder:text-muted focus:border-cyan-500/50 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                category === cat
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-secondary hover:bg-bg-card'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((integration) => {
          const isConfigured = configured.has(integration.id)
          return (
            <div
              key={integration.id}
              className={`glass-panel rounded-xl p-5 transition-all hover:border-cyan-500/30 ${
                isConfigured ? 'border-green-500/20' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-bg-card flex items-center justify-center text-xl flex-shrink-0">
                  {integration.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-sm">{integration.name}</h3>
                    {isConfigured && <CheckCircle size={14} className="text-green-400" />}
                  </div>
                  <p className="text-xs text-secondary mt-0.5 line-clamp-2">{integration.desc}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-bg-card rounded text-xs text-muted">{integration.category}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => handleConfigure(integration.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isConfigured
                      ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                  }`}
                >
                  {isConfigured ? (
                    <>
                      <CheckCircle size={14} />
                      Connected
                    </>
                  ) : (
                    <>
                      <ExternalLink size={14} />
                      Configure
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="glass-panel rounded-xl p-12 text-center">
          <Plug size={40} className="text-muted mx-auto mb-3" />
          <p className="text-secondary">No integrations found</p>
          <p className="text-muted text-sm mt-1">Try a different search or category</p>
        </div>
      )}
    </div>
  )
}
