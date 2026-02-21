import React from 'react';
import { GPUInstance, PriceHistory } from '../types';
import { ExternalLink, Zap, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Badge } from './ui';
import { Sparkline } from './Sparkline';
import { getModelPriceTrend } from '../services/priceHistoryUtils';
import { getContinuityScore } from '../services/gpuUtils';

interface QuickPickCardProps {
  label: string;
  labelBg: string;
  item: GPUInstance;
  valueScore: number | null;
  priceHistory: PriceHistory | null;
  onOpenTMC: (item: GPUInstance) => void;
}

export const QuickPickCard: React.FC<QuickPickCardProps> = ({
  label, labelBg, item, valueScore, priceHistory, onOpenTMC,
}) => {
  const trend = priceHistory ? getModelPriceTrend(priceHistory, item.model) : null;
  const continuity = getContinuityScore(item);
  const riskLabel = continuity >= 75 ? 'Reliable' : continuity >= 45 ? 'Caution' : 'High Risk';
  const riskColor = continuity >= 75 ? 'text-emerald-600 dark:text-emerald-400' : continuity >= 45 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="bg-white dark:bg-ink-card rounded-xl border border-slate-200 dark:border-ink-border p-4 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500/30 transition-all group flex flex-col">
      {/* Header: badge + provider */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${labelBg}`}>{label}</span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{item.provider}</span>
      </div>

      {/* Model + price */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-base font-bold text-slate-900 dark:text-white leading-tight">
            {item.model}{item.gpuCount > 1 ? ` ×${item.gpuCount}` : ''}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {item.vram * item.gpuCount}GB VRAM
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold font-mono text-brand-600 dark:text-brand-400 tracking-tight">
            ${item.pricePerHour.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">per hour</div>
        </div>
      </div>

      {/* Metrics row: value score + risk + sparkline */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {valueScore !== null && (
          <div className="flex items-center gap-1 text-[11px]">
            <Zap className="h-3 w-3 text-brand-500" />
            <span className="font-bold text-slate-700 dark:text-slate-300">{valueScore}</span>
            <span className="text-slate-400 dark:text-slate-500">value</span>
          </div>
        )}
        <span className={`text-[11px] font-semibold ${riskColor}`}>{riskLabel}</span>
        {trend && trend.daysCovered >= 3 && (
          <div className="flex items-center gap-1 ml-auto">
            <Sparkline
              data={trend.minPrices}
              width={44}
              height={14}
              color={trend.trendDirection === 'falling' ? '#10b981' : trend.trendDirection === 'rising' ? '#ef4444' : '#94a3b8'}
            />
            {trend.isHistoricalLow && <Badge variant="30d-low" size="xs" />}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onOpenTMC(item)}
          className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-ink-border text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          True Cost
        </button>
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 px-3 py-2 text-xs font-bold text-white transition-all active:scale-[0.98]"
        >
          Deploy <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
};
