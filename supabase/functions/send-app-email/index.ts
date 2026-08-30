import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { EmailAPIError } from 'npm:@lovable.dev/email-js@0.1.0'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// App email sender. Renders a registered template and sends it through
// Lovable's managed email API. Delivery, retries, rate limits, suppression and
// unsubscribe handling are enforced by Lovable server-side.
//
// Auth note: verify_jwt = true in config.toml, so the gateway validates the
// caller's JWT before the request reaches this code. The anon key is public,
// so we additionally constrain WHO can send WHAT below.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let templateName: string
  let recipientEmail: string
  let idempotencyKey: string
  let messageId: string
  let templateData: Record<string, any> = {}
  let diagnostics: Record<string, any> = {}
  try {
    const body = await req.json()
    templateName = body.templateName || body.template_name
    recipientEmail = body.recipientEmail || body.recipient_email
    messageId = crypto.randomUUID()
    idempotencyKey = body.idempotencyKey || body.idempotency_key || messageId
    if (body.templateData && typeof body.templateData === 'object') {
      templateData = body.templateData
    }
    if (body.diagnostics && typeof body.diagnostics === 'object') {
      diagnostics = body.diagnostics
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Structured diagnostic logger — single JSON line per event.
  // Search Edge Function logs for: [welcome-email] or [txn-email]
  const diagTag = templateName === 'welcome' ? '[welcome-email]' : '[txn-email]'
  const maskEmail = (e: string) => (!e ? '' : e.replace(/(^.).*(@.*$)/, '$1***$2'))
  const logDiag = (
    phase: string,
    extra: Record<string, unknown> = {},
    isError = false,
  ) => {
    const entry = {
      tag: diagTag,
      phase,
      templateName,
      messageId,
      idempotencyKey,
      recipient: maskEmail(recipientEmail || ''),
      userId: diagnostics.userId ?? null,
      provider: diagnostics.provider ?? null,
      attempt: diagnostics.attempt ?? null,
      ts: new Date().toISOString(),
      ...extra,
    }
    const line = JSON.stringify(entry)
    if (isError) console.error(line)
    else console.log(line)
  }
  logDiag('received')

  // ---------------------------------------------------------------------------
  // Authorization
  //   * service_role tokens: unrestricted (other edge functions / cron)
  //   * admin users: unrestricted (AdminMembers, AdminCircle UI)
  //   * regular authenticated users: a small allowlist of self-addressed
  //     templates, and the recipient MUST match their own auth email
  //   * anon / no token: rejected
  // ---------------------------------------------------------------------------
  const SELF_TEMPLATES = new Set(['welcome', 'event-registration-confirmation'])

  const authHeader = req.headers.get('Authorization') ?? ''
  const callerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

  function decodeJwtClaims(jwt: string): Record<string, unknown> | null {
    try {
      const parts = jwt.split('.')
      if (parts.length < 2) return null
      let p = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      while (p.length % 4) p += '='
      return JSON.parse(atob(p))
    } catch {
      return null
    }
  }

  const claims = decodeJwtClaims(callerToken) as
    | { role?: string; sub?: string; email?: string }
    | null
  const callerRole = claims?.role ?? 'anon'
  const callerSub = (claims?.sub as string | undefined) ?? null
  const callerEmail = ((claims?.email as string | undefined) ?? '').toLowerCase()

  const serviceRoleSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const isServiceRole =
    callerRole === 'service_role' ||
    (serviceRoleSecret !== '' && callerToken === serviceRoleSecret)

  if (!isServiceRole && (!claims || callerRole === 'anon')) {
    logDiag('error_unauthorized', { reason: 'anon_or_no_jwt' }, true)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  let callerIsAdmin = false
  if (!isServiceRole && callerSub) {
    try {
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: callerSub,
        _role: 'admin',
      })
      callerIsAdmin = !!isAdmin
    } catch (e) {
      console.error('[txn-email] has_role check failed', e)
    }
  }

  if (!templateName) {
    return new Response(JSON.stringify({ error: 'templateName is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const template = TEMPLATES[templateName]
  if (!template) {
    logDiag('error_template_not_found', { available: Object.keys(TEMPLATES) }, true)
    return new Response(
      JSON.stringify({
        error: `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`,
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // Template-level `to` takes precedence over the caller-provided recipient.
  const effectiveRecipient = template.to || recipientEmail

  if (!effectiveRecipient) {
    logDiag('error_missing_recipient', {}, true)
    return new Response(
      JSON.stringify({
        error: 'recipientEmail is required (unless the template defines a fixed recipient)',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  if (!isServiceRole && !callerIsAdmin) {
    if (!SELF_TEMPLATES.has(templateName)) {
      logDiag('error_forbidden_template', { templateName, callerRole }, true)
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!callerEmail || effectiveRecipient.toLowerCase() !== callerEmail) {
      logDiag('error_recipient_mismatch', { templateName }, true)
      return new Response(
        JSON.stringify({ error: 'Forbidden: recipient must match authenticated user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
  }

  const logSend = async (
    status: 'sent' | 'suppressed' | 'failed',
    errorMessage?: string,
  ) => {
    const { error } = await supabase.from('email_send_log').insert({
      message_id: null,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status,
      error_message: errorMessage ?? null,
    })
    if (error) {
      console.error('[txn-email] email_send_log insert failed', {
        code: error.code,
        message: error.message,
        status,
      })
    }
  }

  try {
    const result = await sendTemplateEmail(templateName, effectiveRecipient, {
      templateData,
      idempotencyKey,
    })

    if (!result.sent) {
      await logSend('suppressed')
      logDiag('suppressed')
      return new Response(
        JSON.stringify({ success: false, reason: 'email_suppressed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    await logSend('sent')
    logDiag('sent')
    return new Response(JSON.stringify({ success: true, sent: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = (error as Error)?.message ?? 'Unknown error'
    const code = error instanceof EmailAPIError ? error.code : undefined
    const status = error instanceof EmailAPIError ? error.status : undefined
    await logSend('failed', message)
    logDiag('error_send', { code, status, message }, true)

    if (error instanceof EmailAPIError && error.status === 429) {
      return new Response(
        JSON.stringify({
          error: 'Rate limited',
          retry_after_seconds: error.retryAfterSeconds ?? 60,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(error.retryAfterSeconds ?? 60),
          },
        },
      )
    }

    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
