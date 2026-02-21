import React, { useState } from 'react';
import {
  ArrowRight, Bell, History, Bookmark, Shield,
  Clock, AlertTriangle, CheckCircle, Zap, Users,
  TrendingDown, ChevronDown, ChevronRight, ExternalLink,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LandingPageProps {
  onStartPro: () => void;
  onTryDemo: () => void;
}

// ── Mock terminal card (hero visual) ─────────────────────────────────────────

const HeroCard: React.FC<{ mode: 'cheap' | 'real' }> = ({ mode }) => (
  <div className={`rounded-xl border font-mono text-xs overflow-hidden transition-all duration-500 ${
    mode === 'cheap'
      ? 'border-slate-700 bg-ink-card'
      : 'border-brand-400/40 bg-ink-card shadow-glow'
  }`}>
    {/* Terminal titlebar */}
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-ink-border bg-ink">
      <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
      <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
      <span className="ml-2 text-[10px] text-slate-500 tracking-wider">
        {mode === 'cheap' ? '> cheapest $/hr' : '> predictable mode'}
      </span>
    </div>

    <div className="p-4 space-y-2.5">
      {mode === 'cheap' ? (
        <>
          <div className="flex justify-between">
            <span className="text-slate-400">Provider</span>
            <span className="text-white font-semibold">Vast.ai</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">GPU</span>
            <span className="text-white font-semibold">A100 80GB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Price</span>
            <span className="text-brand-400 font-bold text-sm price-hero">$0.45/hr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Type</span>
            <span className="text-purple-400">Spot</span>
          </div>
          <div className="border-t border-ink-border pt-2 text-slate-500 italic text-[10px]">
            Looks great. But...
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between">
            <span className="text-slate-400">Provider</span>
            <span className="text-white font-semibold">Vast.ai</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">True monthly</span>
            <span className="text-brand-400 font-bold text-sm price-hero">~$312/mo</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Storage</span>
            <span className="flex items-center gap-1 text-orange-400 font-semibold">
              <AlertTriangle className="h-3 w-3" /> billed even stopped
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Volatility</span>
            <span className="text-red-400 font-semibold">High ⚡</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Friction</span>
            <span className="text-emerald-400 font-semibold">Self-serve ✓</span>
          </div>
          <div className="border-t border-ink-border pt-2 text-brand-400 text-[10px] font-semibold">
            Now you know what you're actually buying.
          </div>
        </>
      )}
    </div>
  </div>
);

// ── Pro Gate Banner ───────────────────────────────────────────────────────────

const GatedRow: React.FC<{ label: string; onUpgrade: () => void }> = ({ label, onUpgrade }) => (
  <div
    onClick={onUpgrade}
    className="flex items-center justify-between px-4 py-3 rounded-lg border border-brand-400/20 bg-brand-400/5 cursor-pointer hover:bg-brand-400/10 transition-colors group"
  >
    <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
    <span className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 group-hover:gap-2 transition-all">
      Pro <ArrowRight className="h-3 w-3" />
    </span>
  </div>
);

// ── FAQ accordion ─────────────────────────────────────────────────────────────

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 dark:border-ink-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between py-4 text-left gap-4 text-sm font-semibold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        {q}
        {open
          ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        }
      </button>
      {open && (
        <p className="pb-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{a}</p>
      )}
    </div>
  );
};

// ── Main LandingPage ──────────────────────────────────────────────────────────

