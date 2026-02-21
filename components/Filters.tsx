import React, { useState } from 'react';
import { FilterState, Commitment } from '../types';
import { Filter, RotateCcw } from 'lucide-react';
import { InfoTooltip } from './ui';
import { getFreshness } from '../services/gpuUtils';

interface FiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resultCount: number;
  availableModels: string[];
  availableProviders: string[];
  availableRegions: string[];
  lastUpdated?: string | null;
}

const DEFAULT_FILTERS: FilterState = {
  search:     '',
  models:     [],
  providers:  [],
  regions:    [],
  commitment: [],
  minPrice:   0,
  maxPrice:   999,
  minVram:    0,
  gpuCounts:  [],
};

const GPU_COUNT_OPTIONS = [
  { label: '1×',  value: 1  },
  { label: '2×',  value: 2  },
  { label: '4×',  value: 4  },
  { label: '8×+', value: -1 },
];

const VRAM_PRESETS = [8, 24, 48, 80];
const MODEL_LIMIT  = 8;

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ title: string; count?: number; tooltip?: string }> = ({ title, count, tooltip }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-1.5">
      <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
      {tooltip && <InfoTooltip content={tooltip} side="right" />}
    </div>
    {count ? (
      <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 text-[10px] font-bold">
        {count}
      </span>
    ) : null}
  </div>
);

const Checkbox: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center group cursor-pointer py-2 gap-2.5">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500 bg-white dark:bg-slate-800 cursor-pointer shrink-0"
    />
    <span className={`text-sm truncate transition-colors ${
      checked
        ? 'text-slate-900 dark:text-slate-100 font-medium'
        : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
    }`}>
      {label}
    </span>
  </label>
);

// ── Main component ────────────────────────────────────────────────────────────

