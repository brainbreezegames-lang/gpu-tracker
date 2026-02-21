/**
 * Affiliate link builder.
 * Appends your referral code to provider URLs before they go live.
 *
 * ── How to use ───────────────────────────────────────────────────────────────
 * 1. Apply to each provider's affiliate program (links below).
 * 2. Paste your ref code into AFFILIATE_CODES below.
 * 3. Every "Reserve" click across the whole site is now an affiliate click.
 *
 * ── Apply here ───────────────────────────────────────────────────────────────
 * RunPod:       https://www.runpod.io/affiliate
 * Vast.ai:      https://vast.ai/affiliate  (contact: affiliates@vast.ai)
 * Lambda Labs:  https://lambdalabs.com/refer
 * CoreWeave:    https://www.coreweave.com/contact  (partner inquiry)
 * TensorDock:   https://www.tensordock.com/affiliate
 * Vultr:        https://www.vultr.com/promo/  (refer-a-friend program)
 * DigitalOcean: https://www.digitalocean.com/referral
 * Nebius:       https://nebius.com/partners
 *
 * ── Rev share rates (typical) ────────────────────────────────────────────────
 * RunPod:       10-20% of referred user's spend for 12 months
 * Vast.ai:      10% of referrals' credits
 * Lambda Labs:  $10 credit per referral
 * DigitalOcean: $25 credit + $25 for you
 */

// ── YOUR AFFILIATE CODES (fill these in after approval) ─────────────────────
const AFFILIATE_CODES: Record<string, string> = {
  'RunPod':        '',   // e.g. 'abc123' → appended as ?ref=abc123
  'Vast.ai':       '',   // e.g. 'your_ref'
  'Lambda Labs':   '',
  'TensorDock':    '',
  'Vultr':         '',
  'DigitalOcean':  '',
  'CoreWeave':     '',
  'Nebius':        '',
  'FluidStack':    '',
  'Cudo Compute':  '',
  'Scaleway':      '',
  'Hyperstack':    '',
  'Genesis Cloud': '',
  'OVHcloud':      '',
  'Crusoe':        '',
  'Latitude.sh':   '',
};

// ── URL patterns for each provider ──────────────────────────────────────────
const AFFILIATE_URL_BUILDERS: Record<string, (base: string, code: string) => string> = {
  'RunPod':       (url, code) => `https://runpod.io/console/gpu-cloud?ref=${code}`,
  'Vast.ai':      (url, code) => `https://cloud.vast.ai/?ref_id=${code}`,
  'Lambda Labs':  (url, code) => appendParam(url, 'ref', code),
  'TensorDock':   (url, code) => appendParam(url, 'ref', code),
  'Vultr':        (url, code) => `https://www.vultr.com/?ref=${code}`,
  'DigitalOcean': (url, code) => `https://m.do.co/${code}`,
  'CoreWeave':    (url, code) => appendParam(url, 'partner', code),
  'Nebius':       (url, code) => appendParam(url, 'ref', code),
  'FluidStack':   (url, code) => appendParam(url, 'ref', code),
  'Cudo Compute': (url, code) => appendParam(url, 'ref', code),
};

function appendParam(url: string, param: string, value: string): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${param}=${encodeURIComponent(value)}`;
}

/**
 * Returns the affiliate URL for a provider, or falls back to the original
 * link if no code is configured yet.
 */
export function affiliateLink(provider: string, originalLink: string): string {
  const code = AFFILIATE_CODES[provider];
  if (!code) return originalLink;  // No code yet → use original

  const builder = AFFILIATE_URL_BUILDERS[provider];
  if (!builder) return appendParam(originalLink, 'ref', code);

  return builder(originalLink, code);
}

/**
 * Returns true if this provider has an affiliate code configured.
 * Used to show a "commission tracked" indicator.
 */
export function hasAffiliateCode(provider: string): boolean {
  return !!AFFILIATE_CODES[provider];
}
