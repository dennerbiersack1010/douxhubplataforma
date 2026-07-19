import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  isOnboardingStep,
  onboardingCancelRequestSchema,
  onboardingCompleteRequestSchema,
  onboardingSaveRequestSchema,
  validateOnboardingStep,
} from '@/lib/clinic-onboarding'
import { ACTIVE_MEMBERSHIP_COOKIE } from '@/lib/clinic-context'

type OnboardingProgressRow = {
  id: string
  status: 'in_progress' | 'completed' | 'cancelled'
  current_step: number
  completed_steps: number[]
  owner_data: Record<string, unknown>
  clinic_data: Record<string, unknown>
  unit_data: Record<string, unknown>
  operation_data: Record<string, unknown>
  team_data: Record<string, unknown>
  schema_version: number
  revision: number
  started_at: string
  updated_at: string
}

type OnboardingCompletionRow = {
  clinic_id: string
  unit_id: string
  membership_id: string
}

function noStoreJson(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  return response
}

function serializeProgress(row: OnboardingProgressRow | null) {
  if (!row) return null
  return {
    id: row.id,
    status: row.status,
    currentStep: row.current_step,
    completedSteps: row.completed_steps,
    steps: {
      owner: row.owner_data,
      clinic: row.clinic_data,
      unit: row.unit_data,
      operation: row.operation_data,
      team: row.team_data,
    },
    schemaVersion: row.schema_version,
    revision: row.revision,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
  }
}

function firstProgress(data: unknown) {
  const row = Array.isArray(data) ? data[0] : data
  return row ? row as OnboardingProgressRow : null
}

async function onboardingContext(options?: { allowActiveMembership?: boolean }) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'unauthorized' as const, status: 401 as const }

  if (options?.allowActiveMembership) return { supabase, user }

  const { count, error: membershipError } = await supabase
    .from('clinic_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (membershipError) return { error: 'onboarding_unavailable' as const, status: 503 as const }
  if ((count ?? 0) > 0) return { error: 'onboarding_not_available' as const, status: 409 as const }
  return { supabase, user }
}

function rpcError(message: string) {
  if (message.includes('onboarding_progress_not_found')) return noStoreJson({ error: 'onboarding_progress_not_found' }, { status: 404 })
  if (message.includes('onboarding_step_out_of_order')) return noStoreJson({ error: 'onboarding_step_out_of_order' }, { status: 409 })
  if (message.includes('onboarding_not_ready')) return noStoreJson({ error: 'onboarding_not_ready' }, { status: 409 })
  if (message.includes('active_membership_already_exists')) return noStoreJson({ error: 'onboarding_not_available' }, { status: 409 })
  if (message.includes('onboarding_data')) return noStoreJson({ error: 'invalid_onboarding_step_data' }, { status: 422 })
  if (message.includes('invalid_onboarding')) return noStoreJson({ error: 'invalid_onboarding_request' }, { status: 400 })
  return noStoreJson({ error: 'onboarding_unavailable' }, { status: 503 })
}

export async function GET() {
  const context = await onboardingContext()
  if ('error' in context) return noStoreJson({ error: context.error }, { status: context.status })

  const { data, error } = await context.supabase
    .from('clinic_onboarding_progress')
    .select('id, status, current_step, completed_steps, owner_data, clinic_data, unit_data, operation_data, team_data, schema_version, revision, started_at, updated_at')
    .eq('user_id', context.user.id)
    .eq('status', 'in_progress')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return noStoreJson({ error: 'onboarding_unavailable' }, { status: 503 })
  return noStoreJson({ progress: serializeProgress(data as OnboardingProgressRow | null) })
}

export async function POST() {
  const context = await onboardingContext()
  if ('error' in context) return noStoreJson({ error: context.error }, { status: context.status })

  const { data, error } = await context.supabase.rpc('start_or_resume_clinic_onboarding')
  const progress = firstProgress(data)
  if (error || !progress) return rpcError(error?.message ?? 'onboarding_unavailable')
  return noStoreJson({ progress: serializeProgress(progress) })
}

export async function PATCH(request: NextRequest) {
  const context = await onboardingContext()
  if ('error' in context) return noStoreJson({ error: context.error }, { status: context.status })

  const body = await request.json().catch(() => null)
  const requestResult = onboardingSaveRequestSchema.safeParse(body)
  if (!requestResult.success || !isOnboardingStep(requestResult.data.step)) {
    return noStoreJson({ error: 'invalid_onboarding_request' }, { status: 400 })
  }

  const payloadResult = validateOnboardingStep(requestResult.data.step, requestResult.data.payload)
  if (!payloadResult.success) {
    return noStoreJson({
      error: 'invalid_onboarding_step_data',
      fields: payloadResult.error.issues.map((issue) => ({ path: issue.path.join('.'), code: issue.code })),
    }, { status: 422 })
  }

  const { data, error } = await context.supabase.rpc('save_clinic_onboarding_step', {
    p_progress_id: requestResult.data.progressId,
    p_step: requestResult.data.step,
    p_payload: payloadResult.data,
  })

  const progress = firstProgress(data)
  if (error || !progress) return rpcError(error?.message ?? 'onboarding_unavailable')
  return noStoreJson({ progress: serializeProgress(progress) })
}

export async function DELETE(request: NextRequest) {
  const context = await onboardingContext()
  if ('error' in context) return noStoreJson({ error: context.error }, { status: context.status })

  const body = await request.json().catch(() => null)
  const requestResult = onboardingCancelRequestSchema.safeParse(body)
  if (!requestResult.success) return noStoreJson({ error: 'invalid_onboarding_request' }, { status: 400 })

  const { data, error } = await context.supabase.rpc('cancel_clinic_onboarding', {
    p_progress_id: requestResult.data.progressId,
  })

  const progress = firstProgress(data)
  if (error || !progress) return rpcError(error?.message ?? 'onboarding_unavailable')
  return noStoreJson({ progress: serializeProgress(progress) })
}

export async function PUT(request: NextRequest) {
  const context = await onboardingContext({ allowActiveMembership: true })
  if ('error' in context) return noStoreJson({ error: context.error }, { status: context.status })

  const body = await request.json().catch(() => null)
  const requestResult = onboardingCompleteRequestSchema.safeParse(body)
  if (!requestResult.success) return noStoreJson({ error: 'invalid_onboarding_request' }, { status: 400 })

  const { data, error } = await context.supabase.rpc('complete_clinic_onboarding', {
    p_progress_id: requestResult.data.progressId,
  })

  const completion = firstProgress(data) as unknown as OnboardingCompletionRow | null
  if (error || !completion?.membership_id) return rpcError(error?.message ?? 'onboarding_unavailable')

  const response = noStoreJson({
    completion: {
      clinicId: completion.clinic_id,
      unitId: completion.unit_id,
      membershipId: completion.membership_id,
    },
    redirectTo: '/dashboard',
  })
  response.cookies.set(ACTIVE_MEMBERSHIP_COOKIE, completion.membership_id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  })
  return response
}
