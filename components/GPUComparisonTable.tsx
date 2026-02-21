import React from 'react';
import { Availability, GPUInstance, PriceHistory, SortField, SortState, Commitment } from '../types';
import {
  ArrowUpDown, ArrowUp, ArrowDown, ExternalLink,
  Server, ChevronLeft, ChevronRight,
  Calculator, Bell,
} from 'lucide-react';
import {
  getProviderTrust,
  getContinuityScore, getVolatilityInfo, getProcurementFriction,
  getProviderBilling,
} from '../services/gpuUtils';
import { affiliateLink } from '../services/affiliateLinks';
import { Badge, InfoTooltip, Tooltip } from './ui';
import type { BadgeVariant } from './ui';
import { GPUChip } from './GPUChip';

export interface ValueScoreEntry {
  normalized: number | null;
  raw: number | null;
  tflops: number;
  isTopValue?: boolean;
}

interface Props {
  data:          GPUInstance[];
  totalCount:    number;
  sort:          SortState;
  setSort:       React.Dispatch<React.SetStateAction<SortState>>;
  isLoading:     boolean;
  page:          number;
  pageCount:     number;
  setPage:       (p: number) => void;
  onOpenTMC?:    (item: GPUInstance) => void;
  onOpenAlert?:  (item: GPUInstance) => void;
  cheapestPrice?: number;
  valueScores?:  Map<string, ValueScoreEntry>;
  priceHistory?: PriceHistory | null;
}

// ── Risk badge → BadgeVariant mapping ─────────────────────────────────────────

function getRiskVariant(item: GPUInstance): BadgeVariant {
  const score = getContinuityScore(item);
  const vol   = getVolatilityInfo(item);
  if (item.availability === Availability.Out)             return 'out-of-stock';
  if (score >= 75 && vol.level === 'Stable')              return 'stable';
  if (score >= 45 || vol.level === 'Variable')            return 'variable';
  return 'high-risk';
}

// Primary provider badge: billing quirk > friction > trust tier
function getPrimaryBadgeVariant(
  item: GPUInstance,
): { variant: BadgeVariant } {
  const billing = getProviderBilling(item.provider);
  if (billing.billedWhenStopped) return { variant: 'idle-billing' };

  const friction = getProcurementFriction(item.provider, item.model);
  if (friction.level === 'Waitlist')        return { variant: 'waitlist' };
  if (friction.level === 'Quota May Apply') return { variant: 'quota'    };

  const trust = getProviderTrust(item.provider);
  const tier  = trust.tier.toLowerCase() as BadgeVariant;
  return { variant: tier };
}

// ── Risk dot color ────────────────────────────────────────────────────────────

function getRiskDotClass(variant: BadgeVariant): string {
  switch (variant) {
    case 'stable':       return 'bg-emerald-500';
    case 'variable':     return 'bg-amber-500';
    case 'high-risk':    return 'bg-red-500';
    case 'out-of-stock': return 'bg-slate-400';
    default:             return 'bg-slate-400';
  }
}

// ── Sort icons ────────────────────────────────────────────────────────────────

const SortIcon: React.FC<{ field: SortField; sort: SortState }> = ({ field, sort }) => {
  if (sort.field !== field)
    return <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity text-slate-400" />;
  return sort.direction === 'asc'
    ? <ArrowUp   className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
    : <ArrowDown className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />;
};

// ── Pagination ────────────────────────────────────────────────────────────────

