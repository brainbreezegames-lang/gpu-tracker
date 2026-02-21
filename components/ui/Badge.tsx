/**
 * Design System — Badge
 *
 * Single source of truth for every badge in the app.
 * Each variant has a built-in tooltip so the meaning is always one hover away.
 *
 * Usage:
 *   <Badge variant="spot" />
 *   <Badge variant="stable" size="sm" />
 *   <Badge variant="best" showTooltip={false} />
 */

import React from 'react';
import { Tooltip } from './Tooltip';

// ── Variant definitions ───────────────────────────────────────────────────────

export type BadgeVariant =
  // Pricing type
  | 'spot'
  // Price highlight
  | 'best'
  // Provider billing quirks
  | 'idle-billing' | 'quota' | 'waitlist'
  // Risk / continuity
  | 'stable' | 'variable' | 'high-risk' | 'out-of-stock'
  // Value + Trends
  | 'top-value' | '30d-low'
  // Provider trust tier
  | 'enterprise' | 'established' | 'marketplace' | 'emerging';

interface BadgeDef {
  label:   string;
  classes: string;
  tooltip: string;
}

export const BADGE_DEFS: Record<BadgeVariant, BadgeDef> = {

  // ── Pricing type ────────────────────────────────────────────────────────────
  'spot': {
    label:   'Spot',
    classes: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20',
    tooltip: 'Spot pricing — price can change hourly and instance may be interrupted with minimal notice.\nOnly use for short, fault-tolerant, or resumable tasks.',
  },

  // ── Price highlight ─────────────────────────────────────────────────────────
  'best': {
    label:   'BEST',
    classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 uppercase tracking-widest',
    tooltip: 'Cheapest option matching your current filters and sort.',
  },

  // ── Provider billing quirks ─────────────────────────────────────────────────
  'idle-billing': {
    label:   'Idle Billing',
    classes: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
    tooltip: 'Billed even when stopped — compute charges run continuously.\nAlways terminate (don\'t just stop) to avoid surprise bills.',
  },
  'quota': {
    label:   'Quota May Apply',
    classes: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    tooltip: 'Enterprise cloud with GPU quota limits.\nYou may need to request a quota increase — this can take hours to days to approve.',
  },
  'waitlist': {
    label:   'Waitlist',
    classes: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    tooltip: 'Not self-serve — requires contacting sales or joining a waitlist before you can provision GPUs.',
  },

  // ── Risk / continuity ───────────────────────────────────────────────────────
  'stable': {
    label:   'Stable',
    classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    tooltip: 'High reliability score.\nOn-demand pricing, established provider, strong availability. Safe for long-running jobs and overnight training.',
  },
  'variable': {
    label:   'Variable',
    classes: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    tooltip: 'Moderate reliability.\nSpot pricing or newer provider — enable checkpointing. Job may be interrupted.',
  },
  'high-risk': {
    label:   'High Risk',
    classes: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    tooltip: 'Low reliability.\nSpot on a marketplace or unproven provider. Prices change frequently, job will likely be interrupted.\nOnly use for very short, easily resumable tasks.',
  },
  'out-of-stock': {
    label:   'Out of Stock',
    classes: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    tooltip: 'Currently unavailable — no instances in this configuration can be allocated right now.',
  },

  // ── Value + Trends ─────────────────────────────────────────────────────────
  'top-value': {
    label:   'TOP VALUE',
    classes: 'bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-400 border border-lime-200 dark:border-lime-500/20 uppercase tracking-widest',
    tooltip: 'Best performance-per-dollar in this GPU model family, adjusted for reliability.',
  },
  '30d-low': {
    label:   '30D LOW',
    classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 uppercase tracking-widest',
    tooltip: 'Current minimum price is at or below the lowest seen in the last 30 days.',
  },

  // ── Provider trust tier ─────────────────────────────────────────────────────
  'enterprise': {
    label:   'Enterprise',
    classes: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    tooltip: 'Major cloud provider (AWS, Azure, GCP, OCI).\nFull SLA, global compliance (SOC 2, HIPAA, ISO 27001), enterprise support.\nHighest reliability — may require quota requests for large GPU configs.',
  },
  'established': {
    label:   'Established',
    classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    tooltip: 'Reputable ML-focused cloud provider.\nStable uptime, good community track record, ML-optimized infrastructure.\nSolid choice for most training and inference workloads.',
  },
  'marketplace': {
    label:   'Marketplace',
    classes: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    tooltip: 'Peer-to-peer GPU marketplace (e.g. Vast.ai).\nPrices can be very cheap but quality and stability vary by host.\nTest reliability with a short job before committing to long training runs.',
  },
  'emerging': {
    label:   'Emerging',
    classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    tooltip: 'Newer cloud provider — less track record.\nMay offer competitive pricing but verify SLA, uptime history, and support quality before committing.',
  },

};

// ── Badge component ───────────────────────────────────────────────────────────

interface BadgeProps {
  variant:      BadgeVariant;
  className?:   string;
  showTooltip?: boolean;
  size?:        'xs' | 'sm';
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  className    = '',
  showTooltip  = true,
  size         = 'xs',
}) => {
  const { classes, label, tooltip } = BADGE_DEFS[variant];
  const sizeClass = size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5';

  const el = (
    <span className={`inline-flex font-semibold rounded cursor-help ${sizeClass} ${classes} ${className}`}>
      {label}
    </span>
  );

  if (!showTooltip) return el;
  return <Tooltip content={tooltip}>{el}</Tooltip>;
};
