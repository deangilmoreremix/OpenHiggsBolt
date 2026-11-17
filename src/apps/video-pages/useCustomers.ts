'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDemoPersonalize } from '@/shared/personalization/DemoPersonalizeProvider'
import { loadClients, getCurrentClientId } from '@/shared/personalization/clientProfile'
import { loadClientAssets } from '@/shared/personalization/clientAssets'
import { collectCustomers } from '@/src/lib/landingPages/customerSources.js'

// The Personalization window's state, or null where that provider is not mounted (tests, the public site).
function usePersonalizeOrNull(): any {
  try { return useDemoPersonalize() } catch { return null }
}

export type Customer = {
  id: string; label: string; source: string
  tokens: Record<string, string>; email: string; image?: string
  business: Record<string, string>; brand: { accent: string; logoUrl: string }
}

/**
 * Every customer the Personalization window knows about (the open client, saved clients, the business picked in
 * Find your business), saved Lead Finder leads, and any contacts the caller hands in. The active client comes first.
 */
export function useCustomers(contacts?: any[]) {
  const ctx = usePersonalizeOrNull()
  const [leads, setLeads] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let live = true
    const leadsReq = fetch('/api/personalization/leads', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : ({} as { leads?: any[] })))
      .then((d) => { if (live) setLeads(Array.isArray(d?.leads) ? d.leads : []) })
      .catch(() => {})
    // the customer's saved Personalization projects hold their generated (personalized) pictures
    const projectsReq = fetch('/api/personalization/project?list=true', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : ({} as { projects?: any[] })))
      .then((d) => { if (live) setProjects(Array.isArray(d?.projects) ? d.projects : []) })
      .catch(() => {})
    // "loading" covers BOTH requests, so a page is never created before the personalized pictures are known
    void Promise.all([leadsReq, projectsReq]).then(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [])
  const result = useMemo(() => {
    let clients: any[] = ctx?.clients?.length ? ctx.clients : []
    if (!clients.length) { try { clients = loadClients() } catch { clients = [] } }
    const assetsByClient: Record<string, any> = {}
    clients.forEach((c) => { try { assetsByClient[c.id] = loadClientAssets(c.id) } catch { /* no saved assets */ } })
    let selectedClientId = ctx?.selectedClientId || ''
    if (!selectedClientId) { try { selectedClientId = getCurrentClientId() || '' } catch { /* none */ } }
    return collectCustomers({
      clientForm: ctx?.clientForm, selectedClientId, clients, assetsByClient,
      assets: ctx?.assets, brandColors: ctx?.previewSettings?.brandColors, selectedBusiness: ctx?.selectedBusiness, leads, contacts, projects,
    }) as { customers: Customer[]; activeId: string }
  }, [ctx?.clients, ctx?.clientForm, ctx?.selectedClientId, ctx?.assets, ctx?.previewSettings?.brandColors, ctx?.selectedBusiness, leads, contacts, projects])
  return { ...result, loading }
}
