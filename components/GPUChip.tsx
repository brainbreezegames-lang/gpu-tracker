import React from 'react';

// ── GPU family tier system ────────────────────────────────────────────────────

type Tier = 'hopper' | 'blackwell' | 'gh200' | 'ampere' | 'lovelace' | 'consumer' | 'entry' | 'amd';

interface GPUVisual {
  abbr: string;
  tier: Tier;
}

// Each tier gets a distinct color DNA — not just "darker = better" grays.
const TIER_STYLES: Record<Tier, { from: string; to: string; accent: string }> = {
  hopper:    { from: '#1e1b4b', to: '#2d2780', accent: '#818cf8' }, // indigo — H100/H200
  blackwell: { from: '#2e1065', to: '#4a1d90', accent: '#c4b5fd' }, // violet — B200/GB200
  gh200:     { from: '#042f2e', to: '#0f4a48', accent: '#2dd4bf' }, // teal   — GH200 Grace Hopper
  ampere:    { from: '#052e16', to: '#145228', accent: '#34d399' }, // emerald— A100
  lovelace:  { from: '#0c1a45', to: '#1a3280', accent: '#60a5fa' }, // blue   — L40S / L4 / A40
  consumer:  { from: '#111824', to: '#1a2535', accent: '#a3e635' }, // lime   — RTX 4090/5090 consumer
  entry:     { from: '#1a2232', to: '#28374a', accent: '#7dd3fc' }, // sky    — T4, V100, A10, legacy
  amd:       { from: '#450a0a', to: '#7a1a1a', accent: '#f87171' }, // red    — MI300X
};

// ── GPU model → tier lookup ───────────────────────────────────────────────────

function getGPUVisual(model: string): GPUVisual {
  const m = model.toLowerCase();

  // GH200 must precede H200
  if (/gh200/i.test(m))     return { abbr: 'GH200',  tier: 'gh200'     };

  // Hopper (H-series)
  if (/h200/i.test(m))      return { abbr: 'H200',   tier: 'hopper'    };
  if (/h100.*sxm/i.test(m)) return { abbr: 'H100S',  tier: 'hopper'    };
  if (/h100.*nvl/i.test(m)) return { abbr: 'H100N',  tier: 'hopper'    };
  if (/h100/i.test(m))      return { abbr: 'H100',   tier: 'hopper'    };

  // Blackwell (B-series)
  if (/gb300/i.test(m))     return { abbr: 'GB300',  tier: 'blackwell' };
  if (/gb200/i.test(m))     return { abbr: 'GB200',  tier: 'blackwell' };
  if (/b300/i.test(m))      return { abbr: 'B300',   tier: 'blackwell' };
  if (/b200/i.test(m))      return { abbr: 'B200',   tier: 'blackwell' };

  // Ampere datacenter
  if (/a100/i.test(m))      return { abbr: 'A100',   tier: 'ampere'    };

  // Lovelace / Hopper datacenter (L-series, A40, A-series workstation)
  if (/l40s/i.test(m))      return { abbr: 'L40S',   tier: 'lovelace'  };
  if (/l40(?!s)/i.test(m))  return { abbr: 'L40',    tier: 'lovelace'  };
  if (/l4\b/i.test(m))      return { abbr: 'L4',     tier: 'lovelace'  };
  if (/a40\b/i.test(m))     return { abbr: 'A40',    tier: 'lovelace'  };
  if (/a6000/i.test(m))     return { abbr: 'A6000',  tier: 'lovelace'  };
  if (/a5000/i.test(m))     return { abbr: 'A5000',  tier: 'lovelace'  };
  if (/a4000/i.test(m))     return { abbr: 'A4000',  tier: 'lovelace'  };
  if (/rtxpro6000|rtx.*pro.*6000/i.test(m)) return { abbr: 'PRO6K', tier: 'lovelace' };
  if (/6000.*ada/i.test(m)) return { abbr: '6KAda',  tier: 'lovelace'  };

  // Consumer RTX (Ada + Blackwell gen)
  if (/5090/i.test(m))      return { abbr: '5090',   tier: 'consumer'  };
  if (/5080/i.test(m))      return { abbr: '5080',   tier: 'consumer'  };
  if (/5070/i.test(m))      return { abbr: '5070',   tier: 'consumer'  };
  if (/5060/i.test(m))      return { abbr: '5060',   tier: 'consumer'  };
  if (/4090/i.test(m))      return { abbr: '4090',   tier: 'consumer'  };
  if (/4080/i.test(m))      return { abbr: '4080',   tier: 'consumer'  };
  if (/4070/i.test(m))      return { abbr: '4070',   tier: 'consumer'  };
  if (/3090/i.test(m))      return { abbr: '3090',   tier: 'consumer'  };
  if (/3080/i.test(m))      return { abbr: '3080',   tier: 'consumer'  };
  if (/3070/i.test(m))      return { abbr: '3070',   tier: 'consumer'  };
  if (/3060/i.test(m))      return { abbr: '3060',   tier: 'consumer'  };

  // Entry / legacy NVIDIA
  if (/a10g/i.test(m))      return { abbr: 'A10G',   tier: 'entry'     };
  if (/a10\b/i.test(m))     return { abbr: 'A10',    tier: 'entry'     };
  if (/a30\b/i.test(m))     return { abbr: 'A30',    tier: 'entry'     };
  if (/v100/i.test(m))      return { abbr: 'V100',   tier: 'entry'     };
  if (/t4\b/i.test(m))      return { abbr: 'T4',     tier: 'entry'     };
  if (/p100/i.test(m))      return { abbr: 'P100',   tier: 'entry'     };
  if (/k80/i.test(m))       return { abbr: 'K80',    tier: 'entry'     };

  // AMD
  if (/mi300/i.test(m))     return { abbr: 'MI300X', tier: 'amd'       };
  if (/mi250/i.test(m))     return { abbr: 'MI250',  tier: 'amd'       };
  if (/mi210/i.test(m))     return { abbr: 'MI210',  tier: 'amd'       };

  return { abbr: 'GPU', tier: 'entry' };
}

