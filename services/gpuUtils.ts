import { Commitment, FilterState, GPUInstance } from '../types';

// ── GPU Performance (TFLOPS) ──────────────────────────────────────────────────
const GPU_TFLOPS_TABLE: [RegExp, number][] = [
  [/B200/i,            4500],
  [/H200/i,            1979],
  [/H100.*SXM/i,       1979],
  [/H100.*NVL/i,       1979],
  [/H100/i,             989],
  [/A100.*80/i,         312],
  [/A100/i,             312],
  [/L40S/i,             362],
  [/L40(?!S)/i,         181],
  [/L4\b/i,             121],
  [/A10G/i,             125],
  [/A10\b/i,            125],
  [/A30\b/i,            165],
  [/V100/i,              62],
  [/T4\b/i,              65],
  [/RTX[\s_-]?4090/i,   330],
  [/RTX[\s_-]?4080/i,   242],
  [/RTX[\s_-]?4070/i,   165],
  [/RTX[\s_-]?3090/i,   142],
  [/RTX[\s_-]?3080/i,   119],
  [/RTX[\s_-]?3070/i,    90],
  [/RTX[\s_-]?3060/i,    51],
  [/A6000/i,            155],
  [/A5000/i,            111],
  [/A4000/i,             77],
  [/A40\b/i,            150],
  [/P100/i,              18],
  [/K80/i,                6],
];

export function getGPUTFLOPS(model: string): number {
  for (const [re, v] of GPU_TFLOPS_TABLE) if (re.test(model)) return v;
  return 0;
}

export function inferenceTokensPerSec(gpuModel: string, paramsB: number, gpuCount = 1): number {
  const t = getGPUTFLOPS(gpuModel);
  if (!t || !paramsB) return 0;
  return (t * gpuCount * 1e12 * 0.30) / (2 * paramsB * 1e9);
}

export function costPer1MTokens(pricePerHour: number, tps: number): number | null {
  if (!tps || !pricePerHour) return null;
  return (pricePerHour / (tps * 3600)) * 1_000_000;
}

export function vramRequiredGBFP16(paramsB: number): number {
  return paramsB * 2;
}

// ── Provider Trust ────────────────────────────────────────────────────────────
export type TrustTier = 'Enterprise' | 'Established' | 'Marketplace' | 'Emerging';

export interface TrustInfo {
  tier: TrustTier;
  score: number;
  note: string;
}

const TRUST_MAP: Record<string, TrustInfo> = {
  'AWS':          { tier: 'Enterprise',  score: 5, note: 'SLA-backed, global compliance, enterprise support'          },
  'Azure':        { tier: 'Enterprise',  score: 5, note: 'SLA-backed, global compliance, enterprise support'          },
  'GCP':          { tier: 'Enterprise',  score: 5, note: 'SLA-backed, global compliance, enterprise support'          },
  'OCI':          { tier: 'Enterprise',  score: 4, note: 'Oracle Cloud — enterprise SLA, bare metal options'           },
  'Lambda Labs':  { tier: 'Established', score: 4, note: 'ML-focused, reliable on-demand, no spot risk'               },
  'RunPod':       { tier: 'Established', score: 3, note: 'ML-native, wide GPU selection, spot + reserved'             },
  'Nebius':       { tier: 'Established', score: 3, note: 'Yandex Cloud spinoff, EU data centers'                      },
  'Vultr':        { tier: 'Established', score: 3, note: 'General cloud with GPU add-on, global regions'              },
  'Vast.ai':      { tier: 'Marketplace', score: 2, note: 'P2P marketplace — cheap but variable reliability'           },
  'TensorDock':   { tier: 'Marketplace', score: 2, note: 'Marketplace GPUs — flexible configs, variable reliability'  },
  'Cudo Compute': { tier: 'Emerging',    score: 2, note: 'Decentralized compute, newer provider'                      },
  'DigitalOcean': { tier: 'Established', score: 3, note: 'Major cloud provider, GPU Droplets with H100s'              },
  'HotAisle':     { tier: 'Emerging',    score: 2, note: 'GPU cloud, smaller provider'                                },
  'CloudRift':    { tier: 'Emerging',    score: 2, note: 'Specialized GPU cloud, newer provider'                      },
  'Verda':        { tier: 'Emerging',    score: 2, note: 'GPU cloud, newer provider'                                  },
};