export const Filters: React.FC<FiltersProps> = ({
  filters, setFilters, resultCount,
  availableModels, availableProviders, availableRegions, lastUpdated,
}) => {
  const [showAllModels, setShowAllModels] = useState(false);

  const visibleModels = showAllModels ? availableModels : availableModels.slice(0, MODEL_LIMIT);

  const toggleList = (
    category: 'models' | 'providers' | 'regions' | 'commitment' | 'gpuCounts',
    value: string | number,
  ) => {
    setFilters((prev) => {
      const current = prev[category] as (string | number)[];
      const isSelected = current.includes(value as never);
      return {
        ...prev,
        [category]: isSelected
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };

  const hasActiveFilters =
    filters.minPrice > 0 || filters.maxPrice < 999 || filters.minVram > 0 ||
    filters.gpuCounts.length > 0 || filters.providers.length > 0 ||
    filters.models.length > 0 || filters.commitment.length > 0 || filters.regions.length > 0;

  const resetAll = () => { setFilters(DEFAULT_FILTERS); setShowAllModels(false); };

  const chip = (active: boolean) =>
    `px-3.5 py-2 text-xs rounded-lg font-semibold border transition-colors ${
      active
        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
    }`;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl ring-1 ring-black/[0.06] dark:ring-white/[0.06] shadow-[0_1px_3px_0_rgb(0_0_0/_0.08),0_1px_2px_-1px_rgb(0_0_0/_0.08)] dark:shadow-[0_1px_3px_0_rgb(0_0_0/_0.3)] overflow-hidden transition-colors duration-300">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="px-4 py-3 bg-slate-50/30 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold text-sm">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            Filters
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetAll}
              className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
        </div>
        {lastUpdated && (() => {
          const f = getFreshness(lastUpdated);
          return (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              <span className={`h-1 w-1 rounded-full ${f.dotColor}`} />
              {Math.max(availableProviders.length, 15)} providers · {f.label}
            </div>
          );
        })()}
      </div>

      <div className="px-5 py-5 space-y-6">

        {/* ── Price / Hour ─────────────────────────────────── */}
        <div>
          <SectionLabel title="Price / Hour" tooltip={"Hourly compute rate only.\nStorage and data egress are billed separately and can easily 2–3× the total cost."} />
          <div className="mb-2.5">
            <button
              onClick={() => setFilters((p) => ({ ...p, maxPrice: p.maxPrice === 1 ? 999 : 1 }))}
              className={chip(filters.maxPrice === 1)}
            >
              Under $1/hr
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">$</span>
              <input
                type="number" min="0"
                value={filters.minPrice}
                onChange={(e) => setFilters((p) => ({ ...p, minPrice: Number(e.target.value) }))}
                className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-5 pr-2 py-1.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:border-brand-500 outline-none"
                placeholder="0"
              />
            </div>
            <span className="text-slate-300 dark:text-slate-600 text-sm">–</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">$</span>
              <input
                type="number" min="0"
                value={filters.maxPrice}
                onChange={(e) => setFilters((p) => ({ ...p, maxPrice: Number(e.target.value) }))}
                className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-5 pr-2 py-1.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:border-brand-500 outline-none"
                placeholder="999"
              />
            </div>
          </div>
        </div>

        {/* ── Min VRAM ─────────────────────────────────────── */}
        <div>
          <SectionLabel title="Min VRAM" count={filters.minVram > 0 ? 1 : undefined} tooltip={"Minimum GPU memory (per instance total).\n• 8 GB+: image gen, Stable Diffusion\n• 24 GB+: 7B model inference\n• 48 GB+: 13B fine-tuning, 30B inference\n• 80 GB+: 70B inference, large training runs"} />
          <div className="flex flex-wrap gap-1.5">
            {VRAM_PRESETS.map((gb) => (
              <button
                key={gb}
                onClick={() => setFilters((p) => ({ ...p, minVram: p.minVram === gb ? 0 : gb }))}
                className={chip(filters.minVram === gb)}
              >
                {gb}GB+
              </button>
            ))}
          </div>
        </div>

        {/* ── GPU Count ────────────────────────────────────── */}
        <div>
          <SectionLabel title="GPU Count" count={filters.gpuCounts.length || undefined} tooltip={"Number of GPUs per instance.\n• 1×: image gen, inference, dev work\n• 2–4×: fine-tuning, mid-size training\n• 8×+: large model training (requires tensor parallelism in your code)"} />
          <div className="flex flex-wrap gap-1.5">
            {GPU_COUNT_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => toggleList('gpuCounts', value)}
                className={chip((filters.gpuCounts as number[]).includes(value))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Divider: primary / secondary ─────────────────── */}
        <div className="-mx-4 border-t border-dashed border-slate-100 dark:border-slate-800" />

        {/* ── Provider ─────────────────────────────────────── */}
        <div>
          <SectionLabel title="Provider" count={filters.providers.length || undefined} tooltip={"Filter by specific cloud provider.\nEnterprise (AWS/GCP/Azure) = highest reliability. Marketplace (Vast.ai) = cheapest but variable. Hover badges in the table for details on each provider."} />
          {availableProviders.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Loading…</p>
          ) : (
            <div className="space-y-0.5">
              {availableProviders.map((p) => (
                <Checkbox
                  key={p} label={p}
                  checked={filters.providers.includes(p)}
                  onChange={() => toggleList('providers', p)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── GPU Model ────────────────────────────────────── */}
        <div>
          <SectionLabel title="GPU Model" count={filters.models.length || undefined} tooltip={"Filter by GPU architecture.\nPerformance order (training): H100 > H200 > A100 > L40S > RTX 4090\nFor inference, VRAM matters more than raw compute."} />
          {availableModels.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Loading…</p>
          ) : (
            <div className="space-y-0.5">
              {visibleModels.map((m) => (
                <Checkbox
                  key={m} label={m}
                  checked={filters.models.includes(m)}
                  onChange={() => toggleList('models', m)}
                />
              ))}
              {availableModels.length > MODEL_LIMIT && (
                <button
                  onClick={() => setShowAllModels(!showAllModels)}
                  className="text-xs text-brand-600 dark:text-brand-400 font-semibold pt-1 hover:underline block"
                >
                  {showAllModels
                    ? 'Show less'
                    : `+ ${availableModels.length - MODEL_LIMIT} more models`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Commitment ───────────────────────────────────── */}
        <div>
          <SectionLabel title="Commitment" count={filters.commitment.length || undefined} tooltip={"On-Demand: pay per hour, cancel anytime.\nSpot: cheaper (40–80% off) but can be interrupted with little notice — not suitable for long jobs.\nReserved (1–3yr): significant discount for committing upfront."} />
          <div className="space-y-0.5">
            {Object.values(Commitment).map((c) => (
              <Checkbox
                key={c} label={c}
                checked={filters.commitment.includes(c)}
                onChange={() => toggleList('commitment', c)}
              />
            ))}
          </div>
        </div>

        {/* ── Region ───────────────────────────────────────── */}
        <div>
          <SectionLabel title="Region" count={filters.regions.length || undefined} tooltip={"Datacenter location.\nCloser = lower latency for data uploads.\nMay affect compliance requirements (GDPR, HIPAA)."} />
          {availableRegions.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Loading…</p>
          ) : (
            <div className="space-y-0.5">
              {availableRegions.map((r) => (
                <Checkbox
                  key={r} label={r}
                  checked={filters.regions.includes(r)}
                  onChange={() => toggleList('regions', r)}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Footer: result count ─────────────────────────────── */}
      <div className="px-4 py-2.5 bg-slate-50/30 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.06] text-center">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          <span className="font-bold text-slate-900 dark:text-slate-100">{resultCount.toLocaleString()}</span> results
        </span>
      </div>

    </div>
  );
};
