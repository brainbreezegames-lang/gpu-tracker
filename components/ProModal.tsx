import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Bell, Bookmark, History, Download, ArrowRight, CheckCircle, Loader, Shield, Zap } from 'lucide-react';
import { GPUInstance, AlertType, AlertConditions } from '../types';
import { getContinuityScore } from '../services/gpuUtils';

export type ProModalVariant = 'alert' | 'save-search' | 'history' | 'export';

interface ProModalProps {
  variant: ProModalVariant;
  onClose: () => void;
  onStartPro: () => void;
  /** Optional context: GPU model being alerted on */
  context?: { model?: string; provider?: string; pricePerHour?: number };
  /** Full dataset for computing match preview */
  data?: GPUInstance[];
}

// ── Config per variant ────────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<ProModalVariant, {
  icon: React.FC<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  bullets: string[];
  ctaLabel: string;
  showEmailInput?: boolean;
}> = {
  alert: {
    icon: Bell,
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-500',
    title: 'Set a smart alert',
    subtitle: 'Get notified the moment conditions match — before anyone else sees it.',
    bullets: [
      'Conditional alerts: price + stability + availability',
      'Live match preview — see what matches NOW',
      'Region inventory appearance alerts',
    ],
    ctaLabel: 'Enable alerts — Pro $49/mo',
    showEmailInput: true,
  },
  'save-search': {
    icon: Bookmark,
    iconBg: 'bg-brand-50 dark:bg-brand-400/10',
    iconColor: 'text-brand-500',
    title: 'Save this search',
    subtitle: 'Stop rebuilding the same filter set. Save once, return instantly.',
    bullets: [
      'Unlimited saved searches',
      'Shareable links for your team',
      'Attach a price alert to any saved search',
    ],
    ctaLabel: 'Save searches — Pro $49/mo',
    showEmailInput: false,
  },
  history: {
    icon: History,
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconColor: 'text-blue-500',
    title: 'View price history',
    subtitle: 'Spot is a moving target. Know if today\'s deal is actually a deal.',
    bullets: [
      '7-day and 30-day history per model',
      'Volatility signal: Stable / Variable / Volatile',
      'Historical low / high / average per provider',
    ],
    ctaLabel: 'Unlock history — Pro $49/mo',
    showEmailInput: false,
  },
  export: {
    icon: Download,
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    title: 'Export full dataset',
    subtitle: 'All 12,000+ GPU configurations as a clean CSV or JSON. Run your own analysis.',
    bullets: [
      'Full price data download (CSV + JSON)',
      'API access with your key',
      'Includes TMC, risk scores, friction flags',
    ],
    ctaLabel: 'Download All Price Data — Pro $49/mo',
    showEmailInput: false,
  },
};

// ── Alert type pills ─────────────────────────────────────────────────────────

const ALERT_TYPES: { type: AlertType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { type: 'price-drop',    label: 'Price Drop',    icon: Bell },
  { type: 'back-in-stock', label: 'Back in Stock', icon: Zap },
  { type: 'new-low',       label: 'New 30D Low',   icon: Download },
  { type: 'availability',  label: 'Availability',  icon: Shield },
];

// ── Alert email sub-form ──────────────────────────────────────────────────────