export const LandingPage: React.FC<LandingPageProps> = ({ onStartPro, onTryDemo }) => {
  const [heroMode, setHeroMode] = useState<'cheap' | 'real'>('cheap');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white dark:bg-ink text-slate-900 dark:text-white">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink min-h-[90vh] flex items-center">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-brand-400/5 blur-3xl" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-sky-500/5 blur-3xl" />
          {/* Scanlines */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_3px,rgba(0,0,0,0.015)_3px,rgba(0,0,0,0.015)_4px)]" />
        </div>

        <div className="relative max-w-[1200px] mx-auto px-6 lg:px-12 py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">

            {/* Left — Copy */}
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 border border-brand-400/30 bg-brand-400/10 rounded-full px-3 py-1.5 mb-8">
                <span className="animate-live h-1.5 w-1.5 rounded-full bg-brand-400" />
                <span className="text-[10px] font-bold font-mono text-brand-400 uppercase tracking-widest">12,000+ instances tracked · Updated every 6 hours</span>
              </div>

              {/* H1 */}
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tight text-white mb-6">
                The GPU<br />
                price is<br />
                <span className="text-brand-400 relative">
                  a lie.
                  <span className="cursor-blink text-brand-400">_</span>
                </span>
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
                GPU $/hr is only the beginning. GPU Tracker Pro shows{' '}
                <strong className="text-white">true monthly cost</strong>,{' '}
                <strong className="text-white">spot volatility</strong>, and{' '}
                <strong className="text-white">how hard it is to actually get the GPU</strong>{' '}
                — across 18+ providers.
              </p>

              {/* Micro-proof */}
              <div className="text-xs font-mono text-slate-500 mb-8">
                Updated every 6h &nbsp;·&nbsp; 12,000+ instances &nbsp;·&nbsp; Runs in your browser
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onStartPro}
                  className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-sm font-bold pro-gradient text-white shadow-glow hover:shadow-glow-dark hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  Start Pro — alerts + true cost <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={onTryDemo}
                  className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-sm font-semibold border border-white/10 text-white hover:bg-white/5 transition-all"
                >
                  Try Predictable Mode →
                </button>
              </div>
            </div>

            {/* Right — Interactive mock card */}
            <div className="flex flex-col items-center gap-4">
              {/* Toggle */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setHeroMode('cheap')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    heroMode === 'cheap'
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cheapest $/hr
                </button>
                <button
                  onClick={() => setHeroMode('real')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    heroMode === 'real'
                      ? 'bg-brand-400/20 text-brand-400 border border-brand-400/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cheapest to Finish
                </button>
              </div>

              <div className="w-full max-w-xs">
                <HeroCard mode={heroMode} />
              </div>

              <p className="text-[11px] text-slate-500 font-mono text-center max-w-xs">
                {heroMode === 'cheap'
                  ? 'Pro doesn\'t just find cheap. It finds predictable.'
                  : '✓ Now you see the full picture before you click deploy.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAIN WALL ────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-ink-card border-y border-slate-100 dark:border-ink-border py-20">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Why "cheap GPU" turns into a surprise bill
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              These aren't edge cases. They're the default experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: AlertTriangle,
                iconBg: 'bg-red-50 dark:bg-red-500/10',
                iconColor: 'text-red-500',
                title: 'Hidden costs don\'t show up in $/hr.',
                desc: 'Egress, snapshots, networking — the "quiet costs" that quietly become the bill. You won\'t see them until checkout.',
                stat: 'Up to 3× the advertised price',
                statColor: 'text-red-600 dark:text-red-400',
              },
              {
                icon: Clock,
                iconBg: 'bg-orange-50 dark:bg-orange-500/10',
                iconColor: 'text-orange-500',
                title: 'Stopping compute doesn\'t stop charges.',
                desc: 'Beginners get hit by storage charges even after shutting down pods. The GPU stops. The bill doesn\'t.',
                stat: 'Most common beginner trap',
                statColor: 'text-orange-600 dark:text-orange-400',
              },
              {
                icon: Zap,
                iconBg: 'bg-amber-50 dark:bg-amber-500/10',
                iconColor: 'text-amber-500',
                title: 'Spot is a deal… until it isn\'t.',
                desc: 'Spot can be reclaimed with minimal warning. Prices can change frequently. That 50% discount vanishes mid-job.',
                stat: 'No SLA on spot instances',
                statColor: 'text-amber-600 dark:text-amber-400',
              },
            ].map(({ icon: Icon, iconBg, iconColor, title, desc, stat, statColor }) => (
              <div key={title} className="rounded-2xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink p-6">
                <div className={`inline-flex p-3 rounded-xl ${iconBg} mb-4`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">{desc}</p>
                <div className={`text-xs font-bold font-mono ${statColor}`}>{stat}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={onStartPro}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold pro-gradient text-white shadow-glow hover:shadow-glow-dark transition-all"
            >
              Start Pro <ArrowRight className="h-4 w-4" />
            </button>
            <div className="mt-2">
              <button onClick={onTryDemo} className="text-xs text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
                Try the demo (free) →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-ink py-20" id="features">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 border border-brand-400/30 bg-brand-400/10 rounded-full px-3 py-1.5 mb-4">
              <span className="text-[10px] font-bold font-mono text-brand-600 dark:text-brand-400 uppercase tracking-widest">GPU Tracker Pro</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
              Predictable compute
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingDown,
                title: 'True Monthly Cost (TMC)',
                desc: 'You\'ll see what you\'ll pay this month, not what the GPU claims per hour.',
                bullets: [
                  'Compute + storage assumptions',
                  'Warnings when "stop" still bills storage',
                  '"Quiet cost" flags: egress/snapshots/network',
                ],
                accent: 'brand',
              },
              {
                icon: History,
                title: 'Price history + volatility',
                desc: 'Spot is a moving target. Pro shows how unstable each deal is.',
                bullets: [
                  '7/30-day history per model',
                  'Volatility badge: Low / Medium / High',
                  'Don\'t buy unstable "deals"',
                ],
                accent: 'sky',
              },
              {
                icon: Bell,
                title: 'Alerts that actually save money',
                desc: 'Stop refreshing. Get notified when your target becomes real.',
                bullets: [
                  'Price drops below $X',
                  'Availability changes',
                  'Region inventory appears',
                ],
                accent: 'amber',
              },
              {
                icon: Clock,
                title: 'Procurement friction signals',
                desc: 'Because "just rent H100" is not how reality works.',
                bullets: [
                  'Quota likely vs. self-serve labels',
                  '"Time-to-GPU" by provider/region',
                  'Skip the quota queue',
                ],
                accent: 'emerald',
              },
              {
                icon: Bookmark,
                title: 'Saved searches',
                desc: 'Your exact filters remembered. Stop rebuilding the same search every day.',
                bullets: [
                  'Unlimited saved views',
                  'Shareable team links',
                  'Alert attached to saved search',
                ],
                accent: 'purple',
              },
              {
                icon: Users,
                title: 'For teams (Teams plan)',
                desc: 'Stop arguing about who burned the budget.',
                bullets: [
                  'Shared watchlists',
                  'Slack/webhook alerts',
                  'Tags + exports for accountability',
                ],
                accent: 'rose',
              },
            ].map(({ icon: Icon, title, desc, bullets, accent }) => (
              <div key={title} className="rounded-2xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card p-6 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <div className={`inline-flex p-2.5 rounded-xl bg-${accent}-50 dark:bg-${accent}-500/10 mb-4`}>
                  <Icon className={`h-5 w-5 text-${accent}-500`} />
                </div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{desc}</p>
                <ul className="space-y-1.5">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────────────── */}
      <section className="bg-ink border-y border-ink-border py-6">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <p className="text-sm text-slate-400 font-mono">
            <span className="text-brand-400 font-bold">We don't sell hype. We sell clarity.</span>
            {' '}Prices can be delayed up to ~6 hours. Always verify at the provider before purchase.
          </p>
        </div>
      </section>

      {/* ── AUDIENCE PODS ────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-ink-card py-20">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Built for how people actually buy GPUs
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                emoji: '🎬',
                who: 'Creators',
                quote: '"I need a GPU today, and I can\'t afford a surprise bill."',
                desc: 'No local GPU? Compare providers in seconds. Filter by budget, spin up fast, don\'t overpay on storage.',
              },
              {
                emoji: '⚙️',
                who: 'Builders',
                quote: '"I need the best deal I can actually keep running."',
                desc: 'See volatility, continuity scores, and true monthly cost. Don\'t pick spot when you need reliability.',
              },
              {
                emoji: '🏢',
                who: 'Teams',
                quote: '"I need accountability and predictable spend."',
                desc: 'Shared alerts, tags, exports. Know who spun up what and what it cost — before the invoice arrives.',
              },
            ].map(({ emoji, who, quote, desc }) => (
              <div key={who} className="rounded-2xl border border-slate-200 dark:border-ink-border bg-slate-50 dark:bg-ink p-6">
                <div className="text-3xl mb-3">{emoji}</div>
                <div className="font-display font-bold text-slate-900 dark:text-white mb-2">{who}</div>
                <p className="text-sm text-brand-600 dark:text-brand-400 font-medium italic mb-2 leading-relaxed">{quote}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-ink py-20" id="pricing">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Pricing that pays for itself the first time<br />
              you avoid a surprise bill
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Cancel anytime. No lock-in. Pro is built to save you money <em>and</em> time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card p-6 flex flex-col">
              <div className="font-display text-lg font-bold text-slate-900 dark:text-white mb-1">Free</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">For quick lookups.</div>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">$0</span>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {[
                  'Search across 18+ providers',
                  'Filters: GPU, VRAM, region, commitment',
                  'Live deal table + comparison',
                  'Basic "best deal" browsing',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className="w-full rounded-xl py-3 text-sm font-bold border border-slate-200 dark:border-ink-border text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                Start Free
              </button>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-brand-400 bg-white dark:bg-ink-card shadow-glow p-6 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold pro-gradient text-white whitespace-nowrap">
                Most popular
              </div>
              <div className="font-display text-lg font-bold text-slate-900 dark:text-white mb-1">Pro</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">For people who actually run workloads.</div>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">$49</span>
                <span className="text-slate-400 text-sm">/mo</span>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {[
                  ['True Monthly Cost (compute + storage + flags)', true],
                  ['Alerts: price drop, availability, inventory', true],
                  ['Price history + volatility (7/30-day)', true],
                  ['Saved searches', true],
                  ['Export CSV', true],
                ].map(([f, highlight]) => (
                  <li key={String(f)} className="flex items-start gap-2 text-sm">
                    <CheckCircle className={`h-4 w-4 shrink-0 mt-0.5 ${highlight ? 'text-brand-500' : 'text-emerald-500'}`} />
                    <span className={highlight ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-400'}>{String(f)}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={onStartPro}
                className="w-full rounded-xl py-3 text-sm font-bold pro-gradient text-white shadow-glow hover:shadow-glow-dark hover:opacity-90 transition-all active:scale-[0.98]"
              >
                Start Pro
              </button>
            </div>

            {/* Teams */}
            <div className="rounded-2xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card p-6 flex flex-col">
              <div className="font-display text-lg font-bold text-slate-900 dark:text-white mb-1">Teams</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">For teams sharing GPU spend (and blame).</div>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">$299</span>
                <span className="text-slate-400 text-sm">/mo</span>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {[
                  'Everything in Pro',
                  'Slack/webhook alerts',
                  'Shared watchlists + org views',
                  'Tags + exports for accountability',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className="w-full rounded-xl py-3 text-sm font-bold border border-slate-200 dark:border-ink-border text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                Talk to us
              </button>
            </div>
          </div>

          {/* Pro-gated feature teaser */}
          <div className="mt-10 max-w-lg mx-auto space-y-2">
            <div className="text-xs font-mono text-slate-400 dark:text-slate-500 text-center mb-3 uppercase tracking-wider">Pro-only features (click to unlock)</div>
            <GatedRow label="💾 Save this search" onUpgrade={onStartPro} />
            <GatedRow label="🔔 Create price alert for H100 ≤ $2.00/hr" onUpgrade={onStartPro} />
            <GatedRow label="📊 View 30-day price history" onUpgrade={onStartPro} />
            <GatedRow label="📥 Export full 12,000+ row CSV" onUpgrade={onStartPro} />
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-ink-card py-20">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">FAQ</h2>
          <div className="divide-y divide-slate-100 dark:divide-ink-border rounded-2xl border border-slate-200 dark:border-ink-border overflow-hidden bg-white dark:bg-ink p-1">
            {[
              {
                q: 'How is True Monthly Cost calculated?',
                a: 'We combine the hourly GPU rate with your usage assumptions (hours/week + storage). We also flag "quiet costs" (egress/snapshots/networking) when providers charge separately, so you don\'t get blindsided.',
              },
              {
                q: 'Why do you warn about storage after stop?',
                a: 'Because many people stop compute and assume billing stops — but storage can keep charging. Pro makes that visible before you click deploy.',
              },
              {
                q: 'Is spot always the best deal?',
                a: 'Spot can be great, but it can be interrupted and prices change. Pro shows volatility and history so you can choose based on risk, not just $/hr.',
              },
              {
                q: 'Why include procurement friction?',
                a: 'Because high-end GPUs can be gated by quota/approval. "Cheapest H100" is useless if you can\'t provision it. We tell you before you waste time applying.',
              },
              {
                q: 'What\'s the update frequency?',
                a: 'Pricing data refreshes every 6 hours. Always verify pricing and terms on the provider site before purchase.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Cancel from your dashboard any time — no friction, no dark patterns. Data and saved searches are preserved for 30 days after cancellation.',
              },
            ].map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="bg-ink py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-brand-400/5 blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto px-6">
          <h2 className="font-display text-4xl font-black text-white mb-4 leading-tight">
            Make GPU spend<br />
            <span className="text-brand-400">predictable.</span>
          </h2>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            Stop buying by $/hr. Start buying by the chance you finish the job.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onStartPro}
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold pro-gradient text-white shadow-glow hover:shadow-glow-dark hover:opacity-90 transition-all active:scale-[0.98]"
            >
              Start Pro <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={onTryDemo}
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold border border-white/10 text-white hover:bg-white/5 transition-all"
            >
              Try Predictable Mode
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-500 font-mono">Cancel anytime · No credit card for trial</p>
        </div>
      </section>

    </div>
  );
};
