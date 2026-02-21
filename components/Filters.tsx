import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { FilterState, Commitment } from '../types';
import { Filter, RotateCcw, X, ChevronDown, Search } from 'lucide-react';
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

// ── Searchable multi-select dropdown ─────────────────────────────────────────

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  emptyText?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selected, onChange, placeholder, emptyText = 'No options' }) => {
  const [open, setOpen]             = useState(false);
  const [query, setQuery]           = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef                = useRef<HTMLDivElement>(null);
  const triggerRef                  = useRef<HTMLButtonElement>(null);
  const dropdownRef                 = useRef<HTMLDivElement>(null);
  const inputRef                    = useRef<HTMLInputElement>(null);

  // Recalculate portal position from trigger's bounding rect
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect            = triggerRef.current.getBoundingClientRect();
    const viewportHeight  = window.innerHeight;
    const dropdownHeight  = 280; // search ~40px + max-h-48 (192px) + footer ~48px
    const spaceBelow      = viewportHeight - rect.bottom;
    const openUpward      = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setDropdownStyle({
      position: 'fixed',
      left:     rect.left,
      width:    rect.width,
      zIndex:   9999,
      ...(openUpward
        ? { bottom: viewportHeight - rect.top + 4, top: 'auto' }
        : { top: rect.bottom + 4 }),
    });
  }, []);

  // Attach scroll/resize listeners while open to keep portal aligned
  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('scroll',  updatePosition, true);
    window.addEventListener('resize',  updatePosition);
    return () => {
      window.removeEventListener('scroll',  updatePosition, true);
      window.removeEventListener('resize',  updatePosition);
    };
  }, [open, updatePosition]);

  // Close on outside click — must check both trigger container AND portal div
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current  && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const toggle = useCallback((value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((s) => s !== value)
        : [...selected, value],
    );
  }, [selected, onChange]);

  const remove = useCallback((value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== value));
  }, [selected, onChange]);

  const openDropdown = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const dropdownPanel = open && (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden"
    >
      {/* Search input */}
      <div className="p-2 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full pl-6 pr-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 rounded-md border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Options list */}
      <div className="max-h-48 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-400 px-3 py-2 italic">{emptyText}</p>
        ) : (
          filtered.map((option) => {
            const checked = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggle(option)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                  checked
                    ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className={`h-3.5 w-3.5 shrink-0 rounded border flex items-center justify-center transition-colors ${
                  checked
                    ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {checked && (
                    <svg className="h-2 w-2 text-white dark:text-slate-900" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                {option}
              </button>
            );
          })
        )}
      </div>

      {/* Footer: clear */}
      {selected.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-1.5">
          <button
            type="button"
            onClick={() => { onChange([]); setOpen(false); }}
            className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors"
          >
            Clear {selected.length} selected
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger / tag display */}
      <button
        ref={triggerRef}
        type="button"
        onClick={openDropdown}
        className={`w-full text-left flex items-center gap-1.5 flex-wrap min-h-[34px] px-2.5 py-1.5 rounded-lg border transition-colors text-sm ${
          open
            ? 'border-brand-500 ring-1 ring-brand-500/30 bg-white dark:bg-slate-900'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        {selected.length === 0 ? (
          <span className="text-slate-400 dark:text-slate-500 text-xs flex-1">{placeholder}</span>
        ) : (
          selected.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-semibold px-2 py-0.5 rounded-md"
            >
              {s}
              <button
                type="button"
                onClick={(e) => remove(s, e)}
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 ml-auto shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Render dropdown via portal so it escapes overflow:scroll containers */}
      {typeof document !== 'undefined' && ReactDOM.createPortal(dropdownPanel, document.body)}
    </div>
  );
};

// ── Section label ─────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ title: string; count?: number; tooltip?: string }> = ({ title, count, tooltip }) => (
  <div className="flex items-center justify-between mb-2.5">
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

// ── Chip button ───────────────────────────────────────────────────────────────

const chip = (active: boolean) =>
  `px-3 sm:px-3.5 py-2.5 sm:py-2 text-xs rounded-lg font-semibold border transition-colors min-h-[36px] ${
    active
      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
  }`;

// ── Main component ────────────────────────────────────────────────────────────

export const Filters: React.FC<FiltersProps> = ({
  filters, setFilters, resultCount,
  availableModels, availableProviders, availableRegions, lastUpdated,
}) => {
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

  const resetAll = () => setFilters(DEFAULT_FILTERS);

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
              {availableProviders.length} providers · {f.label}
            </div>
          );
        })()}
      </div>

      <div className="px-5 py-5 space-y-5">

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

        {/* ── Divider ──────────────────────────────────────── */}
        <div className="-mx-4 border-t border-dashed border-slate-100 dark:border-slate-800" />

        {/* ── Provider ─────────────────────────────────────── */}
        <div>
          <SectionLabel
            title="Provider"
            count={filters.providers.length || undefined}
            tooltip={"Filter by specific cloud provider.\nEnterprise (AWS/GCP/Azure) = highest reliability. Marketplace (Vast.ai) = cheapest but variable."}
          />
          <MultiSelect
            options={availableProviders}
            selected={filters.providers}
            onChange={(vals) => setFilters((p) => ({ ...p, providers: vals }))}
            placeholder="All providers"
            emptyText="No providers found"
          />
        </div>

        {/* ── GPU Model ────────────────────────────────────── */}
        <div>
          <SectionLabel
            title="GPU Model"
            count={filters.models.length || undefined}
            tooltip={"Filter by GPU architecture.\nPerformance order (training): H100 > H200 > A100 > L40S > RTX 4090\nFor inference, VRAM matters more than raw compute."}
          />
          <MultiSelect
            options={availableModels}
            selected={filters.models}
            onChange={(vals) => setFilters((p) => ({ ...p, models: vals }))}
            placeholder="All GPU models"
            emptyText="No models found"
          />
        </div>

        {/* ── Commitment ───────────────────────────────────── */}
        <div>
          <SectionLabel title="Commitment" count={filters.commitment.length || undefined} tooltip={"On-Demand: pay per hour, cancel anytime.\nSpot: cheaper (40–80% off) but can be interrupted with little notice — not suitable for long jobs.\nReserved (1–3yr): significant discount for committing upfront."} />
          <div className="flex flex-wrap gap-1.5">
            {Object.values(Commitment).map((c) => (
              <button
                key={c}
                onClick={() => toggleList('commitment', c)}
                className={chip(filters.commitment.includes(c))}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ── Region ───────────────────────────────────────── */}
        <div>
          <SectionLabel
            title="Region"
            count={filters.regions.length || undefined}
            tooltip={"Datacenter location.\nCloser = lower latency for data uploads.\nMay affect compliance requirements (GDPR, HIPAA)."}
          />
          <MultiSelect
            options={availableRegions}
            selected={filters.regions}
            onChange={(vals) => setFilters((p) => ({ ...p, regions: vals }))}
            placeholder="All regions"
            emptyText="No regions found"
          />
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
