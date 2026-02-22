import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, TrendingDown, Server, Cpu, ArrowLeft, BarChart3 } from 'lucide-react';
import { GPUInstance } from '../types';
import { SEOHead } from './SEOHead';

interface Props {
  data: GPUInstance[];
  isLoading: boolean;
}

// Canonical GPU model name → URL slug
export function modelToSlug(model: string): string {
  return model.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function slugToModel(slug: string, availableModels: string[]): string | null {
  return availableModels.find(m => modelToSlug(m) === slug) ?? null;
}

// Human-friendly GPU name for titles
function niceModelName(model: string): string {
  return model.replace('NVIDIA ', '').replace('AMD ', '');
}

export const GPUModelPage: React.FC<Props> = ({ data, isLoading }) => {
  const { model: modelSlug } = useParams<{ model: string }>();

  const availableModels = useMemo(() => [...new Set(data.map(d => d.model))], [data]);
  const modelName = modelSlug ? slugToModel(modelSlug, availableModels) : null;

  const instances = useMemo(() =>
    data
      .filter(d => d.model === modelName)
      .sort((a, b) => a.pricePerHour - b.pricePerHour),
    [data, modelName]
  );

  const stats = useMemo(() => {
    if (!instances.length) return null;
    const prices = instances.map(i => i.pricePerHour);
    const providers = [...new Set(instances.map(i => i.provider))];
    return {
      min:       Math.min(...prices),
      max:       Math.max(...prices),
      avg:       prices.reduce((a, b) => a + b, 0) / prices.length,
      count:     instances.length,
      providers: providers.length,
      providerList: providers,
      vram:      instances[0]?.vram ?? 0,
    };
  }, [instances]);

  const nice = modelName ? niceModelName(modelName) : modelSlug ?? '';

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-ink-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!modelName || !stats) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <SEOHead
          title={`${modelSlug?.toUpperCase() ?? 'GPU'} Cloud Prices — GPU Tracker`}
          description="GPU model not found. Browse all GPU cloud prices on GPU Tracker."
          canonical={`/gpu/${modelSlug}`}
        />
        <p className="text-slate-500 dark:text-slate-400 mb-4">GPU model not found: <code className="font-mono">{modelSlug}</code></p>
        <Link to="/" className="text-brand-500 hover:underline text-sm">← Back to all GPUs</Link>
      </div>
    );
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${nice} GPU Cloud Prices`,
    description: `Compare ${nice} GPU cloud prices across ${stats.providers} providers. Cheapest from $${stats.min.toFixed(2)}/hr.`,
    url: `https://gpu-tracker.dev/gpu/${modelSlug}`,
    numberOfItems: stats.count,
    itemListElement: instances.slice(0, 10).map((inst, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: `${inst.provider} ${inst.instanceName}`,
      description: `${inst.model} × ${inst.gpuCount} — $${inst.pricePerHour.toFixed(4)}/hr`,
      url: inst.link,
    })),
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEOHead
        title={`${nice} GPU Cloud Price Comparison — From $${stats.min.toFixed(2)}/hr | GPU Tracker`}
        description={`Compare ${nice} GPU cloud prices across ${stats.providers} providers. Cheapest from $${stats.min.toFixed(2)}/hr. ${stats.count} instances from ${stats.providerList.slice(0, 4).join(', ')} and more. Updated every 6 hours.`}
        canonical={`/gpu/${modelSlug}`}
        structuredData={structuredData}
      />

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-6">
        <Link to="/" className="hover:text-brand-500 flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> All GPUs
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-700 dark:text-slate-300">{nice}</span>
      </nav>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {nice} GPU Cloud Prices
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Real-time {nice} pricing across {stats.providers} cloud providers.
              Compare {stats.count} instances — updated every 6 hours.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-3xl font-bold font-mono text-brand-500 price-hero">
              ${stats.min.toFixed(2)}<span className="text-base font-normal text-slate-400">/hr</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">cheapest available</div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { icon: TrendingDown, label: 'Cheapest',   value: `$${stats.min.toFixed(2)}/hr`,  sub: 'right now' },
          { icon: BarChart3,    label: 'Average',    value: `$${stats.avg.toFixed(2)}/hr`,  sub: 'across providers' },
          { icon: Server,       label: 'Providers',  value: stats.providers,                sub: 'carry this GPU' },
          { icon: Cpu,          label: 'Instances',  value: stats.count,                    sub: 'available' },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card px-4 py-3">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
              <Icon className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">{value}</div>
            <div className="text-[11px] text-slate-400">{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Price Table ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-ink-border overflow-hidden bg-white dark:bg-ink-card">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-ink-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            All {nice} Instances — Cheapest First
          </h2>
          <span className="text-xs text-slate-400">{stats.count} results</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-ink-muted">
                {['Provider', 'Instance', 'GPUs', 'VRAM', 'Region', 'Type', 'Price/hr', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-ink-border">
              {instances.map((inst, i) => (
                <tr key={inst.id} className="gpu-row hover:bg-slate-50 dark:hover:bg-ink-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                    {i === 0 && (
                      <span className="mr-2 text-[9px] font-bold bg-brand-400/10 text-brand-600 dark:text-brand-400 border border-brand-400/20 px-1.5 py-0.5 rounded">
                        CHEAPEST
                      </span>
                    )}
                    {inst.provider}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 max-w-[160px] truncate">
                    {inst.instanceName}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{inst.gpuCount}×</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                    {inst.vram * inst.gpuCount}GB
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{inst.region}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      inst.commitment === 'Spot'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-ink-muted dark:text-slate-300'
                    }`}>
                      {inst.commitment}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold font-mono text-brand-600 dark:text-brand-400 whitespace-nowrap">
                    ${inst.pricePerHour.toFixed(4)}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={inst.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-track="affiliate_click"
                      data-provider={inst.provider}
                      data-model={inst.model}
                      data-price={inst.pricePerHour}
                      className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
                    >
                      Rent <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Related Models ────────────────────────────────────────────────── */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Compare Other GPU Models</h2>
        <div className="flex flex-wrap gap-2">
          {availableModels
            .filter(m => m !== modelName)
            .slice(0, 12)
            .map(m => (
              <Link
                key={m}
                to={`/gpu/${modelToSlug(m)}`}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-ink-border text-slate-600 dark:text-slate-400 hover:border-brand-400/50 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-mono"
              >
                {niceModelName(m)}
              </Link>
            ))}
        </div>
      </div>

      {/* ── FAQ / SEO content ─────────────────────────────────────────────── */}
      <div className="mt-10 prose prose-sm dark:prose-invert max-w-none">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-4">
          {nice} GPU Cloud Rental — Frequently Asked Questions
        </h2>
        <div className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
          <div>
            <strong className="text-slate-700 dark:text-slate-300">What is the cheapest {nice} cloud GPU?</strong>
            <p className="mt-1">
              The cheapest {nice} instance is currently ${stats.min.toFixed(2)}/hr on {instances[0]?.provider}.
              Prices vary by region, commitment type, and availability. Spot instances are often 30–70% cheaper than on-demand.
            </p>
          </div>
          <div>
            <strong className="text-slate-700 dark:text-slate-300">How many providers offer the {nice}?</strong>
            <p className="mt-1">
              {stats.providers} cloud providers currently offer the {nice}: {stats.providerList.join(', ')}.
              GPU Tracker monitors {stats.count} active {nice} instances across these providers and updates every 6 hours.
            </p>
          </div>
          <div>
            <strong className="text-slate-700 dark:text-slate-300">What VRAM does the {nice} have?</strong>
            <p className="mt-1">
              The {nice} has {stats.vram}GB of VRAM per GPU. Multi-GPU instances up to {Math.max(...instances.map(i => i.gpuCount))}×
              are available, giving up to {stats.vram * Math.max(...instances.map(i => i.gpuCount))}GB total VRAM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