const PaginationControls: React.FC<{
  mobile: boolean; page: number; pageCount: number;
  totalCount: number; setPage: (p: number) => void;
}> = ({ mobile, page, pageCount, totalCount, setPage }) => {
  if (pageCount <= 1) return null;

  const wrap = mobile
    ? 'flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-ink-border bg-slate-50/50 dark:bg-white/2 md:hidden'
    : 'hidden md:flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-ink-border bg-slate-50/50 dark:bg-white/2';

  const Btn: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center gap-0.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
    >{children}</button>
  );

  return (
    <div className={wrap}>
      {mobile ? (
        <>
          <Btn onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}><ChevronLeft className="h-3.5 w-3.5" /> Prev</Btn>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{page} / {pageCount}</span>
          <Btn onClick={() => setPage(Math.min(pageCount, page + 1))} disabled={page === pageCount}>Next <ChevronRight className="h-3.5 w-3.5" /></Btn>
        </>
      ) : (
        <>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Showing{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{((page - 1) * 50 + 1).toLocaleString()}–{Math.min(page * 50, totalCount).toLocaleString()}</span>
            {' '}of{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{totalCount.toLocaleString()}</span>
          </span>
          <div className="flex items-center gap-1">
            <Btn onClick={() => setPage(1)}                                         disabled={page === 1}>«</Btn>
            <Btn onClick={() => setPage(Math.max(1, page - 1))}                    disabled={page === 1}><ChevronLeft className="h-3.5 w-3.5" />Prev</Btn>
            {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, pageCount - 4));
              const p     = start + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    p === page
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                      : 'border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}>{p}
                </button>
              );
            })}
            <Btn onClick={() => setPage(Math.min(pageCount, page + 1))} disabled={page === pageCount}>Next<ChevronRight className="h-3.5 w-3.5" /></Btn>
            <Btn onClick={() => setPage(pageCount)}                     disabled={page === pageCount}>»</Btn>
          </div>
        </>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const GPUComparisonTable: React.FC<Props> = ({
  data, totalCount, sort, setSort, isLoading, page, pageCount, setPage,
  onOpenTMC, onOpenAlert, cheapestPrice, valueScores, priceHistory,
}) => {

  const handleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-[60px] bg-white dark:bg-ink-card rounded-xl border border-slate-200 dark:border-ink-border animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-ink-card rounded-xl ring-1 ring-black/[0.06] dark:ring-white/[0.06] shadow-sm py-16 px-6 text-center flex flex-col items-center justify-center">
        <div className="h-12 w-12 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Server className="h-6 w-6 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">No configurations found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Try removing a filter or broadening your search.</p>
      </div>
    );
  }

  // ── Th helper ──────────────────────────────────────────────────────────────
  const ThSortable: React.FC<{
    field: SortField; children: React.ReactNode; align?: 'left' | 'right'; className?: string;
  }> = ({ field, children, align = 'left', className = '' }) => (
    <th
      scope="col"
      onClick={() => handleSort(field)}
      className={`group px-4 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {children}
        <SortIcon field={field} sort={sort} />
      </div>
    </th>
  );

  return (
    <div className="bg-white dark:bg-ink-card rounded-xl ring-1 ring-black/[0.06] dark:ring-white/[0.06] overflow-hidden flex flex-col shadow-[0_1px_3px_0_rgb(0_0_0/_0.08),0_1px_2px_-1px_rgb(0_0_0/_0.08)] dark:shadow-[0_1px_3px_0_rgb(0_0_0/_0.3)]">

      {/* ── Mobile cards ──────────────────────────────────────────────────── */}
      <div className="block md:hidden">
        <div className="bg-slate-50/80 dark:bg-white/3 px-4 py-2.5 border-b border-slate-200 dark:border-ink-border flex justify-between items-center sticky top-[56px] z-10">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{totalCount.toLocaleString()} results</span>
          <button onClick={() => handleSort('pricePerHour')} className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
            Price <ArrowUpDown className="h-3 w-3" />
          </button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-ink-border">
          {data.map((item) => {
            const isCheapest   = cheapestPrice !== undefined && item.pricePerHour === cheapestPrice;
            const riskVariant  = getRiskVariant(item);
            const isSpot       = item.commitment === Commitment.Spot;
            return (
              <div key={item.id} className="p-4 gpu-row">
                {/* Top: GPU chip + model + price */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <GPUChip model={item.model} size="md" />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.model}{item.gpuCount > 1 ? ` ×${item.gpuCount}` : ''}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">{item.provider}</span>
                      {isSpot && <Badge variant="spot" size="xs" />}
                      <span className={`h-2 w-2 rounded-full shrink-0 ${getRiskDotClass(riskVariant)}`} />
                      <Badge variant={riskVariant} size="xs" />
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`block text-lg font-bold font-mono tracking-tight ${isCheapest ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      ${item.pricePerHour.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">/hr · ~${Math.round(item.pricePerHour * 730).toLocaleString()}/mo</span>
                  </div>
                </div>
                {/* Specs row */}
                <div className="flex items-center gap-1.5 sm:gap-3 mb-3 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  <span>{item.vram * item.gpuCount}GB VRAM</span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="truncate max-w-[120px] sm:max-w-none">{item.region}</span>
                  {(() => {
                    const vs = valueScores?.get(item.id);
                    if (vs?.normalized != null) {
                      const c = vs.normalized >= 80 ? 'text-emerald-600 dark:text-emerald-400' : vs.normalized >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500';
                      return <><span className="text-slate-300 dark:text-slate-600">·</span><span className={`font-bold font-mono ${c}`}>{vs.normalized}pt</span></>;
                    }
                    return null;
                  })()}
                </div>
                {/* Actions */}
                <div className="flex gap-2">
                  {onOpenTMC && (
                    <button onClick={() => onOpenTMC(item)} className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-ink-border px-3 min-h-[44px] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-[0.97]">
                      <Calculator className="h-3.5 w-3.5" /> TMC
                    </button>
                  )}
                  {onOpenAlert && (
                    <button onClick={() => onOpenAlert(item)} className="flex items-center justify-center gap-1 rounded-lg border border-amber-200 dark:border-amber-500/30 px-3 min-h-[44px] text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all active:scale-[0.97]">
                      <Bell className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <a
                    href={affiliateLink(item.provider, item.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track="affiliate_click"
                    data-provider={item.provider}
                    data-model={item.model}
                    data-price={item.pricePerHour}
                    data-source="mobile_table"
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 min-h-[44px] text-xs font-bold text-white transition-all active:scale-[0.97] shadow-sm"
                  >
                    Reserve <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
        <PaginationControls mobile={true} page={page} pageCount={pageCount} totalCount={totalCount} setPage={setPage} />
      </div>

      {/* ── Desktop table ─────────────────────────────────────────────────── */}
      {/*
        6 clean columns:
        GPU (model+count) | Provider | VRAM | Risk | Price | Actions
        Fixed widths via table-fixed + colgroup = zero layout shift.
      */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <table className="w-full table-fixed divide-y divide-slate-200 dark:divide-ink-border">

          <colgroup>
            <col style={{ width: '24%'  }} />  {/* GPU model    */}
            <col style={{ width: '15%'  }} />  {/* Provider     */}
            <col style={{ width: '8%'   }} />  {/* VRAM         */}
            <col style={{ width: '10%'  }} />  {/* Risk         */}
            <col style={{ width: '18%'  }} />  {/* Price        */}
            <col style={{ width: '25%'  }} />  {/* Actions      */}
          </colgroup>

          <thead>
            <tr className="bg-slate-50/50 dark:bg-white/2">

              <ThSortable field="model">
                GPU
              </ThSortable>

              <ThSortable field="provider">
                Provider
                <InfoTooltip content={"Cloud provider. Hover the badge for trust tier and billing details."} side="bottom" />
              </ThSortable>

              <ThSortable field="vram">
                VRAM
                <InfoTooltip
                  content={"Total GPU memory.\n• 8–16 GB: image gen, small models\n• 24 GB: 7B inference\n• 48 GB: 13B fine-tuning\n• 80 GB+: 70B inference, training"}
                  side="bottom"
                />
              </ThSortable>

              <ThSortable field="availability">
                Risk
                <InfoTooltip
                  content={"Reliability score.\n• Stable: safe for long jobs\n• Variable: enable checkpointing\n• High Risk: resumable tasks only"}
                  side="bottom"
                />
              </ThSortable>

              <ThSortable field="pricePerHour" align="right">
                Price/Hr
                <InfoTooltip
                  content={"Hourly compute rate only.\nStorage + egress billed separately.\nClick TMC for the full cost breakdown."}
                  side="bottom"
                />
              </ThSortable>

              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>

            </tr>
          </thead>

          <tbody className="bg-white dark:bg-ink-card divide-y divide-slate-100 dark:divide-ink-border">
            {data.map((item) => {
              const isCheapest     = cheapestPrice !== undefined && item.pricePerHour === cheapestPrice;
              const riskVariant    = getRiskVariant(item);
              const { variant: primaryVariant } = getPrimaryBadgeVariant(item);
              const isSpot         = item.commitment === Commitment.Spot;

              return (
                <tr key={item.id} className="group gpu-row">

                  {/* ── GPU Model ────────────────────────────────────── */}
                  <td className="px-4 py-3.5">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <GPUChip model={item.model} />
                      <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate tracking-tight">{item.model}</span>
                        {item.gpuCount > 1 && (
                          <span className="text-[11px] font-mono font-semibold text-slate-400 dark:text-slate-500 shrink-0">×{item.gpuCount}</span>
                        )}
                        {isSpot && <Badge variant="spot" size="xs" />}
                      </div>
                      <span
                        className="text-[10px] text-slate-300 dark:text-slate-600 font-mono truncate block mt-0.5 tracking-tight"
                        title={item.instanceName ?? ''}
                      >
                        {item.instanceName ?? <span className="invisible">–</span>}
                      </span>
                    </div>
                  </td>

                  {/* ── Provider ──────────────────────────────────────── */}
                  <td className="px-4 py-3.5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.provider}</div>
                      <div className="mt-0.5">
                        <Badge variant={primaryVariant} size="xs" />
                      </div>
                    </div>
                  </td>

                  {/* ── VRAM ──────────────────────────────────────────── */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.vram * item.gpuCount}GB</span>
                  </td>

                  {/* ── Risk ──────────────────────────────────────────── */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${getRiskDotClass(riskVariant)}`} />
                      <Badge variant={riskVariant} />
                    </div>
                  </td>

                  {/* ── Price ─────────────────────────────────────────── */}
                  <td className="px-3 py-3.5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isCheapest && <Badge variant="best" size="xs" />}
                      <span className={`text-[15px] font-bold font-mono tracking-tight ${isCheapest ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                        ${item.pricePerHour.toFixed(2)}
                      </span>
                    </div>
                    <Tooltip
                      content={"Estimated at 730 hrs/month.\nClick TMC for storage + egress costs."}
                      side="left"
                    >
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono cursor-help">
                        ~${Math.round(item.pricePerHour * 730).toLocaleString()}/mo
                      </span>
                    </Tooltip>
                  </td>

                  {/* ── Actions ───────────────────────────────────────── */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 justify-end">
                      {onOpenTMC && (
                        <Tooltip content={"True Monthly Cost breakdown"}>
                          <button
                            onClick={() => onOpenTMC(item)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-ink-border text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-400/30 hover:bg-brand-50 dark:hover:bg-brand-400/10 transition-all"
                          >
                            <Calculator className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                      )}
                      {onOpenAlert && (
                        <Tooltip content={"Set a price alert"}>
                          <button
                            onClick={() => onOpenAlert(item)}
                            className="p-1.5 rounded-lg border border-amber-200 dark:border-amber-500/30 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all"
                          >
                            <Bell className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                      )}
                      <Tooltip content={`Deploy on ${item.provider}`} side="left">
                        <a
                          href={affiliateLink(item.provider, item.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-track="affiliate_click"
                          data-provider={item.provider}
                          data-model={item.model}
                          data-price={item.pricePerHour}
                          data-source="desktop_table"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all active:scale-95"
                        >
                          Reserve <ExternalLink className="h-3 w-3" />
                        </a>
                      </Tooltip>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PaginationControls mobile={false} page={page} pageCount={pageCount} totalCount={totalCount} setPage={setPage} />
    </div>
  );
};
