import React from 'react';

// ── GPU family → visual config ──────────────────────────────────────────────

interface GPUVisual {
  abbr: string;       // Short label on the chip
  bg: string;         // Gradient background
  glow: string;       // Subtle glow color
  tier: 'flagship' | 'pro' | 'mainstream' | 'entry' | 'amd';
}

function getGPUVisual(model: string): GPUVisual {
  const m = model.toLowerCase();

  // ── Flagship (gold/amber) ──
  if (/gb200/i.test(m))     return { abbr: 'GB200', bg: 'from-amber-500 to-yellow-600',     glow: 'shadow-amber-500/20', tier: 'flagship' };
  if (/b300/i.test(m))      return { abbr: 'B300',  bg: 'from-amber-500 to-orange-600',     glow: 'shadow-amber-500/20', tier: 'flagship' };
  if (/b200/i.test(m))      return { abbr: 'B200',  bg: 'from-amber-500 to-orange-600',     glow: 'shadow-amber-500/20', tier: 'flagship' };
  if (/h200/i.test(m))      return { abbr: 'H200',  bg: 'from-emerald-500 to-teal-600',     glow: 'shadow-emerald-500/20', tier: 'flagship' };
  if (/h100.*sxm/i.test(m)) return { abbr: 'H100S', bg: 'from-emerald-600 to-green-700',    glow: 'shadow-emerald-500/20', tier: 'flagship' };
  if (/h100.*nvl/i.test(m)) return { abbr: 'H100N', bg: 'from-emerald-600 to-green-700',    glow: 'shadow-emerald-500/20', tier: 'flagship' };
  if (/h100/i.test(m))      return { abbr: 'H100',  bg: 'from-emerald-600 to-green-700',    glow: 'shadow-emerald-500/20', tier: 'flagship' };

  // ── Pro datacenter (blue/indigo) ──
  if (/a100.*80/i.test(m))  return { abbr: 'A100',  bg: 'from-blue-600 to-indigo-700',      glow: 'shadow-blue-500/20', tier: 'pro' };
  if (/a100/i.test(m))      return { abbr: 'A100',  bg: 'from-blue-600 to-indigo-700',      glow: 'shadow-blue-500/20', tier: 'pro' };
  if (/l40s/i.test(m))      return { abbr: 'L40S',  bg: 'from-cyan-600 to-blue-700',        glow: 'shadow-cyan-500/20', tier: 'pro' };
  if (/l40(?!s)/i.test(m))  return { abbr: 'L40',   bg: 'from-cyan-600 to-blue-700',        glow: 'shadow-cyan-500/20', tier: 'pro' };
  if (/a40\b/i.test(m))     return { abbr: 'A40',   bg: 'from-sky-600 to-blue-700',         glow: 'shadow-sky-500/20', tier: 'pro' };
  if (/a6000/i.test(m))     return { abbr: 'A6000', bg: 'from-sky-600 to-blue-700',         glow: 'shadow-sky-500/20', tier: 'pro' };
  if (/a5000/i.test(m))     return { abbr: 'A5000', bg: 'from-sky-600 to-blue-700',         glow: 'shadow-sky-500/20', tier: 'pro' };
  if (/a4000/i.test(m))     return { abbr: 'A4000', bg: 'from-sky-600 to-blue-700',         glow: 'shadow-sky-500/20', tier: 'pro' };
  if (/l4\b/i.test(m))      return { abbr: 'L4',    bg: 'from-sky-500 to-cyan-600',         glow: 'shadow-sky-500/20', tier: 'pro' };

  // ── Consumer RTX (green) ──
  if (/4090/i.test(m))      return { abbr: '4090',  bg: 'from-green-500 to-emerald-600',    glow: 'shadow-green-500/20', tier: 'mainstream' };
  if (/4080/i.test(m))      return { abbr: '4080',  bg: 'from-green-500 to-emerald-600',    glow: 'shadow-green-500/20', tier: 'mainstream' };
  if (/4070/i.test(m))      return { abbr: '4070',  bg: 'from-green-500 to-emerald-600',    glow: 'shadow-green-500/20', tier: 'mainstream' };
  if (/3090/i.test(m))      return { abbr: '3090',  bg: 'from-lime-600 to-green-700',       glow: 'shadow-lime-500/20', tier: 'mainstream' };
  if (/3080/i.test(m))      return { abbr: '3080',  bg: 'from-lime-600 to-green-700',       glow: 'shadow-lime-500/20', tier: 'mainstream' };
  if (/3070/i.test(m))      return { abbr: '3070',  bg: 'from-lime-600 to-green-700',       glow: 'shadow-lime-500/20', tier: 'mainstream' };
  if (/3060/i.test(m))      return { abbr: '3060',  bg: 'from-lime-600 to-green-700',       glow: 'shadow-lime-500/20', tier: 'mainstream' };
  if (/6000.*ada/i.test(m)) return { abbr: '6000',  bg: 'from-green-500 to-emerald-600',    glow: 'shadow-green-500/20', tier: 'mainstream' };

  // ── Entry / legacy (slate/gray) ──
  if (/a10g/i.test(m))      return { abbr: 'A10G',  bg: 'from-slate-500 to-slate-600',      glow: 'shadow-slate-500/20', tier: 'entry' };
  if (/a10\b/i.test(m))     return { abbr: 'A10',   bg: 'from-slate-500 to-slate-600',      glow: 'shadow-slate-500/20', tier: 'entry' };
  if (/a30\b/i.test(m))     return { abbr: 'A30',   bg: 'from-slate-500 to-slate-600',      glow: 'shadow-slate-500/20', tier: 'entry' };
  if (/v100/i.test(m))      return { abbr: 'V100',  bg: 'from-zinc-500 to-zinc-600',        glow: 'shadow-zinc-500/20', tier: 'entry' };
  if (/t4\b/i.test(m))      return { abbr: 'T4',    bg: 'from-zinc-500 to-zinc-600',        glow: 'shadow-zinc-500/20', tier: 'entry' };
  if (/p100/i.test(m))      return { abbr: 'P100',  bg: 'from-stone-500 to-stone-600',      glow: 'shadow-stone-500/20', tier: 'entry' };
  if (/k80/i.test(m))       return { abbr: 'K80',   bg: 'from-stone-500 to-stone-600',      glow: 'shadow-stone-500/20', tier: 'entry' };

  // ── AMD (red) ──
  if (/mi300/i.test(m))     return { abbr: 'MI300', bg: 'from-red-500 to-rose-600',         glow: 'shadow-red-500/20', tier: 'amd' };
  if (/mi250/i.test(m))     return { abbr: 'MI250', bg: 'from-red-500 to-rose-600',         glow: 'shadow-red-500/20', tier: 'amd' };
  if (/mi210/i.test(m))     return { abbr: 'MI210', bg: 'from-red-500 to-rose-600',         glow: 'shadow-red-500/20', tier: 'amd' };

  // ── Fallback ──
  return { abbr: 'GPU', bg: 'from-slate-400 to-slate-500', glow: 'shadow-slate-400/20', tier: 'entry' };
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
      className={`${sizeClasses} shrink-0 rounded-lg bg-gradient-to-br ${vis.bg} shadow-sm ${vis.glow} flex items-center justify-center font-mono font-bold text-white/90 tracking-tight select-none`}
      title={model}
    >
      {/* Subtle chip circuit lines */}
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
