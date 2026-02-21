import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, ArrowLeft, Server, Cpu, TrendingDown, Globe } from 'lucide-react';
import { GPUInstance } from '../types';
import { SEOHead } from './SEOHead';
import { modelToSlug } from './GPUModelPage';

interface Props {
  data: GPUInstance[];
  isLoading: boolean;
}

export function providerToSlug(provider: string): string {
  return provider.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function slugToProvider(slug: string, providers: string[]): string | null {
  return providers.find(p => providerToSlug(p) === slug) ?? null;
}

// Known provider website URLs for the "Visit Provider" button
const PROVIDER_URLS: Record<string, string> = {
  'RunPod':        'https://runpod.io',
  'Lambda Labs':   'https://lambdalabs.com',
  'Vast.ai':       'https://vast.ai',
  'AWS':           'https://aws.amazon.com/ec2/instance-types/p4/',
  'Azure':         'https://azure.microsoft.com/en-us/pricing/details/virtual-machines/linux/',
  'GCP':           'https://cloud.google.com/compute/gpus-pricing',
  'CoreWeave':     'https://www.coreweave.com/pricing',
  'TensorDock':    'https://www.tensordock.com',
  'DigitalOcean':  'https://www.digitalocean.com/products/gpu-droplets',
  'Nebius':        'https://nebius.com',
  'Vultr':         'https://www.vultr.com/products/cloud-gpu/',
  'FluidStack':    'https://www.fluidstack.io',
  'Cudo Compute':  'https://www.cudocompute.com',
  'HotAisle':      'https://hotaisle.xyz',
  'CloudRift':     'https://cloudrift.ai',
  'Verda':         'https://verda.io',
  'OCI':           'https://www.oracle.com/cloud/compute/gpu/',
  'Scaleway':      'https://www.scaleway.com/en/pricing/gpu/',
  'Hyperstack':    'https://www.hyperstack.cloud/gpu-cloud-pricing',
  'Genesis Cloud': 'https://www.genesis.cloud/gpu-cloud/',
  'OVHcloud':      'https://www.ovhcloud.com/en/public-cloud/gpu/',
  'Crusoe':        'https://crusoe.ai/cloud/pricing/',
  'Latitude.sh':   'https://www.latitude.sh/pricing',
};

export const ProviderPage: React.FC<Props> = ({ data, isLoading }) => {
  const { provider: providerSlug } = useParams<{ provider: string }>();

  const availableProviders = useMemo(() => [...new Set(data.map(d => d.provider))], [data]);
  const providerName = providerSlug ? slugToProvider(providerSlug, availableProviders) : null;

  const instances = useMemo(() =>
    data
      .filter(d => d.provider === providerName)
      .sort((a, b) => a.pricePerHour - b.pricePerHour),
    [data, providerName]
  );

  const stats = useMemo(() => {
    if (!instances.length) return null;
    const prices = instances.map(i => i.pricePerHour);
    const models = [...new Set(instances.map(i => i.model))];
    const regions = [...new Set(instances.map(i => i.region))];
    return {
      min:       Math.min(...prices),
      max:       Math.max(...prices),
      avg:       prices.reduce((a, b) => a + b, 0) / prices.length,
      count:     instances.length,
      models:    models.length,
      modelList: models,
      regions:   regions.length,
      regionList: regions,
    };
  }, [instances]);

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

  if (!providerName || !stats) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <SEOHead
          title={`${providerSlug} GPU Pricing | GPU Tracker`}
          description="Cloud GPU provider not found. Browse all GPU providers on GPU Tracker."
          canonical={`/provider/${providerSlug}`}
        />
        <p className="text-slate-500 dark:text-slate-400 mb-4">Provider not found: <code className="font-mono">{providerSlug}</code></p>
        <Link to="/" className="text-brand-500 hover:underline text-sm">← Back to all GPUs</Link>
      </div>
    );
  }

  const providerUrl = PROVIDER_URLS[providerName];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${providerName} GPU Instances`,
    description: `All ${providerName} GPU cloud instances. ${stats.models} GPU models from $${stats.min.toFixed(2)}/hr.`,
    url: `https://gpu-tracker.dev/provider/${providerSlug}`,
    numberOfItems: stats.count,
    itemListElement: instances.slice(0, 10).map((inst, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: `${inst.provider} ${inst.instanceName} (${inst.model})`,
      description: `$${inst.pricePerHour.toFixed(4)}/hr — ${inst.gpuCount}× ${inst.model}, ${inst.vram * inst.gpuCount}GB VRAM`,
      url: inst.link,
    })),
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEOHead
        title={`${providerName} GPU Prices — ${stats.models} GPU Models From $${stats.min.toFixed(2)}/hr | GPU Tracker`}
        description={`Compare all ${providerName} GPU cloud prices. ${stats.models} GPU models including ${stats.modelList.slice(0, 3).join(', ')}. From $${stats.min.toFixed(2)}/hr. ${stats.count} instances across ${stats.regions} regions. Updated every 6 hours.`}
        canonical={`/provider/${providerSlug}`}
        structuredData={structuredData}
      />

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-6">
        <Link to="/" className="hover:text-brand-500 flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> All Providers
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">{providerName}</span>
      </nav>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {providerName} GPU Pricing
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              {stats.count} GPU instances across {stats.regions} regions.
              {stats.models} GPU models available — from ${stats.min.toFixed(2)}/hr.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {providerUrl && (
              <a
                href={providerUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-track="affiliate_click"
                data-provider={providerName}
                data-source="provider_page"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-sm transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                Visit {providerName}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { icon: TrendingDown, label: 'Starting at',  value: `$${stats.min.toFixed(2)}/hr`,  sub: 'cheapest instance' },
          { icon: Cpu,          label: 'GPU Models',   value: stats.models,                    sub: 'available' },
          { icon: Server,       label: 'Instances',    value: stats.count,                     sub: 'total' },
          { icon: Globe,        label: 'Regions',      value: stats.regions,                   sub: 'covered' },
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

      {/* ── GPU Models Available ───────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">GPU Models at {providerName}</h2>
        <div className="flex flex-wrap gap-2">
          {stats.modelList.map(m => {
            const cheapest = instances.filter(i => i.model === m).sort((a,b) => a.pricePerHour - b.pricePerHour)[0];
            return (
              <Link
                key={m}
                to={`/gpu/${modelToSlug(m)}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card hover:border-brand-400/50 hover:shadow-sm transition-all text-xs"
              >
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{m}</span>
                {cheapest && (
                  <span className="text-brand-600 dark:text-brand-400 font-bold">${cheapest.pricePerHour.toFixed(2)}/hr</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Price Table ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-ink-border overflow-hidden bg-white dark:bg-ink-card">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-ink-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            All {providerName} GPU Instances
          </h2>
          <span className="text-xs text-slate-400">{stats.count} results</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-ink-muted">
                {['GPU Model', 'Instance', 'Count', 'VRAM', 'Region', 'Type', 'Price/hr', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-ink-border">
              {instances.map((inst, i) => (
                <tr key={inst.id} className="gpu-row hover:bg-slate-50 dark:hover:bg-ink-muted/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    {inst.model}
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
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
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

      {/* ── Compare Other Providers ───────────────────────────────────────── */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Compare Other Providers</h2>
        <div className="flex flex-wrap gap-2">
          {availableProviders
            .filter(p => p !== providerName)
            .map(p => (
              <Link
                key={p}
                to={`/provider/${providerToSlug(p)}`}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-ink-border text-slate-600 dark:text-slate-400 hover:border-brand-400/50 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                {p}
              </Link>
            ))}
        </div>
      </div>

      {/* ── SEO FAQ ──────────────────────────────────────────────────────── */}
      <div className="mt-10">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-4">
          {providerName} GPU Cloud — FAQ
        </h2>
        <div className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
          <div>
            <strong className="text-slate-700 dark:text-slate-300">How much does {providerName} charge for GPUs?</strong>
            <p className="mt-1">
              {providerName} GPU instances start from ${stats.min.toFixed(2)}/hr.
              The average price is ${stats.avg.toFixed(2)}/hr. Prices depend on GPU model, region, and commitment type (on-demand vs spot).
            </p>
          </div>
          <div>
            <strong className="text-slate-700 dark:text-slate-300">What GPU models does {providerName} offer?</strong>
            <p className="mt-1">
              {providerName} offers {stats.models} GPU models: {stats.modelList.join(', ')}.
              Browse the full list above to compare prices per model.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
