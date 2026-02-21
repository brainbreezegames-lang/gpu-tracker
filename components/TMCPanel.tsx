import React, { useState, useEffect, useCallback } from 'react';
import { X, ExternalLink, AlertTriangle, CheckCircle, Info, HardDrive, Wifi, Database } from 'lucide-react';
import { GPUInstance } from '../types';
import { calcTMC, getProviderBilling, getContinuityScore, getContinuityLabel, timeToHydrate } from '../services/gpuUtils';

interface TMCPanelProps {
  item: GPUInstance;
  onClose: () => void;
}

export const TMCPanel: React.FC<TMCPanelProps> = ({ item, onClose }) => {
  const [hoursPerWeek, setHoursPerWeek] = useState(40);
  const [storageGB,    setStorageGB]    = useState(100);
  const [egressGB,     setEgressGB]     = useState(50);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const tmc      = calcTMC(item, hoursPerWeek, storageGB, egressGB);
  const billing  = getProviderBilling(item.provider);
  const contScore = getContinuityScore(item);
  const contLabel = getContinuityLabel(contScore);
  const hydrate  = billing.networkBandwidthGbps
    ? timeToHydrate(storageGB, billing.networkBandwidthGbps)
    : null;

  const hoursPerMonth = hoursPerWeek * 4.33;

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative slide-in-right w-full max-w-[100vw] sm:max-w-md h-full bg-white dark:bg-ink-card border-l border-slate-200 dark:border-ink-border overflow-y-auto custom-scrollbar flex flex-col shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-ink-card border-b border-slate-100 dark:border-ink-border px-5 py-4 flex items-start justify-between">
          <div>
            <div className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">True Monthly Cost</div>
            <div className="font-display font-bold text-slate-900 dark:text-white text-lg leading-tight">{item.model}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.provider} · {item.region}</div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0 mt-0.5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-5">

          {/* ── Sliders ──────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Usage</div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">Hours per week</span>
                <span className="font-bold font-mono text-brand-600 dark:text-brand-400">{hoursPerWeek}h</span>
              </div>
              <input
                type="range" min={1} max={168} value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="w-full accent-brand-500 h-1.5 rounded-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                <span>1h</span><span>40h (biz)</span><span>168h (24/7)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">Storage</span>
                <span className="font-bold font-mono text-brand-600 dark:text-brand-400">{storageGB} GB</span>
              </div>
              <input
                type="range" min={10} max={2000} step={10} value={storageGB}
                onChange={(e) => setStorageGB(Number(e.target.value))}
                className="w-full accent-brand-500 h-1.5 rounded-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                <span>10GB</span><span>500GB</span><span>2TB</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">Egress <span className="hidden sm:inline font-normal text-slate-400">(outbound)</span></span>
                <span className="font-bold font-mono text-brand-600 dark:text-brand-400">{egressGB} GB</span>
              </div>
              <input
                type="range" min={0} max={500} step={5} value={egressGB}
                onChange={(e) => setEgressGB(Number(e.target.value))}
                className="w-full accent-brand-500 h-1.5 rounded-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                <span>0</span><span>100GB</span><span>500GB</span>
              </div>
            </div>
          </div>

          {/* ── Cost Breakdown ───────────────────────────────────── */}
          <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-ink-border overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-ink-border">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cost Breakdown</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{hoursPerMonth.toFixed(0)}h/mo @ ${item.pricePerHour.toFixed(2)}/hr</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-ink-border">
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">GPU compute</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">${tmc.gpuCostMonthly.toFixed(0)}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                  Storage ({storageGB}GB)
                  {billing.storageCostPerGBMonth === 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 px-1.5 py-0.5 rounded font-semibold">INCLUDED</span>
                  )}
                </div>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">${tmc.storageCostMonthly.toFixed(0)}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <Wifi className="h-3.5 w-3.5 text-slate-400" />
                  Egress ({egressGB}GB)
                  {billing.egressCostPerGB === 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 px-1.5 py-0.5 rounded font-semibold">FREE</span>
                  )}
                </div>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">${tmc.egressCostMonthly.toFixed(0)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="bg-brand-50 dark:bg-brand-400/10 px-4 py-3 border-t border-brand-200 dark:border-brand-400/20">
              <div className="flex justify-between items-baseline">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">TRUE MONTHLY</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">${tmc.effectiveHourly.toFixed(3)}/hr effective</div>
                </div>
                <div className="text-2xl font-bold font-mono price-hero text-brand-600 dark:text-brand-400">
                  ${tmc.totalMonthly.toFixed(0)}
                </div>
              </div>
            </div>
          </div>

          {/* ── Continuity Score ─────────────────────────────────── */}
          <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-ink-border px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reliability Score</div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${contLabel.bg}`}>{contLabel.label}</span>
            </div>
            <div className="relative h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                  contScore >= 75 ? 'bg-emerald-500' : contScore >= 45 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${contScore}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
              <span>0 High Risk</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{contScore}/100</span>
              <span>100 Reliable</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              {contLabel.risk === 'low'    && 'Low interruption risk — reliable for long-running jobs.'}
              {contLabel.risk === 'medium' && 'Moderate risk — spot or emerging provider. Enable checkpointing.'}
              {contLabel.risk === 'high'   && 'High risk — job may be interrupted. Only use spot for short tasks.'}
            </div>
          </div>

          {/* ── Provider Info ─────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Billing Details</div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-ink-border">
              <Database className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{billing.diskType}</div>
                {!billing.persistentDisk && (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                    ⚠ Ephemeral — data lost when stopped
                  </div>
                )}
              </div>
            </div>

            {billing.billedWhenStopped && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Billed even when stopped — GPU cost runs continuously
                </div>
              </div>
            )}

            {billing.storageWarning && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs text-red-700 dark:text-red-400 font-medium">{billing.storageWarning}</div>
              </div>
            )}

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-ink-border">
              <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{billing.billingNote}</div>
            </div>

            {hydrate && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-ink-border">
                <Wifi className="h-4 w-4 text-brand-500 shrink-0" />
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Time to hydrate {storageGB}GB at {billing.networkBandwidthGbps}Gbps:{' '}
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">{hydrate}</span>
                </div>
              </div>
            )}

            {billing.complianceClaims.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {billing.complianceClaims.map((c) => (
                  <span key={c} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                    <CheckCircle className="h-2.5 w-2.5" /> {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── CTA footer ───────────────────────────────────────────── */}
        <div className="sticky bottom-0 bg-white dark:bg-ink-card border-t border-slate-100 dark:border-ink-border p-4">
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98]"
          >
            <span className="hidden sm:inline">Reserve at This Price —</span><span className="sm:hidden">Reserve —</span> {item.provider} <ExternalLink className="h-4 w-4" />
          </a>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-2 font-mono">
            ${item.pricePerHour.toFixed(2)}/hr · ${tmc.totalMonthly.toFixed(0)}/mo true cost
          </div>
        </div>
      </div>
    </div>
  );
};
