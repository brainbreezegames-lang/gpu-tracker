import React from 'react';
import { Cpu, RefreshCw, Database, Globe, GitBranch } from 'lucide-react';

export const AboutPage: React.FC = () => (
  <div className="max-w-2xl mx-auto space-y-5">

    {/* Header */}
    <div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">About GPU Tracker</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        The Kayak for GPU Cloud Computing — real-time price comparison across 15 providers.
      </p>
    </div>

    {/* What is this */}
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Cpu className="h-4 w-4 text-brand-500" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">What is GPU Tracker?</h2>
      </div>
      <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
        <p>
          GPU Tracker aggregates real-time GPU cloud pricing from 15 providers into a single searchable,
          filterable database. Compare H100 spot prices, find the best $/VRAM ratio, or discover
          which cloud has the cheapest A100 instances.
        </p>
        <p>
          Data refreshes every 6 hours via GitHub Actions using the open-source{' '}
          <a href="https://github.com/dstackai/gpuhunt" target="_blank" rel="noreferrer"
            className="text-brand-600 dark:text-brand-400 hover:underline font-medium">gpuhunt</a>{' '}
          library. All pricing is served as a public JSON endpoint — no tracking, no ads, no paywall.
        </p>
      </div>
    </div>

    {/* How it works — streamlined */}
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="h-4 w-4 text-brand-500" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">How It Works</h2>
      </div>
      <div className="space-y-3">
        {[
          { icon: Globe,     title: 'Provider APIs',  desc: 'Queried via gpuhunt — AWS, Azure, GCP, OCI, Lambda Labs, RunPod, Vast.ai, Vultr, Cudo, Nebius, TensorDock, DigitalOcean, HotAisle, CloudRift, Verda.' },
          { icon: RefreshCw, title: 'GitHub Actions',  desc: 'Cron every 6h: fetch, deduplicate, commit JSON.' },
          { icon: Database,  title: 'Static JSON',     desc: 'Single gpu-data.json (~5MB) on Vercel CDN. No database.' },
          { icon: Cpu,       title: 'Client-Side UI',  desc: 'All filtering/sorting runs in your browser — instant, no server calls.' },
        ].map(({ icon: Icon, title, desc }, i) => (
          <div key={title} className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
            <div>
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">{title}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Coverage */}
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Coverage</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {[
          ['AWS',          'EC2 GPU instances'],
          ['Azure',        'NC, ND, NV series'],
          ['GCP',          'A3, A2, N1 GPU'],
          ['OCI',          'Bare metal & VM GPU'],
          ['Lambda Labs',  'A100, H100, H200'],
          ['RunPod',       'Spot & on-demand'],
          ['Vast.ai',      'Marketplace spot'],
          ['Vultr',        'Cloud GPU'],
          ['Cudo Compute', 'On-demand GPU'],
          ['Nebius',       'H100, L40S, T4'],
          ['TensorDock',   'Marketplace GPUs'],
          ['DigitalOcean', 'GPU Droplets'],
          ['HotAisle',     'GPU cloud'],
          ['CloudRift',    'H100, A100'],
          ['Verda',        'GPU cloud'],
        ].map(([provider, note]) => (
          <div key={provider} className="flex items-start gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
            <div>
              <div className="font-semibold text-slate-700 dark:text-slate-300">{provider}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">{note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Disclaimer */}
    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30 p-4">
      <h3 className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1">Disclaimer</h3>
      <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
        Prices may be up to 6 hours old and don't reflect account-specific discounts. Always verify on the provider's site before purchasing.
      </p>
    </div>
  </div>
);