const AlertForm: React.FC<{
  context?: ProModalProps['context'];
  data?: GPUInstance[];
  onSuccess: () => void;
}> = ({ context, data, onSuccess }) => {
  const [email,      setEmail]      = useState('');
  const [target,     setTarget]     = useState(
    context?.pricePerHour ? (context.pricePerHour * 0.9).toFixed(2) : '',
  );
  const [alertType,  setAlertType]  = useState<AlertType>('price-drop');
  const [onlyStable, setOnlyStable] = useState(false);
  const [onlyAvail,  setOnlyAvail]  = useState(false);
  const [status,     setStatus]     = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errMsg,     setErrMsg]     = useState('');

  // Compute match preview
  const matchCount = useMemo(() => {
    if (!data || data.length === 0) return null;
    return data.filter((item) => {
      if (context?.model && context.model !== 'any' && item.model !== context.model) return false;
      if (context?.provider && context.provider !== 'any' && item.provider !== context.provider) return false;
      if (target && Number(target) > 0 && item.pricePerHour > Number(target)) return false;
      if (onlyStable && getContinuityScore(item) < 70) return false;
      if (onlyAvail && item.availability === 'out_of_stock') return false;
      return true;
    }).length;
  }, [data, context, target, onlyStable, onlyAvail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setErrMsg('Enter a valid email.'); return; }
    setStatus('loading'); setErrMsg('');

    const conditions: AlertConditions = {};
    if (context?.model && context.model !== 'any') conditions.models = [context.model];
    if (context?.provider && context.provider !== 'any') conditions.providers = [context.provider];
    if (target && Number(target) > 0) conditions.maxPrice = Number(target);
    if (onlyStable) conditions.onlyStable = true;
    if (onlyAvail) conditions.onlyHighAvail = true;

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          alertType,
          model:       context?.model ?? 'any',
          provider:    context?.provider ?? 'any',
          targetPrice: Number(target) || null,
          conditions,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? 'Server error');
      }
      setStatus('sent');
      setTimeout(onSuccess, 1800);
    } catch (err) {
      setStatus('error');
      setErrMsg(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-emerald-500" />
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Alert registered!</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          We'll email you when conditions match. Full Pro alerts available on the Pro plan.
        </p>
      </div>
    );
  }

  const pill = (active: boolean) =>
    `px-3 py-1.5 text-[11px] rounded-lg font-semibold border transition-all cursor-pointer ${
      active
        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
        : 'bg-white dark:bg-ink-muted text-slate-500 dark:text-slate-400 border-slate-200 dark:border-ink-border hover:border-slate-400 dark:hover:border-slate-500'
    }`;

  const toggle = (active: boolean) =>
    `relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
      active ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'
    }`;

  const toggleDot = (active: boolean) =>
    `pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
      active ? 'translate-x-4' : 'translate-x-0'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 pt-4 border-t border-slate-100 dark:border-ink-border">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        Early access — get one free alert
      </p>

      {/* Context chip */}
      {context?.model && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-ink-border">
          <span className="text-xs text-slate-500 dark:text-slate-400">Tracking:</span>
          <span className="text-xs font-bold text-slate-900 dark:text-white">{context.model}</span>
          {context.provider && <span className="text-xs text-slate-400">on {context.provider}</span>}
        </div>
      )}

      {/* Alert type selector */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block">Alert type</label>
        <div className="flex flex-wrap gap-1.5">
          {ALERT_TYPES.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => setAlertType(type)}
              className={pill(alertType === type)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Price target (only for price-drop) */}
      {alertType === 'price-drop' && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">$</span>
            <input
              type="number" step="0.01" min="0"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Target price/hr"
              className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 outline-none"
            />
          </div>
        </div>
      )}

      {/* Condition toggles */}
      <div className="space-y-2.5">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Conditions</label>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Only stable providers</span>
          </div>
          <button type="button" role="switch" aria-checked={onlyStable} onClick={() => setOnlyStable(!onlyStable)} className={toggle(onlyStable)}>
            <span className={toggleDot(onlyStable)} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Only available (in stock)</span>
          </div>
          <button type="button" role="switch" aria-checked={onlyAvail} onClick={() => setOnlyAvail(!onlyAvail)} className={toggle(onlyAvail)}>
            <span className={toggleDot(onlyAvail)} />
          </button>
        </div>
      </div>

      {/* Match preview */}
      {matchCount !== null && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/15">
          <div className={`h-2 w-2 rounded-full ${matchCount > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          <span className="text-xs text-slate-600 dark:text-slate-400">
            Currently <span className="font-bold text-slate-900 dark:text-white">{matchCount.toLocaleString()}</span> instances match these conditions
          </span>
        </div>
      )}

      {/* Email + submit */}
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 outline-none"
          required
        />
      </div>
      {errMsg && <p className="text-xs text-red-500">{errMsg}</p>}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60"
      >
        {status === 'loading'
          ? <><Loader className="h-4 w-4 animate-spin" /> Registering…</>
          : <><Bell className="h-4 w-4" /> Notify me</>
        }
      </button>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
        No account required. Unsubscribe instantly.
      </p>
    </form>
  );
};

// ── ProModal ──────────────────────────────────────────────────────────────────

export const ProModal: React.FC<ProModalProps> = ({
  variant, onClose, onStartPro, context, data,
}) => {
  const cfg = VARIANT_CONFIG[variant];
  const Icon = cfg.icon;
  const overlayRef = useRef<HTMLDivElement>(null);
  const [alertSent, setAlertSent] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative bg-white dark:bg-ink-card rounded-2xl border border-slate-200 dark:border-ink-border shadow-2xl w-full max-w-[calc(100vw-32px)] sm:max-w-md max-h-[90vh] overflow-y-auto">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-4 sm:p-6">
          {/* Icon + Title */}
          <div className={`inline-flex p-3 rounded-xl ${cfg.iconBg} mb-4`}>
            <Icon className={`h-6 w-6 ${cfg.iconColor}`} />
          </div>

          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-1.5">
            {cfg.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            {cfg.subtitle}
          </p>

          {/* Feature bullets */}
          <ul className="space-y-2 mb-4">
            {cfg.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <CheckCircle className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>

          {/* Alert form for 'alert' variant */}
          {cfg.showEmailInput && !alertSent && (
            <AlertForm context={context} data={data} onSuccess={() => setAlertSent(true)} />
          )}

          {/* Divider + Pro CTA */}
          {(!cfg.showEmailInput || alertSent) && (
            <>
              <div className="my-4 border-t border-slate-100 dark:border-ink-border" />
              <div className="space-y-2">
                <button
                  onClick={onStartPro}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl pro-gradient text-white text-sm font-bold shadow-glow hover:shadow-glow-dark hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  {cfg.ctaLabel} <ArrowRight className="h-4 w-4" />
                </button>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                  No credit card needed · Cancel anytime · $49/mo
                </p>
              </div>
            </>
          )}

          {/* For alert variant: also show Pro CTA below form */}
          {cfg.showEmailInput && !alertSent && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-ink-border text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                Want unlimited alerts + history + saved searches?
              </p>
              <button
                onClick={onStartPro}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 mx-auto"
              >
                Start Pro — $49/mo <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
