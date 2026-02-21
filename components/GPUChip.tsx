import React from 'react';

// ── GPU family → visual config ──────────────────────────────────────────────
// Simplified to 5 tiers with consistent gradients. No color noise.
// Tier darkness conveys performance: darker = more powerful.

interface GPUVisual {
  abbr: string;
  bg: string;
  tier: 'flagship' | 'datacenter' | 'consumer' | 'entry' | 'amd';
}

// Tier gradient palette (slate scale + AMD red)
const TIER_BG = {
  flagship:   'from-slate-800 to-slate-900',
  datacenter: 'from-slate-600 to-slate-700',
  consumer:   'from-slate-500 to-slate-600',
  entry:      'from-slate-400 to-slate-500',
  amd:        'from-red-600 to-red-700',
} as const;

function getGPUVisual(model: string): GPUVisual {
  const m = model.toLowerCase();

  // ── Flagship (latest datacenter) ──
  if (/gb200/i.test(m))     return { abbr: 'GB200', bg: TIER_BG.flagship, tier: 'flagship' };
  if (/b300/i.test(m))      return { abbr: 'B300',  bg: TIER_BG.flagship, tier: 'flagship' };
  if (/b200/i.test(m))      return { abbr: 'B200',  bg: TIER_BG.flagship, tier: 'flagship' };
  if (/h200/i.test(m))      return { abbr: 'H200',  bg: TIER_BG.flagship, tier: 'flagship' };
  if (/h100.*sxm/i.test(m)) return { abbr: 'H100S', bg: TIER_BG.flagship, tier: 'flagship' };
  if (/h100.*nvl/i.test(m)) return { abbr: 'H100N', bg: TIER_BG.flagship, tier: 'flagship' };
  if (/h100/i.test(m))      return { abbr: 'H100',  bg: TIER_BG.flagship, tier: 'flagship' };

  // ── Datacenter (pro/workstation) ──
  if (/a100.*80/i.test(m))  return { abbr: 'A100',  bg: TIER_BG.datacenter, tier: 'datacenter' };
  if (/a100/i.test(m))      return { abbr: 'A100',  bg: TIER_BG.datacenter, tier: 'datacenter' };
  if (/l40s/i.test(m))      return { abbr: 'L40S',  bg: TIER_BG.datacenter, tier: 'datacenter' };
  if (/l40(?!s)/i.test(m))  return { abbr: 'L40',   bg: TIER_BG.datacenter, tier: 'datacenter' };
  if (/a40\b/i.test(m))     return { abbr: 'A40',   bg: TIER_BG.datacenter, tier: 'datacenter' };
  if (/a6000/i.test(m))     return { abbr: 'A6000', bg: TIER_BG.datacenter, tier: 'datacenter' };
  if (/a5000/i.test(m))     return { abbr: 'A5000', bg: TIER_BG.datacenter, tier: 'datacenter' };
  if (/a4000/i.test(m))     return { abbr: 'A4000', bg: TIER_BG.datacenter, tier: 'datacenter' };
  if (/l4\b/i.test(m))      return { abbr: 'L4',    bg: TIER_BG.datacenter, tier: 'datacenter' };

  // ── Consumer (GeForce RTX) ──
  if (/5090/i.test(m))      return { abbr: '5090',  bg: TIER_BG.consumer, tier: 'consumer' };
  if (/5080/i.test(m))      return { abbr: '5080',  bg: TIER_BG.consumer, tier: 'consumer' };
  if (/5070/i.test(m))      return { abbr: '5070',  bg: TIER_BG.consumer, tier: 'consumer' };
  if (/5060/i.test(m))      return { abbr: '5060',  bg: TIER_BG.consumer, tier: 'consumer' };
  if (/4090/i.test(m))      return { abbr: '4090',  bg: TIER_BG.consumer, tier: 'consumer' };
  if (/4080/i.test(m))      return { abbr: '4080',  bg: TIER_BG.consumer, tier: 'consumer' };
  if (/4070/i.test(m))      return { abbr: '4070',  bg: TIER_BG.consumer, tier: 'consumer' };
  if (/3090/i.test(m))      return { abbr: '3090',  bg: TIER_BG.consumer, tier: 'consumer' };
  if (/3080/i.test(m))      return { abbr: '3080',  bg: TIER_BG.consumer, tier: 'consumer' };
  if (/3070/i.test(m))      return { abbr: '3070',  bg: TIER_BG.consumer, tier: 'consumer' };
  if (/3060/i.test(m))      return { abbr: '3060',  bg: TIER_BG.consumer, tier: 'consumer' };
  if (/6000.*ada/i.test(m)) return { abbr: '6000',  bg: TIER_BG.consumer, tier: 'consumer' };

  // ── Entry / legacy ──
  if (/a10g/i.test(m))      return { abbr: 'A10G',  bg: TIER_BG.entry, tier: 'entry' };
  if (/a10\b/i.test(m))     return { abbr: 'A10',   bg: TIER_BG.entry, tier: 'entry' };
  if (/a30\b/i.test(m))     return { abbr: 'A30',   bg: TIER_BG.entry, tier: 'entry' };
  if (/v100/i.test(m))      return { abbr: 'V100',  bg: TIER_BG.entry, tier: 'entry' };
  if (/t4\b/i.test(m))      return { abbr: 'T4',    bg: TIER_BG.entry, tier: 'entry' };
  if (/p100/i.test(m))      return { abbr: 'P100',  bg: TIER_BG.entry, tier: 'entry' };
  if (/k80/i.test(m))       return { abbr: 'K80',   bg: TIER_BG.entry, tier: 'entry' };

  // ── AMD ──
  if (/mi300/i.test(m))     return { abbr: 'MI300', bg: TIER_BG.amd, tier: 'amd' };
  if (/mi250/i.test(m))     return { abbr: 'MI250', bg: TIER_BG.amd, tier: 'amd' };
  if (/mi210/i.test(m))     return { abbr: 'MI210', bg: TIER_BG.amd, tier: 'amd' };

  // ── Fallback ──
  return { abbr: 'GPU', bg: TIER_BG.entry, tier: 'entry' };
}

// ── Component ────────────────────────────────────────────────────────────────

interface GPUChipProps {
  model: string;
  size?: 'sm' | 'md';
}

export const GPUChip: React.FC<GPUChipProps> = ({ model, size = 'sm' }) => {
  const vis = getGPUVisual(model);

  const sizeClasses = size === 'md'
    ? 'h-9 w-9 text-[9px]'
    : 'h-7 w-7 text-[8px]';

  return (
    <div
      className={`${sizeClasses} relative shrink-0 rounded-lg bg-gradient-to-br ${vis.bg} flex items-center justify-center font-mono font-bold text-white/90 tracking-tight select-none`}
      title={model}
    >
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]" viewBox="0 0 28 28" fill="none">
        <line x1="0" y1="7" x2="28" y2="7" stroke="white" strokeWidth="0.5" />
        <line x1="0" y1="21" x2="28" y2="21" stroke="white" strokeWidth="0.5" />
        <line x1="7" y1="0" x2="7" y2="28" stroke="white" strokeWidth="0.5" />
        <line x1="21" y1="0" x2="21" y2="28" stroke="white" strokeWidth="0.5" />
      </svg>
      <span className="relative z-10 leading-none">{vis.abbr}</span>
    </div>
  );
};