export function getProviderTrust(provider: string): TrustInfo {
  return TRUST_MAP[provider] ?? { tier: 'Emerging', score: 2, note: 'Newer or specialized provider' };
}

export const TRUST_TIER_STYLE: Record<TrustTier, string> = {
  'Enterprise':  'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  'Established': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'Marketplace': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'Emerging':    'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

// ── Provider Billing / True Monthly Cost ──────────────────────────────────────

export interface ProviderBillingInfo {
  diskType: string;
  storageCostPerGBMonth: number | null; // null = bundled or unknown
  billedWhenStopped: boolean;
  persistentDisk: boolean;
  egressCostPerGB: number;              // 0 = free
  networkBandwidthGbps: number | null;  // null = unknown
  complianceClaims: string[];
  storageWarning: string;
  billingNote: string;
}

const PROVIDER_BILLING: Record<string, ProviderBillingInfo> = {
  'AWS': {
    diskType: 'EBS (Persistent) / Local NVMe',
    storageCostPerGBMonth: 0.08,
    billedWhenStopped: false,
    persistentDisk: true,
    egressCostPerGB: 0.09,
    networkBandwidthGbps: 25,
    complianceClaims: ['SOC 2', 'ISO 27001', 'HIPAA', 'PCI-DSS'],
    storageWarning: '',
    billingNote: 'Stop instance to pause GPU cost. EBS volumes billed separately (~$0.08/GB/mo).',
  },
  'Azure': {
    diskType: 'Managed Disk / Local NVMe',
    storageCostPerGBMonth: 0.05,
    billedWhenStopped: false,
    persistentDisk: true,
    egressCostPerGB: 0.087,
    networkBandwidthGbps: 40,
    complianceClaims: ['SOC 2', 'ISO 27001', 'HIPAA', 'FedRAMP'],
    storageWarning: '',
    billingNote: 'Deallocate VM to stop GPU billing. Disk storage billed separately.',
  },
  'GCP': {
    diskType: 'Persistent Disk / Local SSD (ephemeral)',
    storageCostPerGBMonth: 0.04,
    billedWhenStopped: false,
    persistentDisk: true,
    egressCostPerGB: 0.08,
    networkBandwidthGbps: 50,
    complianceClaims: ['SOC 2', 'ISO 27001', 'HIPAA'],
    storageWarning: 'Local SSD is ephemeral — data lost when instance stops.',
    billingNote: 'Stop instance to pause GPU billing. Persistent disk billed separately.',
  },
  'OCI': {
    diskType: 'Block Volume',
    storageCostPerGBMonth: 0.0255,
    billedWhenStopped: false,
    persistentDisk: true,
    egressCostPerGB: 0.009,
    networkBandwidthGbps: 50,
    complianceClaims: ['SOC 2', 'ISO 27001', 'HIPAA'],
    storageWarning: '',
    billingNote: 'Very cheap egress ($0.009/GB). Stop instance to pause GPU billing.',
  },
  'Lambda Labs': {
    diskType: 'SSD (persistent, included)',
    storageCostPerGBMonth: 0,
    billedWhenStopped: true,
    persistentDisk: true,
    egressCostPerGB: 0,
    networkBandwidthGbps: 10,
    complianceClaims: [],
    storageWarning: '',
    billingNote: 'Reserved instances billed continuously. On-demand billed per hour. Disk and egress included.',
  },
  'RunPod': {
    diskType: 'Network Volume (optional, $0.07/GB/mo)',
    storageCostPerGBMonth: 0.07,
    billedWhenStopped: false,
    persistentDisk: false,
    egressCostPerGB: 0.10,
    networkBandwidthGbps: 10,
    complianceClaims: [],
    storageWarning: 'Local disk is EPHEMERAL — buy a Network Volume to keep data between runs.',
    billingNote: 'GPU not billed when stopped. Network Volume billed separately. Spot pods can be interrupted.',
  },
  'Vast.ai': {
    diskType: 'Local disk (ephemeral)',
    storageCostPerGBMonth: 0,
    billedWhenStopped: true,
    persistentDisk: false,
    egressCostPerGB: 0,
    networkBandwidthGbps: null,
    complianceClaims: [],
    storageWarning: 'Disk is EPHEMERAL and host-specific — all data lost when instance ends.',
    billingNote: 'Billed while running. Bandwidth varies by host (typically 1–10 Gbps). No persistent disk.',
  },
  'Vultr': {
    diskType: 'Local SSD / Block Storage',
    storageCostPerGBMonth: 0.06,
    billedWhenStopped: false,
    persistentDisk: true,
    egressCostPerGB: 0.01,
    networkBandwidthGbps: 10,
    complianceClaims: [],
    storageWarning: '',
    billingNote: 'Power off instance to stop GPU billing. Cheap egress.',
  },
  'Nebius': {
    diskType: 'Network Disk',
    storageCostPerGBMonth: 0.04,
    billedWhenStopped: false,
    persistentDisk: true,
    egressCostPerGB: 0.01,
    networkBandwidthGbps: 10,
    complianceClaims: [],
    storageWarning: '',
    billingNote: 'EU-focused. Stop instance to pause billing.',
  },
  'Cudo Compute': {
    diskType: 'Network Storage',
    storageCostPerGBMonth: 0.07,
    billedWhenStopped: false,
    persistentDisk: true,
    egressCostPerGB: 0.05,
    networkBandwidthGbps: null,
    complianceClaims: [],
    storageWarning: 'Bandwidth and uptime may vary — decentralized infrastructure.',
    billingNote: 'Newer provider. Verify billing semantics before long jobs.',
  },
  'TensorDock': {
    diskType: 'Local SSD (ephemeral)',
    storageCostPerGBMonth: 0,
    billedWhenStopped: false,
    persistentDisk: false,
    egressCostPerGB: 0,
    networkBandwidthGbps: null,
    complianceClaims: [],
    storageWarning: 'Marketplace hosts — disk is ephemeral, reliability varies.',
    billingNote: 'Billed per hour. Marketplace — verify host details before long jobs.',
  },
  'DigitalOcean': {
    diskType: 'NVMe SSD',
    storageCostPerGBMonth: 0.10,
    billedWhenStopped: false,
    persistentDisk: true,
    egressCostPerGB: 0.01,
    networkBandwidthGbps: 10,
    complianceClaims: ['SOC 2', 'ISO 27001'],
    storageWarning: '',
    billingNote: 'GPU Droplets. Power off to stop billing. Volume storage billed separately.',
  },
  'HotAisle': {
    diskType: 'SSD (details limited)',
    storageCostPerGBMonth: null,
    billedWhenStopped: false,
    persistentDisk: true,
    egressCostPerGB: 0,
    networkBandwidthGbps: null,
    complianceClaims: [],
    storageWarning: 'Smaller provider — verify billing details before committing.',
    billingNote: 'Newer provider. Check docs for storage and billing details.',
  },
  'CloudRift': {
    diskType: 'SSD (details limited)',
    storageCostPerGBMonth: null,
    billedWhenStopped: false,
    persistentDisk: true,
    egressCostPerGB: 0,
    networkBandwidthGbps: null,
    complianceClaims: [],
    storageWarning: 'Limited public info on billing semantics — verify before committing.',
    billingNote: 'Newer provider. Check docs for storage and billing details.',
  },
  'Verda': {
    diskType: 'SSD (details limited)',
    storageCostPerGBMonth: null,
    billedWhenStopped: false,
    persistentDisk: true,
    egressCostPerGB: 0,
    networkBandwidthGbps: null,
    complianceClaims: [],
    storageWarning: 'Limited public info on billing semantics — verify before committing.',
    billingNote: 'Newer provider. Check docs for storage and billing details.',
  },
};

export function getProviderBilling(provider: string): ProviderBillingInfo {
  return PROVIDER_BILLING[provider] ?? {
    diskType: 'Unknown',
    storageCostPerGBMonth: null,
    billedWhenStopped: false,
    persistentDisk: false,
    egressCostPerGB: 0,
    networkBandwidthGbps: null,
    complianceClaims: [],
    storageWarning: 'Billing details not available — verify with provider.',
    billingNote: 'No billing data available for this provider.',
  };
}

// ── Per-item computation caches ───────────────────────────────────────────────
// Keyed by item.id — valid for the lifetime of the loaded dataset.
// These are module-level so they persist across re-renders but reset on page reload.
const _continuityCache    = new Map<string, number>();
const _valueScoreCache    = new Map<string, ValueScoreResult>();
const _predictableCache   = new Map<string, number>();
const _frictionCache      = new Map<string, number>();

// ── Continuity Score ──────────────────────────────────────────────────────────
// Score 0–100: probability of job completion without unexpected interruption.

export function getContinuityScore(item: GPUInstance): number {
  const cached = _continuityCache.get(item.id);
  if (cached !== undefined) return cached;
  const trust  = getProviderTrust(item.provider);
  const isSpot = item.commitment === Commitment.Spot;

  const tierBase: Record<TrustTier, number> = {
    Enterprise:  100,
    Established: 80,
    Marketplace: 50,
    Emerging:    55,
  };

  let score = tierBase[trust.tier];
  if (isSpot)                             score -= 35;
  if (item.availability === 'High')       score += 5;
  if (item.availability === 'Low')        score -= 10;
  if (item.availability === 'Out of Stock') score = 0;

  const result = Math.max(0, Math.min(100, score));
  _continuityCache.set(item.id, result);
  return result;
}

export interface ContinuityLabel {
  label: string;
  color: string;         // Tailwind text color classes
  bg: string;            // Tailwind bg + text classes
  dot: string;           // dot color class
  risk: 'low' | 'medium' | 'high';
}

export function getContinuityLabel(score: number): ContinuityLabel {
  if (score >= 75) return {
    label: 'Reliable',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    dot:   'bg-emerald-500',
    risk:  'low',
  };
  if (score >= 45) return {
    label: 'Caution',
    color: 'text-amber-600 dark:text-amber-400',
    bg:    'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    dot:   'bg-amber-500',
    risk:  'medium',
  };
  return {
    label: 'High Risk',
    color: 'text-red-600 dark:text-red-400',
    bg:    'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    dot:   'bg-red-500',
    risk:  'high',
  };
}

// ── True Monthly Cost ─────────────────────────────────────────────────────────

export interface TMCBreakdown {
  gpuCostMonthly: number;
  storageCostMonthly: number;
  egressCostMonthly: number;
  totalMonthly: number;
  effectiveHourly: number;
}

export function calcTMC(
  item: GPUInstance,
  hoursPerWeek: number,
  storageGB: number,
  egressGBPerMonth: number,
): TMCBreakdown {
  const billing        = getProviderBilling(item.provider);
  const hoursPerMonth  = hoursPerWeek * 4.33;
  const gpuCost        = item.pricePerHour * hoursPerMonth;
  const storageCost    = (billing.storageCostPerGBMonth ?? 0.08) * storageGB;
  const egressCost     = billing.egressCostPerGB * egressGBPerMonth;
  const total          = gpuCost + storageCost + egressCost;

  return {
    gpuCostMonthly:     gpuCost,
    storageCostMonthly: storageCost,
    egressCostMonthly:  egressCost,
    totalMonthly:       total,
    effectiveHourly:    hoursPerMonth > 0 ? total / hoursPerMonth : 0,
  };
}

// ── Bandwidth / Time-to-Hydrate ────────────────────────────────────────────────

export function timeToHydrate(dataGB: number, bandwidthGbps: number | null): string {
  if (!bandwidthGbps) return 'Unknown — check provider docs';
  const gbps       = bandwidthGbps;                   // Gbps (theoretical)
  const effectiveGBps = (gbps * 0.125) * 0.6;        // 60% utilization, convert to GB/s
  const seconds    = dataGB / effectiveGBps;
  if (seconds < 60)    return `~${Math.round(seconds)}s`;
  if (seconds < 3600)  return `~${Math.round(seconds / 60)} min`;
  return `~${(seconds / 3600).toFixed(1)} hrs`;
}

// ── Procurement Friction ──────────────────────────────────────────────────────
// How hard is it to actually get this GPU right now?

export type FrictionLevel = 'Self-serve' | 'Quota May Apply' | 'Waitlist';

export interface FrictionInfo {
  level: FrictionLevel;
  note: string;
  badge: string;  // Tailwind classes
}

// Per-provider base friction
const PROVIDER_FRICTION_BASE: Record<string, FrictionLevel> = {
  'AWS':          'Quota May Apply',
  'Azure':        'Quota May Apply',
  'GCP':          'Quota May Apply',
  'OCI':          'Quota May Apply',
  'Lambda Labs':  'Self-serve',
  'RunPod':       'Self-serve',
  'Vast.ai':      'Self-serve',
  'Vultr':        'Self-serve',
  'Nebius':       'Self-serve',
  'Cudo Compute': 'Self-serve',
  'TensorDock':   'Self-serve',
  'DigitalOcean': 'Self-serve',
  'HotAisle':     'Self-serve',
  'CloudRift':    'Self-serve',
  'Verda':        'Self-serve',
  'CoreWeave':    'Waitlist',
  'FluidStack':   'Self-serve',
};

// GPU models that always require quota on enterprise clouds
const HIGH_DEMAND_MODELS = /H100|H200|A100|B200/i;

export function getProcurementFriction(provider: string, model: string): FrictionInfo {
  const base = PROVIDER_FRICTION_BASE[provider] ?? 'Self-serve';
  const tier = getProviderTrust(provider).tier;

  // Enterprise clouds + high-demand GPU = quota required
  let level: FrictionLevel = base;
  if (tier === 'Enterprise' && HIGH_DEMAND_MODELS.test(model)) level = 'Quota May Apply';
  if (provider === 'CoreWeave') level = 'Waitlist';

  const notes: Record<FrictionLevel, string> = {
    'Self-serve': 'Spin up in minutes — no approval needed.',
    'Quota May Apply': 'Enterprise clouds often require a quota increase request. Can take hours to days.',
    'Waitlist': 'Contact sales or join waitlist — not always instant.',
  };

  const badges: Record<FrictionLevel, string> = {
    'Self-serve':   'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    'Quota May Apply': 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    'Waitlist':     'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  };

  return { level, note: notes[level], badge: badges[level] };
}

// ── Volatility ─────────────────────────────────────────────────────────────────
// Proxy for spot price volatility using availability + commitment data.
// Real volatility requires historical snapshots (coming with price history).

export type VolatilityLevel = 'Stable' | 'Variable' | 'Volatile';

export interface VolatilityInfo {
  level: VolatilityLevel;
  note: string;
  badge: string;
}

export function getVolatilityInfo(item: GPUInstance): VolatilityInfo {
  const isSpot = item.commitment === Commitment.Spot;
  const trust  = getProviderTrust(item.provider);

  let level: VolatilityLevel;
  if (!isSpot) {
    level = 'Stable';
  } else if (trust.tier === 'Marketplace' || trust.tier === 'Emerging') {
    level = 'Volatile';  // P2P/decentralized spot = high churn
  } else {
    level = 'Variable';  // Established provider spot = manageable
  }

  const notes: Record<VolatilityLevel, string> = {
    'Stable':   'On-demand pricing — predictable cost, no interruption risk.',
    'Variable': 'Spot instance — price can change; 2-min warning before termination is common.',
    'Volatile': 'Marketplace spot — host can reclaim without warning; prices fluctuate hourly.',
  };

  const badges: Record<VolatilityLevel, string> = {
    'Stable':   'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    'Variable': 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    'Volatile': 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  };

  return { level, note: notes[level], badge: badges[level] };
}

// ── Ranking / Composite Score ─────────────────────────────────────────────────
// Used by "Predictable" mode to sort rows.

export function getPredictableScore(item: GPUInstance): number {
  // Base = TMC at 40h/week, 100GB storage, 50GB egress (typical)
  const tmc    = calcTMC(item, 40, 100, 50);
  // Risk multiplier: score 100 = 0% penalty, score 0 = 50% penalty
  const risk   = (100 - getContinuityScore(item)) / 200;  // 0.0–0.50
  // Storage trap penalty: billed when stopped adds hidden cost
  const billing = getProviderBilling(item.provider);
  const stopPenalty = billing.billedWhenStopped ? 1.15 : 1.0;

  return tmc.totalMonthly * (1 + risk) * stopPenalty;
}

// Fast-to-Acquire score: lower = faster to get
export function getFrictionScore(item: GPUInstance): number {
  const f = getProcurementFriction(item.provider, item.model);
  const frictionMap: Record<FrictionLevel, number> = {
    'Self-serve':   0,
    'Quota May Apply': 100,
    'Waitlist':     200,
  };
  return frictionMap[f.level] + item.pricePerHour;
}

// ── CSV Export ────────────────────────────────────────────────────────────────

export function exportToCSV(data: GPUInstance[], filename = 'gpu-prices.csv') {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const headers = [
    'Provider', 'Model', 'GPU Count', 'VRAM (GB)', 'Instance Name',
    'CPU Cores', 'RAM (GB)', 'Price/Hr ($)', 'Region', 'Commitment',
    'Availability', 'Continuity Score', 'Value Score (raw)', 'Link',
  ];
  const rows = data.map((d) =>
    [
      d.provider, d.model, d.gpuCount, d.vram, d.instanceName,
      d.cpu, d.ram, d.pricePerHour.toFixed(4),
      d.region, d.commitment, d.availability, getContinuityScore(d),
      getValueScoreRaw(d).raw?.toFixed(2) ?? 'N/A', d.link,
    ].map(escape).join(','),
  );
  const csv  = [headers.map(escape).join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Value Score ──────────────────────────────────────────────────────────────
// Performance per dollar, adjusted for reliability. Higher = better.
// Returns raw ratio; normalization to 0–100 happens in the UI layer (useMemo)
// because it's relative to the current filtered set.

export interface ValueScoreResult {
  raw: number | null;       // null = TFLOPS unknown
  tflops: number;           // 0 if unknown
  hasTflops: boolean;
}

export function getValueScoreRaw(item: GPUInstance): ValueScoreResult {
  const cached = _valueScoreCache.get(item.id);
  if (cached) return cached;
  const tflops = getGPUTFLOPS(item.model);
  if (!tflops || item.pricePerHour <= 0) {
    const miss: ValueScoreResult = { raw: null, tflops: 0, hasTflops: false };
    _valueScoreCache.set(item.id, miss);
    return miss;
  }
  const continuity = getContinuityScore(item);
  const rawValue = (tflops * item.gpuCount) / item.pricePerHour;
  const adjusted = rawValue * (continuity / 100);
  const result: ValueScoreResult = { raw: adjusted, tflops, hasTflops: true };
  _valueScoreCache.set(item.id, result);
  return result;
}

// ── Freshness ────────────────────────────────────────────────────────────────

export type FreshnessLevel = 'live' | 'recent' | 'stale' | 'outdated';

export interface FreshnessInfo {
  level: FreshnessLevel;
  label: string;
  dotColor: string;
  textColor: string;
}

export function getRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getFreshness(isoString: string): FreshnessInfo {
  const diff = Date.now() - new Date(isoString).getTime();
  const hours = diff / 3_600_000;

  if (hours < 1)  return { level: 'live',     label: getRelativeTime(isoString), dotColor: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' };
  if (hours < 6)  return { level: 'recent',   label: getRelativeTime(isoString), dotColor: 'bg-yellow-500',  textColor: 'text-yellow-600 dark:text-yellow-400'  };
  if (hours < 12) return { level: 'stale',    label: getRelativeTime(isoString), dotColor: 'bg-amber-500',   textColor: 'text-amber-600 dark:text-amber-400'    };
  return                  { level: 'outdated', label: getRelativeTime(isoString), dotColor: 'bg-red-500',     textColor: 'text-red-600 dark:text-red-400'        };
}

// ── Shareable URL ─────────────────────────────────────────────────────────────

export function encodeFiltersToHash(filters: FilterState): string {
  return btoa(JSON.stringify({
    s: filters.search, m: filters.models, p: filters.providers,
    r: filters.regions, c: filters.commitment,
    mn: filters.minPrice, mx: filters.maxPrice,
    mv: filters.minVram,  gc: filters.gpuCounts,
  }));
}

export function decodeFiltersFromHash(encoded: string): Partial<FilterState> | null {
  try {
    const d = JSON.parse(atob(encoded));
    return {
      search: d.s ?? '', models: d.m ?? [], providers: d.p ?? [],
      regions: d.r ?? [], commitment: d.c ?? [],
      minPrice: d.mn ?? 0, maxPrice: d.mx ?? 999,
      minVram: d.mv ?? 0,  gpuCounts: d.gc ?? [],
    };
  } catch { return null; }
}
