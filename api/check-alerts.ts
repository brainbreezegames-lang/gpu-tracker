// Vercel Edge Function — GET /api/check-alerts
// Called by GitHub Actions cron (daily at 6 AM UTC).
// Scans all stored alerts in Vercel KV, checks current GPU prices,
// and fires emails via Resend for any triggered conditions.
//
// Required env vars:
//   RESEND_API_KEY
//   KV_REST_API_URL
//   KV_REST_API_TOKEN
//   GPU_DATA_URL  (default: https://gpu-tracker.dev/gpu-data.json)

export const config = { runtime: 'edge' };

interface StoredAlert {
  email: string;
  alertType: 'price-drop' | 'availability' | 'new-low' | 'back-in-stock';
  model: string;
  provider: string;
  targetPrice: number | null;
  conditions: {
    maxPrice?: number;
    minVram?: number;
    onlyStable?: boolean;
  };
  createdAt: string;
  lastTriggered?: string;
}

interface GPUInstance {
  model: string;
  provider: string;
  pricePerHour: number;
  availability: string;
  commitment: string;
  vram: number;
  link: string;
}

async function getAlerts(kvUrl: string, kvToken: string): Promise<{ key: string; alert: StoredAlert }[]> {
  // Scan all keys matching alert:*
  const res = await fetch(`${kvUrl}/scan/0?match=alert:*&count=1000`, {
    headers: { Authorization: `Bearer ${kvToken}` },
  });
  if (!res.ok) return [];

  const { result } = await res.json() as { result: [string, string[]] };
  const keys: string[] = result[1] ?? [];

  // Fetch all alert values in parallel
  const entries = await Promise.all(
    keys.map(async (key) => {
      const r = await fetch(`${kvUrl}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${kvToken}` },
      });
      if (!r.ok) return null;
      const { result: val } = await r.json() as { result: string };
      try {
        return { key, alert: JSON.parse(val) as StoredAlert };
      } catch {
        return null;
      }
    })
  );

  return entries.filter(Boolean) as { key: string; alert: StoredAlert }[];
}

async function getCurrentPrices(gpuDataUrl: string): Promise<GPUInstance[]> {
  const res = await fetch(gpuDataUrl);
  if (!res.ok) throw new Error('Failed to fetch GPU data');
  return res.json();
}

function checkAlert(alert: StoredAlert, instances: GPUInstance[]): GPUInstance | null {
  const relevant = instances.filter(inst => {
    if (alert.model && alert.model !== 'any' && inst.model !== alert.model) return false;
    if (alert.provider && alert.provider !== 'any' && inst.provider !== alert.provider) return false;
    if (alert.conditions?.maxPrice && inst.pricePerHour > alert.conditions.maxPrice) return false;
    if (alert.conditions?.minVram && inst.vram < alert.conditions.minVram) return false;
    if (alert.conditions?.onlyStable && inst.commitment === 'Spot') return false;
    return true;
  });

  if (!relevant.length) return null;

  const cheapest = relevant.sort((a, b) => a.pricePerHour - b.pricePerHour)[0];

  switch (alert.alertType) {
    case 'price-drop':
      if (alert.targetPrice && cheapest.pricePerHour <= alert.targetPrice) return cheapest;
      break;
    case 'new-low':
      // Always trigger once per day for new-low (let the cron cadence control frequency)
      if (cheapest.pricePerHour <= (alert.targetPrice ?? Infinity)) return cheapest;
      break;
    case 'availability':
    case 'back-in-stock':
      if (cheapest.availability === 'High' || cheapest.availability === 'Medium') return cheapest;
      break;
  }
  return null;
}

async function sendAlertEmail(alert: StoredAlert, instance: GPUInstance, apiKey: string): Promise<void> {
  const model    = alert.model && alert.model !== 'any' ? alert.model : instance.model;
  const provider = instance.provider;
  const price    = instance.pricePerHour;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'GPU Tracker <alerts@gpu-tracker.dev>',
      to:      [alert.email],
      subject: `🟢 Alert triggered: ${model} at $${price.toFixed(4)}/hr — ${provider}`,
      html: `
        <div style="font-family:monospace;background:#060810;color:#e2e8f0;padding:32px;border-radius:12px;max-width:500px;">
          <div style="color:#a3e635;font-size:20px;font-weight:bold;margin-bottom:4px;">Price Alert Triggered ✓</div>
          <p style="color:#94a3b8;font-size:13px;margin:0 0 20px;">
            Your alert condition for <strong style="color:white">${model}</strong> has been met.
          </p>

          <div style="background:#0f1629;border:1px solid #1e2d4a;border-radius:8px;padding:20px;margin-bottom:20px;">
            <div style="font-size:28px;font-weight:bold;color:#a3e635;margin-bottom:4px;">
              $${price.toFixed(4)}/hr
            </div>
            <div style="color:#94a3b8;font-size:12px;margin-bottom:16px;">${provider} · ${instance.commitment}</div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
              <div><span style="color:#64748b">Model</span><br><span style="color:white">${instance.model}</span></div>
              <div><span style="color:#64748b">Provider</span><br><span style="color:white">${provider}</span></div>
              <div><span style="color:#64748b">VRAM</span><br><span style="color:white">${instance.vram}GB</span></div>
              <div><span style="color:#64748b">Availability</span><br><span style="color:white">${instance.availability}</span></div>
            </div>
          </div>

          <a href="${instance.link}"
             style="display:block;text-align:center;background:#a3e635;color:#0c0b07;font-weight:bold;
                    padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;margin-bottom:16px;">
            Rent This GPU Now →
          </a>

          <a href="https://gpu-tracker.dev/gpu/${model.toLowerCase().replace(/\s+/g,'-')}"
             style="display:block;text-align:center;color:#64748b;font-size:12px;text-decoration:none;margin-bottom:16px;">
            Compare all ${model} prices →
          </a>

          <p style="color:#475569;font-size:11px;margin:0;">
            You set this alert on ${new Date(alert.createdAt).toLocaleDateString()}.
            Reply "unsubscribe" to stop alerts.
          </p>
        </div>
      `,
    }),
  });
}

async function markTriggered(kvUrl: string, kvToken: string, key: string, alert: StoredAlert): Promise<void> {
  const updated = { ...alert, lastTriggered: new Date().toISOString() };
  await fetch(`${kvUrl}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  });
}

export default async function handler(req: Request): Promise<Response> {
  // Only allow GET (called by cron)
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  const resendKey = process.env.RESEND_API_KEY;
  const gpuDataUrl = process.env.GPU_DATA_URL || 'https://gpu-tracker.dev/gpu-data.json';

  if (!kvUrl || !kvToken || !resendKey) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500 });
  }

  try {
    const [alerts, instances] = await Promise.all([
      getAlerts(kvUrl, kvToken),
      getCurrentPrices(gpuDataUrl),
    ]);

    let triggered = 0;
    let skipped   = 0;

    for (const { key, alert } of alerts) {
      // Skip if triggered in the last 23 hours (prevent duplicate daily emails)
      if (alert.lastTriggered) {
        const lastMs = Date.now() - new Date(alert.lastTriggered).getTime();
        if (lastMs < 23 * 60 * 60 * 1000) { skipped++; continue; }
      }

      const match = checkAlert(alert, instances);
      if (match) {
        await sendAlertEmail(alert, match, resendKey);
        await markTriggered(kvUrl, kvToken, key, alert);
        triggered++;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        checked: alerts.length,
        triggered,
        skipped,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
