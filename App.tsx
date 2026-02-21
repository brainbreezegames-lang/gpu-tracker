import React, { useEffect, useState, useMemo, useCallback, useDeferredValue } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { GPUModelPage } from './components/GPUModelPage';
import { ProviderPage } from './components/ProviderPage';
import { Header, TabId } from './components/Header';
import { Filters } from './components/Filters';
import { GPUComparisonTable } from './components/GPUComparisonTable';
import { Footer } from './components/Footer';
import { TrendsPage } from './components/TrendsPage';
import { APIPage } from './components/APIPage';
import { AboutPage } from './components/AboutPage';
import { LandingPage } from './components/LandingPage';
import { WorkloadRecipesPage } from './components/WorkloadRecipesPage';
import { TMCPanel } from './components/TMCPanel';
import { ProModal, ProModalVariant } from './components/ProModal';
import { fetchGPUData, fetchPriceHistory, filterData, sortData } from './services/gpuDataService';
import {
  exportToCSV, encodeFiltersToHash, decodeFiltersFromHash,
  getPredictableScore, getFrictionScore, getValueScoreRaw, getFreshness,
} from './services/gpuUtils';
import { FilterState, GPUInstance, PriceHistory, SortState, Commitment, Availability } from './types';
import type { ValueScoreEntry } from './components/GPUComparisonTable';
import {
  Search, X, Cpu,
  SlidersHorizontal, Sparkles, DollarSign,
  Share2, Download, CheckCircle, Zap,
  ExternalLink, Shield, Clock, Bell,
} from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { Tooltip } from './components/ui';

const PAGE_SIZE = 50;

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

// ── Ranking Mode ──────────────────────────────────────────────────────────────
type RankMode = 'cheapest' | 'predictable' | 'fast';

function applyRankMode(data: GPUInstance[], mode: RankMode): GPUInstance[] {
  if (mode === 'cheapest')    return data;
  if (mode === 'predictable') return [...data].sort((a, b) => getPredictableScore(a) - getPredictableScore(b));
  if (mode === 'fast')        return [...data].sort((a, b) => getFrictionScore(a) - getFrictionScore(b));
  return data;
}

const RANK_MODES: { id: RankMode; label: string; icon: React.FC<{ className?: string }>; tooltip: string }[] = [
  { id: 'cheapest',    label: 'Cheapest',     icon: DollarSign, tooltip: 'Sort by lowest hourly price.' },
  { id: 'predictable', label: 'Predictable',  icon: Shield,     tooltip: 'Prefers on-demand, no surprise costs.' },
  { id: 'fast',        label: 'Fast Start',   icon: Clock,      tooltip: 'No waitlists or quota requests.' },
];

// ── Workload Presets ──────────────────────────────────────────────────────────
interface WorkloadPreset {
  id: string; label: string; icon: React.FC<{ className?: string }>; apply: () => FilterState; tooltip: string;
}

const WORKLOADS: WorkloadPreset[] = [
  { id: 'llm-train', label: 'LLM Training',  icon: Cpu,
    apply: () => ({ ...DEFAULT_FILTERS, minVram: 80, gpuCounts: [4, -1] }),
    tooltip: '80GB+ VRAM, 4× or 8×+ GPUs for tensor parallelism.' },
  { id: 'llm-infer', label: 'Inference',     icon: Zap,
    apply: () => ({ ...DEFAULT_FILTERS, minVram: 24 }),
    tooltip: '24GB+ VRAM for 7B models or 13B quantized.' },
  { id: 'fine-tune', label: 'Fine-Tuning',   icon: SlidersHorizontal,
    apply: () => ({ ...DEFAULT_FILTERS, minVram: 48 }),
    tooltip: '48GB+ VRAM for LoRA or full fine-tuning.' },
  { id: 'img-gen',   label: 'Image / Video', icon: Sparkles,
    apply: () => ({ ...DEFAULT_FILTERS, gpuCounts: [1] }),
    tooltip: 'Single GPU. Pick by VRAM: 8GB SD1.5, 16GB SDXL, 24GB FLUX.' },
  { id: 'budget',    label: 'Under $1/hr',   icon: DollarSign,
    apply: () => ({ ...DEFAULT_FILTERS, maxPrice: 1 }),
    tooltip: 'Budget instances for dev work and experiments.' },
];

