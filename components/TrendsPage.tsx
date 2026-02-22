import React, { useState, useMemo } from 'react';
import { GPUInstance } from '../types';
import {
  TrendingDown, Zap, DollarSign, Award, ExternalLink,
  Calculator, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  inferenceTokensPerSec, costPer1MTokens, vramRequiredGBFP16, getGPUTFLOPS,
} from '../services/gpuUtils';

interface Props {
  data: GPUInstance[];
  isLoading: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cheapest(items: GPUInstance[]): number | null {
  if (!items.length) return null;
  return Math.min(...items.map((d) => d.pricePerHour));
}

function cheapestItem(items: GPUInstance[]): GPUInstance | null {
  if (!items.length) return null;
  return items.reduce((a, b) => (a.pricePerHour < b.pricePerHour ? a : b));
}

// ── Sub-components ────────────────────────────────────────────────────────────

const BarRow = ({
  label, value, max, subLabel, color = 'bg-brand-500 dark:bg-brand-400',
}: {
  label: string; value: number; max: number; subLabel?: string; color?: string;
}) => (
  <div className="flex items-center gap-3">
    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-24 shrink-0 text-right truncate" title={label}>
      {label}
    </span>
    <div className="flex-1 bg-slate-100 dark:bg-ink-muted rounded-full h-4 overflow-hidden">
      <div
        className={`${color} rounded-full h-4 transition-all duration-700`}
        style={{ width: `${Math.max(2, (value / max) * 100)}%` }}
      />
    </div>
    <span className="text-xs font-semibold font-mono text-slate-700 dark:text-slate-300 shrink-0 w-28 text-right">
      {subLabel}
    </span>
  </div>
);

const StatCard = ({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string; sub?: string; icon: React.FC<{ className?: string }>; color: string;
}) => (
  <div className="bg-white dark:bg-ink-card rounded-xl border border-slate-200 dark:border-ink-border p-4">
    <div className={`${color} mb-2`}><Icon className="h-4 w-4" /></div>
    <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">{value}</div>
    {sub && <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{sub}</div>}
    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-1">{label}</div>
  </div>
);

// ── Collapsible Section ───────────────────────────────────────────────────────

const Section: React.FC<{
  title: string; sub?: string; defaultOpen?: boolean; children: React.ReactNode;
}> = ({ title, sub, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between mb-4 group"
      >
        <div className="text-left">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{title}</h2>
          {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
      </button>
      {open && children}
    </section>
  );
};

// ── Cost Calculator ───────────────────────────────────────────────────────────

const LLM_SIZES = [
  { label: '7B',   params: 7   },
  { label: '13B',  params: 13  },
  { label: '34B',  params: 34  },
  { label: '70B',  params: 70  },
  { label: '180B', params: 180 },
];

interface CalcResult extends GPUInstance {
  tps: number;
  costPer1M: number | null;
  monthlyTotal: number;
  totalVram: number;
}

const CostCalculator: React.FC<{ data: GPUInstance[] }> = ({ data }) => {
  const [workload,      setWorkload]      = useState<'inference' | 'training'>('inference');
  const [modelSizeB,    setModelSizeB]    = useState(70);
  const [hoursPerMonth, setHoursPerMonth] = useState(160);

  const results = useMemo((): CalcResult[] => {
    if (!data.length) return [];
    const vramNeeded = vramRequiredGBFP16(modelSizeB);

    return data
      .filter((item) => {
        const totalVram = item.vram * item.gpuCount;
        return totalVram >= vramNeeded && getGPUTFLOPS(item.model) > 0;
      })
      .map((item): CalcResult => {
        const tps        = inferenceTokensPerSec(item.model, modelSizeB, item.gpuCount);
        const c1m        = costPer1MTokens(item.pricePerHour, tps);
        const monthly    = item.pricePerHour * hoursPerMonth;
        return { ...item, tps, costPer1M: c1m, monthlyTotal: monthly, totalVram: item.vram * item.gpuCount };
      })
      .filter((item) => item.tps > 0)
      .sort((a, b) =>
        workload === 'inference'
          ? (a.costPer1M ?? Infinity) - (b.costPer1M ?? Infinity)
          : a.monthlyTotal - b.monthlyTotal,
      )
      .slice(0, 10);
  }, [data, workload, modelSizeB, hoursPerMonth]);

  const vramNeeded = vramRequiredGBFP16(modelSizeB);
  const pill = (active: boolean) =>
    `px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
      active
        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
        : 'bg-slate-100 dark:bg-ink-muted text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5'
    }`;

  return (
    <div className="bg-white dark:bg-ink-card rounded-xl border border-slate-200 dark:border-ink-border overflow-hidden">
      {/* Controls — horizontal, compact */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-ink-border flex flex-wrap items-end gap-4">
        <div>
          <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Workload</label>
          <div className="flex gap-1">
            {(['inference', 'training'] as const).map((w) => (
              <button key={w} onClick={() => setWorkload(w)} className={pill(workload === w)}>
                {w === 'inference' ? 'Inference' : 'Training'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Model size</label>
          <div className="flex gap-1">
            {LLM_SIZES.map(({ label, params }) => (
              <button key={label} onClick={() => setModelSizeB(params)} className={pill(modelSizeB === params)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
            Hours/month: <span className="text-slate-700 dark:text-white">{hoursPerMonth}h</span>
          </label>
          <input
            type="range" min={1} max={730} value={hoursPerMonth}
            onChange={(e) => setHoursPerMonth(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>
      </div>

      {/* Info */}
      <div className="px-5 py-2.5 bg-slate-50 dark:bg-white/4 text-xs text-slate-500 dark:text-slate-400">
        <strong className="text-slate-700 dark:text-slate-300">{modelSizeB}B</strong> model needs ≥{vramNeeded}GB VRAM.
        {workload === 'inference' ? ' Ranked by $/1M tokens.' : ' Ranked by monthly cost.'}
      </div>

      {/* Results table */}
      {results.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
          No instances with ≥{vramNeeded}GB VRAM found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-ink-border">
                <th className="py-2.5 px-5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Instance</th>
                <th className="py-2.5 px-3 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">VRAM</th>
                <th className="py-2.5 px-3 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">$/hr</th>
                {workload === 'inference' && (
                  <>
                    <th className="py-2.5 px-3 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tok/s</th>
                    <th className="py-2.5 px-3 text-right text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">$/1M tok</th>
                  </>
                )}
                <th className="py-2.5 px-3 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monthly</th>
                <th className="py-2.5 px-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {results.map((item, i) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5/30 transition-colors">
                  <td className="py-2.5 px-5">
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-1.5 py-0.5 rounded shrink-0">BEST</span>}
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{item.model}{item.gpuCount > 1 ? ` ×${item.gpuCount}` : ''}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{item.provider}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400">{item.totalVram}GB</td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs font-semibold text-slate-900 dark:text-white">${item.pricePerHour.toFixed(2)}</td>
                  {workload === 'inference' && (
                    <>
                      <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-600 dark:text-slate-400">{Math.round(item.tps).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">${item.costPer1M?.toFixed(3) ?? '—'}</td>
                    </>
                  )}
                  <td className="py-2.5 px-3 text-right font-mono text-xs font-semibold text-slate-900 dark:text-white">${item.monthlyTotal.toFixed(0)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const TrendsPage: React.FC<Props> = ({ data, isLoading }) => {
  const [selectedModel, setSelectedModel] = useState('H100');

  const availableModels = useMemo(() => [...new Set(data.map((d) => d.model))].sort(), [data]);

  const effectiveModel = useMemo(() => {
    if (availableModels.includes(selectedModel)) return selectedModel;
    return availableModels[0] ?? '';
  }, [availableModels, selectedModel]);

  const stats = useMemo(() => {
    if (!data.length) return null;
    const h100   = data.filter((d) => /H100/i.test(d.model));
    const h200   = data.filter((d) => /H200/i.test(d.model));
    const a100   = data.filter((d) => /A100/i.test(d.model));
    return {
      h100Min:   cheapest(h100),
      h200Min:   cheapest(h200),
      a100Min:   cheapest(a100),
      spotCount: data.filter((d) => d.commitment === 'Spot').length,
      avgPrice:  data.reduce((s, d) => s + d.pricePerHour, 0) / data.length,
    };
  }, [data]);

  const providerBreakdown = useMemo(() => {
    const filtered = data.filter((d) => d.model === effectiveModel);
    const map: Record<string, { min: number; count: number }> = {};
    filtered.forEach((item) => {
      if (!map[item.provider]) map[item.provider] = { min: item.pricePerHour, count: 0 };
      map[item.provider].min   = Math.min(map[item.provider].min, item.pricePerHour);
      map[item.provider].count++;
    });
    return Object.entries(map)
      .map(([provider, s]) => ({ provider, ...s }))
      .sort((a, b) => a.min - b.min);
  }, [data, effectiveModel]);

  const vramTiers = useMemo(() => [
    { name: '≤24 GB',   filter: (d: GPUInstance) => d.vram > 0  && d.vram <= 24  },
    { name: '25–48 GB', filter: (d: GPUInstance) => d.vram > 24 && d.vram <= 48  },
    { name: '49–80 GB', filter: (d: GPUInstance) => d.vram > 48 && d.vram <= 80  },
    { name: '80 GB+',   filter: (d: GPUInstance) => d.vram > 80                   },
  ].map(({ name, filter }) => {
    const items = data.filter(filter).sort((a, b) => a.pricePerHour - b.pricePerHour);
    return { name, best: cheapestItem(items), count: items.length };
  }), [data]);

  const providerStats = useMemo(() => {
    const map: Record<string, { count: number; minPrice: number; models: Set<string> }> = {};
    data.forEach((item) => {
      if (!map[item.provider]) map[item.provider] = { count: 0, minPrice: Infinity, models: new Set() };
      map[item.provider].count++;
      map[item.provider].minPrice = Math.min(map[item.provider].minPrice, item.pricePerHour);
      map[item.provider].models.add(item.model);
    });
    return Object.entries(map)
      .map(([provider, s]) => ({ provider, count: s.count, minPrice: s.minPrice, modelCount: s.models.size }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-white dark:bg-ink-card rounded-xl border border-slate-200 dark:border-ink-border animate-pulse" />
        ))}
      </div>
    );
  }

  const maxBarPrice  = providerBreakdown.length ? providerBreakdown[providerBreakdown.length - 1].min : 1;
  const maxProvCount = providerStats.length ? providerStats[0].count : 1;

  return (
    <div className="space-y-8">

      {/* ── Page header ────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Market Trends</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {data.length.toLocaleString()} instances across {[...new Set(data.map((d) => d.provider))].length} providers
        </p>
      </div>

      {/* ── Stat cards (compact, scannable) ─────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Cheapest H100" value={stats.h100Min ? `$${stats.h100Min.toFixed(2)}` : 'N/A'} sub="/hr" icon={Award} color="text-emerald-500" />
          <StatCard label="Cheapest H200" value={stats.h200Min ? `$${stats.h200Min.toFixed(2)}` : 'N/A'} sub="/hr" icon={TrendingDown} color="text-blue-500" />
          <StatCard label="Cheapest A100" value={stats.a100Min ? `$${stats.a100Min.toFixed(2)}` : 'N/A'} sub="/hr" icon={Zap} color="text-amber-500" />
          <StatCard label="Avg Price" value={`$${stats.avgPrice.toFixed(2)}`} sub={`${stats.spotCount.toLocaleString()} spot`} icon={DollarSign} color="text-slate-500" />
        </div>
      )}

      {/* ── Cost Calculator ────────────────────────────────────── */}
      <Section title="Cost Calculator" sub="Estimate real cost by LLM model size">
        <CostCalculator data={data} />
      </Section>

      {/* ── Price by Provider ──────────────────────────────────── */}
      <Section title="Price by Provider" sub={`Min price for ${effectiveModel}`}>
        <div className="flex justify-end mb-3">
          <select
            value={effectiveModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-muted text-slate-900 dark:text-slate-100 px-2.5 py-1.5 focus:border-brand-500 outline-none"
          >
            {availableModels.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="bg-white dark:bg-ink-card rounded-xl border border-slate-200 dark:border-ink-border p-5">
          {providerBreakdown.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">No data for {effectiveModel}</p>
          ) : (
            <div className="space-y-2.5">
              {providerBreakdown.map(({ provider, min, count }) => (
                <BarRow
                  key={provider}
                  label={provider}
                  value={min}
                  max={maxBarPrice}
                  subLabel={`$${min.toFixed(2)}/hr`}
                />
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* ── Best Deal by VRAM Tier ─────────────────────────────── */}
      <Section title="Best Deal by VRAM Tier" sub="Cheapest instance in each tier">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {vramTiers.map(({ name, best, count }) => (
            <div key={name} className="bg-white dark:bg-ink-card rounded-xl border border-slate-200 dark:border-ink-border p-4">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{name}</span>
              {best ? (
                <>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    ${best.pricePerHour.toFixed(2)}<span className="text-xs font-normal text-slate-400">/hr</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                    {best.model}{best.gpuCount > 1 ? ` ×${best.gpuCount}` : ''}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">{best.provider} · {count} options</div>
                </>
              ) : (
                <div className="text-sm text-slate-400 mt-2">No data</div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ── Provider Inventory (collapsed by default) ──────────── */}
      <Section title="Provider Inventory" sub="Instance count by provider" defaultOpen={false}>
        <div className="bg-white dark:bg-ink-card rounded-xl border border-slate-200 dark:border-ink-border p-5">
          <div className="space-y-2.5">
            {providerStats.map(({ provider, count, minPrice, modelCount }) => (
              <BarRow
                key={provider}
                label={provider}
                value={count}
                max={maxProvCount}
                subLabel={`${count} · from $${minPrice.toFixed(2)}`}
                color="bg-slate-500 dark:bg-slate-400"
              />
            ))}
          </div>
        </div>
      </Section>

      {/* ── Model Coverage (collapsed by default) ──────────────── */}
      <Section title="Model × Provider Coverage" sub="Which GPUs each provider offers" defaultOpen={false}>
        <ModelCoverageMatrix data={data} />
      </Section>

    </div>
  );
};

// ── Model Coverage Matrix ─────────────────────────────────────────────────────

const ModelCoverageMatrix: React.FC<{ data: GPUInstance[] }> = ({ data }) => {
  const providers = useMemo(() => [...new Set(data.map((d) => d.provider))].sort(), [data]);

  const coverage = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    data.forEach((d) => {
      if (!map[d.model]) map[d.model] = new Set();
      map[d.model].add(d.provider);
    });
    return map;
  }, [data]);

  const topModels = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((d) => { counts[d.model] = (counts[d.model] ?? 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([m]) => m);
  }, [data]);

  return (
    <div className="bg-white dark:bg-ink-card rounded-xl border border-slate-200 dark:border-ink-border overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-white/4">
            <th className="px-4 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400 sticky left-0 bg-slate-50 dark:bg-white/4 w-24">Model</th>
            {providers.map((p) => (
              <th key={p} className="px-2 py-2.5 font-semibold text-slate-500 dark:text-slate-400 text-center">
                <div className="truncate max-w-[56px]" title={p}>{p}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {topModels.map((model) => (
            <tr key={model} className="hover:bg-slate-50 dark:hover:bg-white/5/30 transition-colors">
              <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-ink-card border-r border-slate-100 dark:border-ink-border text-xs">
                {model}
              </td>
              {providers.map((provider) => (
                <td key={provider} className="px-2 py-2 text-center">
                  {coverage[model]?.has(provider) ? (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">✓</span>
                  ) : (
                    <span className="inline-block h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