// ── Unique SVG pattern per architecture ──────────────────────────────────────
// Each design reflects the actual physical architecture of the chip family.

const TierSVG: React.FC<{ tier: Tier; a: string }> = ({ tier, a }) => {
  if (tier === 'hopper') {
    // H100/H200: Central compute die flanked by HBM3 stacks (physically accurate)
    return (
      <svg viewBox="0 0 28 28" fill="none" className="absolute inset-0 w-full h-full">
        {/* HBM stacks — tall thin rectangles on each side */}
        <rect x="1.5" y="5" width="4" height="18" rx="1" fill={a} fillOpacity="0.22"/>
        <rect x="22.5" y="5" width="4" height="18" rx="1" fill={a} fillOpacity="0.22"/>
        {/* Compute die — centered */}
        <rect x="7" y="8" width="14" height="12" rx="1.5" fill={a} fillOpacity="0.18"/>
        {/* Microscopic SM cores (3 dots) */}
        <circle cx="11" cy="14" r="1.2" fill={a} fillOpacity="0.65"/>
        <circle cx="14" cy="14" r="1.2" fill={a} fillOpacity="0.65"/>
        <circle cx="17" cy="14" r="1.2" fill={a} fillOpacity="0.65"/>
        {/* Substrate connection traces HBM ↔ die */}
        <line x1="5.5" y1="12" x2="7" y2="12" stroke={a} strokeOpacity="0.4" strokeWidth="0.75"/>
        <line x1="5.5" y1="16" x2="7" y2="16" stroke={a} strokeOpacity="0.4" strokeWidth="0.75"/>
        <line x1="21" y1="12" x2="22.5" y2="12" stroke={a} strokeOpacity="0.4" strokeWidth="0.75"/>
        <line x1="21" y1="16" x2="22.5" y2="16" stroke={a} strokeOpacity="0.4" strokeWidth="0.75"/>
      </svg>
    );
  }

  if (tier === 'blackwell') {
    // B200/GB200: Two equal-sized dies side by side, connected via NVLink bridge
    return (
      <svg viewBox="0 0 28 28" fill="none" className="absolute inset-0 w-full h-full">
        {/* Die 1 */}
        <rect x="1.5" y="4.5" width="11" height="19" rx="1.5" fill={a} fillOpacity="0.22"/>
        {/* Die 2 */}
        <rect x="15.5" y="4.5" width="11" height="19" rx="1.5" fill={a} fillOpacity="0.16"/>
        {/* NVLink bridge lines */}
        <line x1="12.5" y1="9" x2="15.5" y2="9" stroke={a} strokeOpacity="0.55" strokeWidth="1"/>
        <line x1="12.5" y1="14" x2="15.5" y2="14" stroke={a} strokeOpacity="0.55" strokeWidth="1"/>
        <line x1="12.5" y1="19" x2="15.5" y2="19" stroke={a} strokeOpacity="0.55" strokeWidth="1"/>
        {/* Core markers */}
        <circle cx="7" cy="11" r="1.3" fill={a} fillOpacity="0.6"/>
        <circle cx="7" cy="17" r="1.3" fill={a} fillOpacity="0.6"/>
        <circle cx="21" cy="11" r="1.3" fill={a} fillOpacity="0.45"/>
        <circle cx="21" cy="17" r="1.3" fill={a} fillOpacity="0.45"/>
      </svg>
    );
  }

  if (tier === 'gh200') {
    // GH200: Unique Grace CPU die + Hopper GPU die in one package (NVLink-C2C)
    return (
      <svg viewBox="0 0 28 28" fill="none" className="absolute inset-0 w-full h-full">
        {/* GPU die (larger, left) */}
        <rect x="1" y="5" width="14" height="18" rx="1.5" fill={a} fillOpacity="0.22"/>
        {/* CPU die (smaller, right) */}
        <rect x="17" y="8" width="10" height="12" rx="1.5" fill={a} fillOpacity="0.18"/>
        {/* C2C interconnect */}
        <path d="M15 11 Q16 11 16 12 L16 16 Q16 17 17 17" stroke={a} strokeOpacity="0.5" strokeWidth="1" fill="none"/>
        {/* GPU core dots */}
        <circle cx="6" cy="12" r="1.1" fill={a} fillOpacity="0.6"/>
        <circle cx="6" cy="16" r="1.1" fill={a} fillOpacity="0.6"/>
        <circle cx="10" cy="12" r="1.1" fill={a} fillOpacity="0.6"/>
        <circle cx="10" cy="16" r="1.1" fill={a} fillOpacity="0.6"/>
        {/* CPU label area */}
        <rect x="19" y="11" width="6" height="1.5" rx="0.5" fill={a} fillOpacity="0.4"/>
        <rect x="19" y="14" width="6" height="1.5" rx="0.5" fill={a} fillOpacity="0.3"/>
        <rect x="19" y="17" width="6" height="1.5" rx="0.5" fill={a} fillOpacity="0.2"/>
      </svg>
    );
  }

  if (tier === 'ampere') {
    // A100: Classic large monolithic die — show SM cluster grid (108 SMs abstracted as 9 dots)
    return (
      <svg viewBox="0 0 28 28" fill="none" className="absolute inset-0 w-full h-full">
        {/* Die outline */}
        <rect x="3" y="4" width="22" height="20" rx="1.5" fill={a} fillOpacity="0.14"/>
        <rect x="3" y="4" width="22" height="20" rx="1.5" stroke={a} strokeOpacity="0.22" strokeWidth="0.75" fill="none"/>
        {/* 3×3 SM cluster grid */}
        {([8, 14, 20] as number[]).map(cx =>
          ([9.5, 14, 18.5] as number[]).map(cy => (
            <rect key={`${cx}-${cy}`} x={cx - 2.5} y={cy - 2} width="5" height="4" rx="0.75" fill={a} fillOpacity="0.35"/>
          ))
        )}
      </svg>
    );
  }

  if (tier === 'lovelace') {
    // L40S / A40: Diagonal Ada Lovelace trace pattern — the Ada "L" slash aesthetic
    return (
      <svg viewBox="0 0 28 28" fill="none" className="absolute inset-0 w-full h-full">
        {/* Die background */}
        <rect x="3" y="4" width="22" height="20" rx="1.5" fill={a} fillOpacity="0.14"/>
        {/* Diagonal accent lines (Ada's distinctive angular routing) */}
        <line x1="3" y1="24" x2="16" y2="4" stroke={a} strokeOpacity="0.2" strokeWidth="1"/>
        <line x1="12" y1="24" x2="25" y2="4" stroke={a} strokeOpacity="0.2" strokeWidth="1"/>
        {/* Two processing blocks separated by diagonal */}
        <rect x="5" y="7" width="8" height="14" rx="1" fill={a} fillOpacity="0.28"/>
        <rect x="15" y="7" width="8" height="14" rx="1" fill={a} fillOpacity="0.2"/>
        {/* Center connector */}
        <rect x="13" y="12.5" width="2" height="3" fill={a} fillOpacity="0.5"/>
      </svg>
    );
  }

  if (tier === 'consumer') {
    // RTX 4090/5090: Gaming — show the iconic RTX PCB fan shroud silhouette + GPU die
    return (
      <svg viewBox="0 0 28 28" fill="none" className="absolute inset-0 w-full h-full">
        {/* PCB outline */}
        <rect x="2" y="6" width="24" height="16" rx="1" fill={a} fillOpacity="0.12"/>
        {/* GPU die — offset bottom-left */}
        <rect x="4" y="9" width="12" height="10" rx="1" fill={a} fillOpacity="0.28"/>
        {/* VRAM modules — 4 chips right of die */}
        <rect x="18" y="9" width="6" height="4" rx="0.75" fill={a} fillOpacity="0.35"/>
        <rect x="18" y="15" width="6" height="4" rx="0.75" fill={a} fillOpacity="0.28"/>
        {/* Brand accent dot — bottom right corner */}
        <circle cx="23" cy="22" r="1.5" fill={a} fillOpacity="0.7"/>
        {/* Core indicator */}
        <circle cx="10" cy="14" r="1.5" fill={a} fillOpacity="0.6"/>
      </svg>
    );
  }

  if (tier === 'amd') {
    // AMD MI300X: Horizontal chiplet stack — 3 GCDs + HBM arranged linearly
    return (
      <svg viewBox="0 0 28 28" fill="none" className="absolute inset-0 w-full h-full">
        {/* 3 horizontal compute chiplets */}
        <rect x="2" y="5.5" width="24" height="5" rx="1" fill={a} fillOpacity="0.38"/>
        <rect x="2" y="11.5" width="24" height="5" rx="1" fill={a} fillOpacity="0.3"/>
        <rect x="2" y="17.5" width="24" height="5" rx="1" fill={a} fillOpacity="0.22"/>
        {/* Interconnect bump array between chiplets */}
        {([6, 10, 14, 18, 22] as number[]).map(x => (
          <g key={x}>
            <circle cx={x} cy="11" r="0.8" fill={a} fillOpacity="0.55"/>
            <circle cx={x} cy="17" r="0.8" fill={a} fillOpacity="0.5"/>
          </g>
        ))}
      </svg>
    );
  }

  // entry / legacy: Classic chip package — bond wires + small die
  return (
    <svg viewBox="0 0 28 28" fill="none" className="absolute inset-0 w-full h-full">
      {/* Package outline */}
      <rect x="4" y="5" width="20" height="18" rx="1.5" fill={a} fillOpacity="0.16"/>
      {/* Bond wire pads — top & bottom edges */}
      {([7, 11, 15, 19, 23] as number[]).map(x => (
        <g key={x}>
          <circle cx={x} cy="4" r="1" fill={a} fillOpacity="0.38"/>
          <circle cx={x} cy="24" r="1" fill={a} fillOpacity="0.38"/>
        </g>
      ))}
      {/* Bond wire pads — left & right edges */}
      {([9, 14, 19] as number[]).map(y => (
        <g key={y}>
          <circle cx="3" cy={y} r="1" fill={a} fillOpacity="0.32"/>
          <circle cx="25" cy={y} r="1" fill={a} fillOpacity="0.32"/>
        </g>
      ))}
      {/* Die cavity */}
      <rect x="8.5" y="9" width="11" height="10" rx="1" fill={a} fillOpacity="0.22"/>
    </svg>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────

interface GPUChipProps {
  model: string;
  size?: 'sm' | 'md';
}

export const GPUChip: React.FC<GPUChipProps> = ({ model, size = 'sm' }) => {
  const vis = getGPUVisual(model);
  const styles = TIER_STYLES[vis.tier];

  const dim = size === 'md' ? 36 : 28;
  const fontSize = size === 'md' ? 7 : 6;

  return (
    <div
      className="relative shrink-0 rounded-lg overflow-hidden select-none flex items-end justify-center"
      style={{
        width: dim,
        height: dim,
        background: `linear-gradient(145deg, ${styles.from} 0%, ${styles.to} 100%)`,
        paddingBottom: 3,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 3px rgba(0,0,0,0.4)`,
      }}
      title={model}
    >
      <TierSVG tier={vis.tier} a={styles.accent} />
      <span
        className="relative z-10 font-mono font-bold leading-none tracking-tight"
        style={{ color: styles.accent, opacity: 0.88, fontSize }}
      >
        {vis.abbr}
      </span>
    </div>
  );
};
