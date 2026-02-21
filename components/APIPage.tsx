import React from 'react';
import { Code, Database, RefreshCw } from 'lucide-react';

const CodeBlock: React.FC<{ children: string }> = ({ children }) => (
  <pre className="bg-slate-950 text-slate-100 rounded-lg p-3 text-[11px] overflow-x-auto leading-relaxed font-mono">
    {children}
  </pre>
);

const Section: React.FC<{ title: string; icon: React.FC<{ className?: string }>; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-brand-500" />
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
    </div>
    {children}
  </div>
);

export const APIPage: React.FC = () => (
  <div className="max-w-2xl mx-auto space-y-5">
    <div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Data API</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Public JSON endpoint — free, no auth, CORS-enabled.
      </p>
    </div>

    {/* Endpoint */}
    <Section title="Endpoint" icon={Code}>
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 font-mono text-xs mb-3">
        <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">GET</span>
        <span className="text-slate-700 dark:text-slate-300 break-all">https://v2-murex-ten.vercel.app/gpu-data.json</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        ~5 MB JSON, updated every 6h via GitHub Actions, served from Vercel CDN. No rate limits.
      </p>
    </Section>

    {/* Response schema */}
    <Section title="Response Schema" icon={Database}>
      <CodeBlock>{`{
  "lastUpdated": "2026-02-21T11:29:22Z",
  "count": 5025,
  "providerCount": 18,
  "modelCount": 66,
  "data": [{
    "id":           "uuid-v5",
    "provider":     "Vast.ai",
    "model":        "RTX3070",
    "gpuCount":     1,
    "vram":         8.0,
    "cpu":          6,
    "ram":          30.0,
    "pricePerHour": 0.013,
    "region":       "US-East",
    "commitment":   "Spot",
    "availability": "High",
    "link":         "https://vast.ai/",
    "lastUpdated":  "2026-02-21T11:29:22Z"
  }]
}`}</CodeBlock>
    </Section>

    {/* Usage examples */}
    <Section title="Examples" icon={Code}>
      <div className="space-y-3">
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">JavaScript</div>
          <CodeBlock>{`const { data } = await fetch('https://v2-murex-ten.vercel.app/gpu-data.json').then(r => r.json());

const cheapH100 = data
  .filter(d => d.model === 'H100')
  .sort((a, b) => a.pricePerHour - b.pricePerHour)[0];`}</CodeBlock>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Python</div>
          <CodeBlock>{`import requests

data = requests.get('https://v2-murex-ten.vercel.app/gpu-data.json').json()['data']
h100s = sorted([d for d in data if d['model'] == 'H100'], key=lambda d: d['pricePerHour'])
for row in h100s[:5]:
    print(row['provider'], row['pricePerHour'])`}</CodeBlock>
        </div>
      </div>
    </Section>

    {/* Data sources */}
    <Section title="Providers" icon={RefreshCw}>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {['AWS', 'Azure', 'GCP', 'OCI', 'Lambda Labs', 'RunPod', 'Vast.ai', 'Vultr', 'Cudo', 'Nebius', 'TensorDock', 'DigitalOcean', 'HotAisle', 'CloudRift', 'Verda', 'Scaleway', 'Hyperstack', 'Genesis Cloud', 'OVHcloud', 'CoreWeave', 'Crusoe', 'Latitude.sh'].map((name) => (
          <span key={name} className="text-xs px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium">{name}</span>
        ))}
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Data sourced via{' '}
        <a href="https://github.com/dstackai/gpuhunt" target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">gpuhunt</a>{' '}
        + custom scrapers. Refreshed every 6 hours.
      </p>
    </Section>
  </div>
);