// ── Quick Pick Card (inline, compact) ────────────────────────────────────────
const QuickPick: React.FC<{
  label: string; labelClass: string; item: GPUInstance;
  onOpenTMC: (item: GPUInstance) => void;
}> = ({ label, labelClass, item, onOpenTMC }) => (
  <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card hover:border-brand-300 dark:hover:border-brand-500/30 hover:shadow-sm transition-all group min-w-0">
    <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${labelClass}`}>{label}</span>
    <div className="min-w-0 flex-1">
      <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">{item.model}{item.gpuCount > 1 ? ` ×${item.gpuCount}` : ''}</span>
      <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">{item.provider} · {item.vram * item.gpuCount}GB</span>
    </div>
    <span className="text-sm font-bold font-mono text-brand-600 dark:text-brand-400 shrink-0">${item.pricePerHour.toFixed(2)}<span className="text-[10px] text-slate-400 font-normal">/hr</span></span>
    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => onOpenTMC(item)} className="text-[10px] text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 font-medium">TMC</button>
      <a href={item.link} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-brand-500 dark:hover:text-brand-400">
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  </div>
);

// ── Alert Capture Bar ─────────────────────────────────────────────────────────
const AlertCaptureBar: React.FC<{
  onOpenAlert: (item: GPUInstance) => void;
  data: GPUInstance[];
}> = ({ onOpenAlert, data }) => {
  const cheapest = useMemo(
    () =>
      [...data]
        .filter((d) => d.availability !== Availability.Out)
        .sort((a, b) => a.pricePerHour - b.pricePerHour)[0] ?? data[0],
    [data],
  );
  if (!cheapest) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-brand-200 dark:border-brand-500/20 bg-brand-50/50 dark:bg-brand-500/5">
      <Bell className="h-4 w-4 text-brand-500 dark:text-brand-400 shrink-0" />
      <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 min-w-0">
        <span className="font-semibold">Price drop alerts</span>
        <span className="hidden sm:inline text-slate-500 dark:text-slate-400"> — get emailed when GPU prices hit your target</span>
      </span>
      <button
        onClick={() => onOpenAlert(cheapest)}
        className="shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors"
      >
        Set Alert
      </button>
    </div>
  );
};

// ── Comparison Page ───────────────────────────────────────────────────────────
const ComparisonPage: React.FC<{
  data: GPUInstance[];
  isLoading: boolean;
  lastUpdated: string | null;
  priceHistory: PriceHistory | null;
  onOpenTMC: (item: GPUInstance) => void;
  onOpenAlert: (item: GPUInstance) => void;
}> = ({ data, isLoading, lastUpdated, priceHistory, onOpenTMC, onOpenAlert }) => {

  const [filters,       setFilters]       = useState<FilterState>(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#q=')) {
      const decoded = decodeFiltersFromHash(window.location.hash.slice(3));
      if (decoded) return { ...DEFAULT_FILTERS, ...decoded };
    }
    return DEFAULT_FILTERS;
  });
  const [sort,           setSort]           = useState<SortState>({ field: 'pricePerHour', direction: 'asc' });
  const [rankMode,       setRankMode]       = useState<RankMode>('cheapest');
  const [page,           setPage]           = useState(1);
  const [copied,         setCopied]         = useState(false);
  const [activeWorkload, setActiveWorkload] = useState<string>('all');

  // ── Debounced search: keep input snappy, defer expensive filterData ────────
  const [searchInput, setSearchInput] = useState(() => filters.search);
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((p) => (p.search === searchInput ? p : { ...p, search: searchInput }));
    }, 160);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Deferred filters: React defers this computation, paint stays smooth ────
  const deferredFilters = useDeferredValue(filters);

  const availableModels    = useMemo(() => [...new Set(data.map((d) => d.model))].sort(),    [data]);
  const availableProviders = useMemo(() => [...new Set(data.map((d) => d.provider))].sort(), [data]);
  const availableRegions   = useMemo(() => [...new Set(data.map((d) => d.region))].sort(),   [data]);

  // ── Two-stage pipeline: filter first, then sort/rank ──────────────────────
  // Separating these prevents filterData (O(n) over 12k items) from re-running
  // on sort-only changes — which previously caused unnecessary full re-scans.
  const filteredData = useMemo(
    () => filterData(data, deferredFilters),
    [data, deferredFilters],
  );

  const processedData = useMemo(
    () => applyRankMode(sortData(filteredData, sort), rankMode),
    [filteredData, sort, rankMode],
  );
  useEffect(() => { setPage(1); }, [filters, sort, rankMode]);

  const pageCount     = Math.ceil(processedData.length / PAGE_SIZE);
  const paginatedData = useMemo(
    () => processedData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [processedData, page],
  );
  const handleSetPage = useCallback((p: number) => setPage(p), []);

  const cheapestInView = useMemo(
    () => paginatedData.length ? Math.min(...paginatedData.map((d) => d.pricePerHour)) : undefined,
    [paginatedData],
  );

  // ── Value Scores (normalized 0–100) ──────────────────────────────────────
  // Depends on filteredData (not processedData) — sort order doesn't change
  // scores, so we avoid recomputing on every sort click.
  const valueScores = useMemo(() => {
    const map = new Map<string, ValueScoreEntry>();
    const results: { id: string; model: string; raw: number | null; tflops: number; hasTflops: boolean }[] = [];
    let maxRaw = 0;

    for (const item of filteredData) {
      const vs = getValueScoreRaw(item);
      results.push({ id: item.id, model: item.model, raw: vs.raw, tflops: vs.tflops, hasTflops: vs.hasTflops });
      if (vs.raw !== null && vs.raw > maxRaw) maxRaw = vs.raw;
    }

    const bestPerModel = new Map<string, { id: string; raw: number }>();
    for (const { id, model, raw } of results) {
      if (raw === null) continue;
      const existing = bestPerModel.get(model);
      if (!existing || raw > existing.raw) bestPerModel.set(model, { id, raw });
    }

    for (const { id, raw, tflops } of results) {
      const normalized = raw !== null && maxRaw > 0 ? Math.round((raw / maxRaw) * 100) : null;
      const isTopValue = raw !== null && results.length > 10 &&
        [...bestPerModel.values()].some((best) => best.id === id);
      map.set(id, { normalized, raw, tflops, isTopValue });
    }
    return map;
  }, [filteredData]);

  const bestPicks = useMemo(() => {
    if (!data.length) return null;
    const live = data.filter((d) => d.availability !== Availability.Out);

    const withVram = live
      .filter((d) => d.vram > 0)
      .map((d) => ({ ...d, dpv: d.pricePerHour / (d.vram * d.gpuCount) }))
      .sort((a, b) => a.dpv - b.dpv);

    const h100 = live
      .filter((d) => /H100/i.test(d.model) && d.commitment !== Commitment.Spot)
      .sort((a, b) => a.pricePerHour - b.pricePerHour);

    const spot = live
      .filter((d) => d.commitment === Commitment.Spot && d.vram >= 24 && d.availability === Availability.High)
      .sort((a, b) => a.pricePerHour - b.pricePerHour);

    return {
      value: withVram[0] ?? null,
      h100:  h100[0]     ?? null,
      spot:  spot[0]     ?? null,
    };
  }, [data]);

  const handleShare = useCallback(() => {
    const hash = '#q=' + encodeFiltersToHash(filters);
    const url  = window.location.origin + window.location.pathname + hash;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [filters]);

  const handleExport = useCallback(() => exportToCSV(processedData, 'gpu-prices.csv'), [processedData]);

  return (
    <div className="space-y-3">

      {/* ── Search ──────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
          placeholder="Search GPU, provider, or instance type…"
          className="w-full rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card shadow-sm pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-200 dark:focus:ring-white/10 outline-none transition-all"
        />
        {filters.search && (
          <button
            onClick={() => setFilters((p) => ({ ...p, search: '' }))}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Toolbar: workloads + rank + actions (single row) ──── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Workload presets */}
        <button
          onClick={() => { setFilters(DEFAULT_FILTERS); setActiveWorkload('all'); }}
          className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
            activeWorkload === 'all'
              ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
              : 'border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
          }`}
        >
          All
        </button>
        {WORKLOADS.map(({ id, label, icon: Icon, apply, tooltip }) => (
          <Tooltip key={id} content={tooltip} side="bottom">
            <button
              onClick={() => { setFilters(apply()); setActiveWorkload(id); }}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                activeWorkload === id
                  ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                  : 'border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="h-3 w-3 shrink-0" />{label}
            </button>
          </Tooltip>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Rank mode toggle */}
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-white/5 rounded-lg p-0.5 border border-slate-200 dark:border-ink-border">
          {RANK_MODES.map(({ id, label, icon: Icon, tooltip }) => (
            <Tooltip key={id} content={tooltip} side="bottom">
              <button
                onClick={() => setRankMode(id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                  rankMode === id
                    ? 'bg-white dark:bg-ink-card text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-ink-border'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`h-3 w-3 shrink-0 ${rankMode === id ? 'text-brand-500' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            </Tooltip>
          ))}
        </div>

        {/* Share + Export */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors font-medium"
        >
          {copied ? <><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Copied</> : <><Share2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Share</span></>}
        </button>
        <button
          onClick={handleExport}
          className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors font-medium"
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
      </div>

      {/* ── Stats bar — trust signals ─────────────────────────── */}
      {!isLoading && data.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 px-0.5 flex-wrap">

          {/* Live count — trust signal */}
          <span className="flex items-center gap-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">{data.length.toLocaleString()}</span>
            <span>instances</span>
          </span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {[...new Set(data.map(d => d.provider))].length}
            </span> providers
          </span>

          {/* Freshness */}
          {lastUpdated && (() => {
            const f = getFreshness(lastUpdated);
            return (
              <>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className={`flex items-center gap-1 ${f.textColor}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${f.dotColor} ${f.level === 'live' ? 'animate-pulse' : ''}`} />
                  {f.label}
                </span>
              </>
            );
          })()}

          {/* Best value quick signal */}
          {bestPicks?.value && (
            <>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="hidden sm:inline">
                Best $/VRAM: <span className="font-bold text-brand-600 dark:text-brand-400">${bestPicks.value.pricePerHour.toFixed(2)}/hr</span> {bestPicks.value.model} @ {bestPicks.value.provider}
              </span>
            </>
          )}

          {/* Filtered count */}
          {processedData.length !== data.length && (
            <>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="font-medium text-brand-600 dark:text-brand-400">{processedData.length.toLocaleString()} matching filters</span>
            </>
          )}
        </div>
      )}

      {/* ── Price Alert Capture Bar ───────────────────────────── */}
      {!isLoading && data.length > 0 && (
        <AlertCaptureBar onOpenAlert={onOpenAlert} data={data} />
      )}

      {/* ── Main grid: Filters + Table ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:items-start">
        <aside className="lg:col-span-3 lg:sticky lg:top-20 lg:self-start">
          <div className="lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-scroll overscroll-contain custom-scrollbar pb-4">
          <Filters
            filters={filters}
            setFilters={setFilters}
            resultCount={processedData.length}
            availableModels={availableModels}
            availableProviders={availableProviders}
            availableRegions={availableRegions}
            lastUpdated={lastUpdated}
          />
          </div>
        </aside>
        <div className="lg:col-span-9">
          <GPUComparisonTable
            data={paginatedData}
            totalCount={processedData.length}
            sort={sort}
            setSort={setSort}
            isLoading={isLoading}
            page={page}
            pageCount={pageCount}
            setPage={handleSetPage}
            onOpenTMC={onOpenTMC}
            onOpenAlert={onOpenAlert}
            cheapestPrice={cheapestInView}
            valueScores={valueScores}
            priceHistory={priceHistory}
          />
        </div>
      </div>
    </div>
  );
};

// ── Tab ↔ Route mapping ───────────────────────────────────────────────────────
const TAB_ROUTES: Record<TabId, string> = {
  comparison: '/',
  trends:     '/trends',
  recipes:    '/recipes',
  pricing:    '/pricing',
  api:        '/api-docs',
  about:      '/about',
};

const ROUTE_TABS: Record<string, TabId> = Object.fromEntries(
  Object.entries(TAB_ROUTES).map(([k, v]) => [v, k as TabId])
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [data,         setData]         = useState<GPUInstance[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [lastUpdated,  setLastUpdated]  = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory | null>(null);
  const [tmcItem,      setTmcItem]      = useState<GPUInstance | null>(null);
  const [proVariant,   setProVariant]   = useState<ProModalVariant | null>(null);
  const [alertCtx,     setAlertCtx]     = useState<{ model?: string; provider?: string; pricePerHour?: number } | undefined>(undefined);

  const navigate = useNavigate();
  const location = useLocation();

  // Derive active tab from current URL
  const activeTab: TabId = ROUTE_TABS[location.pathname] ?? 'comparison';

  const setActiveTab = useCallback((tab: TabId) => {
    navigate(TAB_ROUTES[tab]);
  }, [navigate]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true); setError(null);
      try {
        const [fetched, history] = await Promise.all([fetchGPUData(), fetchPriceHistory()]);
        setData(fetched);
        setPriceHistory(history);
        if (fetched.length > 0) setLastUpdated(fetched[0].lastUpdated);
      } catch (err) {
        setError('Could not load pricing data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleOpenTMC  = useCallback((item: GPUInstance) => setTmcItem(item),  []);
  const handleCloseTMC = useCallback(() => setTmcItem(null), []);
  const handleOpenPro  = useCallback((v: ProModalVariant) => setProVariant(v), []);
  const handleClosePro = useCallback(() => { setProVariant(null); setAlertCtx(undefined); }, []);
  const handleOpenAlert = useCallback((item: GPUInstance) => {
    setAlertCtx({ model: item.model, provider: item.provider, pricePerHour: item.pricePerHour });
    setProVariant('alert');
  }, []);

  // Check if we're on a programmatic SEO page (not a tab page)
  const isTabPage = Object.values(TAB_ROUTES).includes(location.pathname) || location.pathname === '/';

  return (
    <div className="min-h-screen bg-cream dark:bg-ink flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className={`flex-grow ${activeTab === 'pricing' && isTabPage ? '' : 'max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        {error && isTabPage && (
          <div className="max-w-[1400px] mx-auto px-4 mb-6 mt-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-5 py-4 text-sm text-red-700 dark:text-red-400 font-mono">
            {error}
          </div>
        )}

        <Routes>
          {/* ── Tab pages ─────────────────────────────────────────────── */}
          <Route path="/" element={
            <ComparisonPage
              data={data} isLoading={isLoading} lastUpdated={lastUpdated}
              priceHistory={priceHistory} onOpenTMC={handleOpenTMC} onOpenAlert={handleOpenAlert}
            />
          } />
          <Route path="/trends"   element={<TrendsPage data={data} isLoading={isLoading} />} />
          <Route path="/recipes"  element={<WorkloadRecipesPage data={data} isLoading={isLoading} />} />
          <Route path="/pricing"  element={
            <LandingPage
              onStartPro={() => alert('Pro is coming soon! Join the waitlist.')}
              onTryDemo={() => setActiveTab('comparison')}
            />
          } />
          <Route path="/api-docs" element={<APIPage />} />
          <Route path="/about"    element={<AboutPage />} />

          {/* ── Programmatic SEO pages ─────────────────────────────────── */}
          <Route path="/gpu/:model"        element={<GPUModelPage  data={data} isLoading={isLoading} />} />
          <Route path="/provider/:provider" element={<ProviderPage  data={data} isLoading={isLoading} />} />
        </Routes>
      </main>

      {activeTab !== 'pricing' && isTabPage && <Footer />}
      {tmcItem && <TMCPanel item={tmcItem} onClose={handleCloseTMC} />}
      {proVariant && (
        <ProModal
          variant={proVariant}
          context={alertCtx}
          data={data}
          onClose={handleClosePro}
          onStartPro={() => { handleClosePro(); setActiveTab('pricing'); }}
        />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <Dashboard />
  </ThemeProvider>
);

export default App;
