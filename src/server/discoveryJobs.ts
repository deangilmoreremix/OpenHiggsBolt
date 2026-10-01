import { getSupabaseAdmin } from '@/lib/supabaseServer'

export type DiscoveryJobStatus = 'queued' | 'running' | 'complete' | 'error'

export interface DiscoveryJobRow {
  id: string
  clerk_user_id: string
  website_url: string
  status: DiscoveryJobStatus
  fast_result_json: unknown | null
  browser_result_json: unknown | null
  final_result_json: unknown | null
  telemetry_json: unknown | null
  error_code: string | null
  error_message: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  expires_at: string
}

export interface CreateDiscoveryJobInput {
  clerkUserId: string
  websiteUrl: string
  fastResult?: unknown
  telemetry?: Record<string, unknown>
}

export interface UpdateDiscoveryJobInput {
  status?: DiscoveryJobStatus
  startedAt?: string | null
  completedAt?: string | null
  browserResult?: unknown
  finalResult?: unknown
  telemetry?: Record<string, unknown>
  errorCode?: string
  errorMessage?: string
}

export async function createDiscoveryJob(input: CreateDiscoveryJobInput): Promise<DiscoveryJobRow> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('personalization_discovery_jobs')
    .insert({
      clerk_user_id: input.clerkUserId,
      website_url: input.websiteUrl,
      status: 'queued',
      fast_result_json: input.fastResult ?? null,
      telemetry_json: input.telemetry ?? null,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to create discovery job: ${error.message}`)
  }

  return data as DiscoveryJobRow
}

export async function updateDiscoveryJob(id: string, input: UpdateDiscoveryJobInput): Promise<DiscoveryJobRow> {
  const supabase = getSupabaseAdmin()
  const payload: Record<string, unknown> = {}

  if (input.status) payload.status = input.status
  if (input.startedAt !== undefined) payload.started_at = input.startedAt
  if (input.completedAt !== undefined) payload.completed_at = input.completedAt
  if (input.browserResult !== undefined) payload.browser_result_json = input.browserResult
  if (input.finalResult !== undefined) payload.final_result_json = input.finalResult
  if (input.telemetry) payload.telemetry_json = input.telemetry
  if (input.errorCode !== undefined) payload.error_code = input.errorCode
  if (input.errorMessage !== undefined) payload.error_message = input.errorMessage

  const { data, error } = await supabase
    .from('personalization_discovery_jobs')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to update discovery job: ${error.message}`)
  }

  return data as DiscoveryJobRow
}

export async function getDiscoveryJobForUser(id: string, clerkUserId: string): Promise<DiscoveryJobRow | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('personalization_discovery_jobs')
    .select('*')
    .eq('id', id)
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (error || !data) {
    return null
  }

  return data as DiscoveryJobRow
}

export async function getDiscoveryJobById(id: string): Promise<DiscoveryJobRow | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('personalization_discovery_jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data as DiscoveryJobRow
}
