// Vercel Edge Function — POST /api/subscribe
// Env vars needed (set in Vercel dashboard):
//   RESEND_API_KEY   — https://resend.com  (get one free, 100 emails/day)
//   KV_REST_API_URL  — Vercel KV store URL
//   KV_REST_API_TOKEN — Vercel KV store token

export const config = { runtime: 'edge' };

interface AlertConditions {
  models?: string[];
  providers?: string[];
  minVram?: number;
  maxPrice?: number;
  onlyStable?: boolean;
  onlyHighAvail?: boolean;
}

interface SubscribeBody {
  email: string;
  alertType: 'price-drop' | 'availability' | 'new-low' | 'back-in-stock';
  model?: string;
  provider?: string;
  targetPrice?: number | null;
  conditions?: AlertConditions;
}

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function formatConditions(conditions?: AlertConditions): string {
  if (!conditions) return '';
  const parts: string[] = [];
  if (conditions.maxPrice) parts.push(`price ≤ $${conditions.maxPrice}/hr`);
  if (conditions.onlyStable) parts.push('stable providers only');
  if (conditions.onlyHighAvail) parts.push('in-stock only');
  if (conditions.minVram) parts.push(`≥${conditions.minVram}GB VRAM`);
  if (conditions.models?.length) parts.push(`models: ${conditions.models.join(', ')}`);
  if (conditions.providers?.length) parts.push(`providers: ${conditions.providers.join(', ')}`);
  return parts.join(' · ');
}

async function storeInKV(data: SubscribeBody & { createdAt: string }): Promise<void> {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return; // KV not configured — skip silently

  const key = `alert:${data.email}:${data.alertType}:${data.model ?? 'any'}:${Date.now()}`;
  await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  'price-drop':    'Price Drop',
  'availability':  'Availability Change',
  'new-low':       'New 30-Day Low',
  'back-in-stock': 'Back in Stock',
};

async function sendConfirmationEmail(data: SubscribeBody): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // Resend not configured — skip silently

  const modelStr    = data.model && data.model !== 'any' ? data.model : 'any GPU';
  const providerStr = data.provider && data.provider !== 'any' ? ` on ${data.provider}` : '';
  const priceStr    = data.targetPrice ? ` below $${data.targetPrice}/hr` : '';
  const typeLabel   = ALERT_TYPE_LABELS[data.alertType] || data.alertType;
  const condStr     = formatConditions(data.conditions);

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    'GPU Tracker <alerts@gpu-tracker.dev>',
      to:      [data.email],
      subject: `Alert set: ${typeLabel} — ${modelStr}${providerStr}${priceStr}`,
      html: `
        <div style="font-family: monospace; background: #060810; color: #e2e8f0; padding: 32px; border-radius: 12px; max-width: 480px;">
          <div style="color: #a3e635; font-size: 18px; font-weight: bold; margin-bottom: 8px;">GPU Tracker Alert Set ✓</div>
          <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px;">
            You'll be notified when <strong style="color: white;">${modelStr}${providerStr}</strong>
            ${priceStr ? `drops <strong style="color: #a3e635;">${priceStr}</strong>` : `triggers a <strong style="color: white;">${typeLabel}</strong> alert`}.
          </p>
          <div style="background: #0f1629; border: 1px solid #1e2d4a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">Alert details</div>
            <div>Type: <span style="color: #a3e635;">${typeLabel}</span></div>
            <div>Model: <span style="color: #a3e635;">${modelStr}</span></div>
            ${data.provider && data.provider !== 'any' ? `<div>Provider: <span style="color: white;">${data.provider}</span></div>` : ''}
            ${data.targetPrice ? `<div>Target price: <span style="color: #a3e635;">$${data.targetPrice}/hr</span></div>` : ''}
            ${condStr ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #1e2d4a;">Conditions: <span style="color: #94a3b8;">${condStr}</span></div>` : ''}
          </div>
          <p style="color: #64748b; font-size: 12px;">
            To unsubscribe, reply with "unsubscribe" or visit gpu-tracker.dev/alerts.
          </p>
        </div>
      `,
    }),
  });
}

export default async function handler(req: Request): Promise<Response> {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: SubscribeBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { email, alertType, model, provider, targetPrice, conditions } = body;

  if (!email || !isValidEmail(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email address' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!alertType) {
    return new Response(JSON.stringify({ error: 'alertType is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const record: SubscribeBody & { createdAt: string } = {
    email, alertType,
    model:       model    ?? 'any',
    provider:    provider ?? 'any',
    targetPrice: targetPrice ?? null,
    conditions:  conditions ?? {},
    createdAt: new Date().toISOString(),
  };

  // Fire-and-forget storage + email (don't block on failures)
  await Promise.allSettled([
    storeInKV(record),
    sendConfirmationEmail(record),
  ]);

  return new Response(
    JSON.stringify({ ok: true, message: 'Alert registered. Check your email for confirmation.' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
}
