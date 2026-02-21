import React from 'react';
import {
  Check, Zap, Users, Bell, History,
  Bookmark, Share2, Slack, Webhook,
  FileText, Shield, ChevronRight,
} from 'lucide-react';

// ── Plan definitions ──────────────────────────────────────────────────────────

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  badge: string | null;
  badgeClass: string;
  description: string;
  cta: string;
  ctaClass: string;
  features: PlanFeature[];
  anchor?: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/mo',
    badge: null,
    badgeClass: '',
    description: 'Perfect for occasional comparisons and ad-hoc GPU shopping.',
    cta: 'Start for free',
    ctaClass: 'border border-slate-200 dark:border-ink-border text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5',
    features: [
      { text: 'Real-time GPU price comparison', included: true },
      { text: '5,000+ instances tracked', included: true },
      { text: 'Workload presets', included: true },
      { text: 'CSV export (current view)', included: true },
      { text: 'Shareable filter links', included: true },
      { text: 'API access (read-only)', included: true },
      { text: 'Price drop alerts', included: false },
      { text: '7-day price history', included: false },
      { text: 'Saved filter presets', included: false },
      { text: 'True Monthly Cost (TMC)', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$49',
    period: '/mo',
    badge: 'Most popular',
    badgeClass: 'pro-gradient text-white',
    description: 'For ML engineers and researchers who buy GPU time weekly.',
    cta: 'Start 7-day free trial',
    ctaClass: 'pro-gradient text-white shadow-glow hover:shadow-glow-dark hover:opacity-90',
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Price drop alerts (email + webhook)', included: true, highlight: true },
      { text: '7-day price history per model', included: true, highlight: true },
      { text: 'Saved filter presets (unlimited)', included: true, highlight: true },
      { text: 'True Monthly Cost (TMC) calculator', included: true, highlight: true },
      { text: 'Continuity Score on all rows', included: true },
      { text: 'Time-to-Hydrate estimator', included: true },
      { text: 'Full CSV export (all 5,000+ rows)', included: true },
      { text: 'Priority data refresh (2-hour)', included: true },
      { text: 'Slack/webhook alerts', included: false },
      { text: 'Team seats', included: false },
    ],
  },
  {
    id: 'teams',
    name: 'Teams',
    price: '$199',
    period: '/mo',
    badge: 'For orgs',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    description: 'Procurement tooling for MLOps teams managing cloud GPU budgets.',
    cta: 'Contact sales',
    ctaClass: 'border border-slate-200 dark:border-ink-border text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited team seats', included: true, highlight: true },
      { text: 'Slack integration (team alerts)', included: true, highlight: true },
      { text: 'Webhook / n8n / Zapier support', included: true, highlight: true },
      { text: 'Cost approval workflows', included: true, highlight: true },
      { text: 'Monthly spend reports (PDF)', included: true },
      { text: 'Shared saved filter presets', included: true },
      { text: 'Priority email support', included: true },
      { text: 'SSO / SAML', included: false },
      { text: 'Custom data refresh schedule', included: true },
    ],
  },
];

// ── FAQ ────────────────────────────────────────────────────────────────────────

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Do I need a credit card for the free trial?',
    a: 'No card required for the 7-day Pro trial. You\'ll only be billed if you decide to continue.',
  },
  {
    q: 'How do price drop alerts work?',
    a: 'Set a target price for any GPU model. We check every 2 hours and send you an email (or webhook) the moment the price crosses your threshold.',
  },
  {
    q: 'What is the True Monthly Cost (TMC) calculator?',
    a: 'GPU $/hr is only part of the bill. TMC adds storage, egress, and billed-when-stopped costs to show your real monthly spend — with provider-specific data for all 18+ providers.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your account dashboard any time — no friction, no dark patterns. Your data and saved presets are preserved for 30 days after cancellation.',
  },
  {
    q: 'Is the pricing data reliable?',
    a: 'Prices are fetched automatically every 6 hours via the open-source gpuhunt library. Pro plans get 2-hour refresh cycles. Enterprise pricing and spot prices change frequently — always verify before committing to long jobs.',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export const PricingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 fade-up">

      {/* ── Hero ────────────────────────────────────────────── */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-400/10 border border-brand-200 dark:border-brand-400/20 rounded-full px-4 py-1.5 mb-5">
          <span className="animate-live h-1.5 w-1.5 rounded-full bg-brand-500" />
          <span className="text-xs font-bold font-mono text-brand-600 dark:text-brand-400 uppercase tracking-widest">Pricing</span>
        </div>
        <h2 className="font-display text-4xl font-bold text-slate-900 dark:text-white mb-3">
          Stop overpaying for<br />
          <span className="text-brand-500 dark:text-brand-400">GPU compute</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Free for casual users. Pro for engineers who need alerts and history.
          Teams for orgs managing multi-cloud GPU budgets.
        </p>
      </div>

      {/* ── Plans grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 ${
              plan.id === 'pro'
                ? 'border-brand-400 dark:border-brand-500 shadow-glow'
                : 'border-slate-200 dark:border-ink-border'
            } bg-white dark:bg-ink-card`}
          >
            {/* Badge */}
            {plan.badge && (
              <div className={`text-center text-[10px] font-bold uppercase tracking-widest py-1.5 ${plan.badgeClass}`}>
                {plan.badge}
              </div>
            )}
            {!plan.badge && <div className="py-1.5" />}

            <div className="p-6 flex flex-col gap-5 flex-1">
              {/* Name + Price */}
              <div>
                <div className="font-display text-lg font-bold text-slate-900 dark:text-white mb-1">{plan.name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-mono text-slate-900 dark:text-white">{plan.price}</span>
                  <span className="text-slate-400 dark:text-slate-500 text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{plan.description}</p>
              </div>

              {/* CTA */}
              <button className={`w-full rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.98] ${plan.ctaClass}`}>
                {plan.cta}
              </button>

              {/* Features */}
              <div className="space-y-2.5 flex-1">
                {plan.features.map((feat, i) => (
                  <div key={i} className={`flex items-start gap-2.5 ${feat.included ? '' : 'opacity-40'}`}>
                    <div className={`mt-0.5 shrink-0 h-4 w-4 rounded-full flex items-center justify-center ${
                      feat.included && feat.highlight
                        ? 'bg-brand-400/20 text-brand-600 dark:text-brand-400'
                        : feat.included
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                    }`}>
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </div>
                    <span className={`text-sm ${
                      feat.highlight
                        ? 'text-slate-900 dark:text-white font-medium'
                        : feat.included
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-600 line-through'
                    }`}>
                      {feat.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Feature spotlight ───────────────────────────────── */}
      <div className="mb-14">
        <div className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-6">
          Why Pro pays for itself
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Bell,
              title: 'Price alerts',
              desc: 'Get emailed the moment H100 drops below your target. Never miss a pricing window again.',
              color: 'text-amber-500',
              bg: 'bg-amber-50 dark:bg-amber-500/10',
            },
            {
              icon: History,
              title: '7-day history',
              desc: 'See how prices moved over the past week. Spot patterns, time your purchases.',
              color: 'text-sky-500',
              bg: 'bg-sky-50 dark:bg-sky-500/10',
            },
            {
              icon: Bookmark,
              title: 'Saved presets',
              desc: 'Save your filter combinations. Share a link with your team instantly.',
              color: 'text-brand-500',
              bg: 'bg-brand-50 dark:bg-brand-500/10',
            },
            {
              icon: Zap,
              title: 'True Monthly Cost',
              desc: 'See the full bill — GPU + storage + egress — before you commit. No billing surprises.',
              color: 'text-emerald-500',
              bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            },
          ].map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card p-5">
              <div className={`inline-flex p-2.5 rounded-lg ${bg} mb-3`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1.5">{title}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Teams callout ───────────────────────────────────── */}
      <div className="rounded-2xl border border-sky-200 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/10 p-6 mb-14 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="h-12 w-12 rounded-xl bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center shrink-0">
          <Users className="h-6 w-6 text-sky-600 dark:text-sky-400" />
        </div>
        <div className="flex-1">
          <div className="font-display font-bold text-slate-900 dark:text-white mb-1">
            Running GPU spend across a team?
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Teams plan includes Slack alerts, cost approval workflows, shared presets, and unlimited seats.
            Monthly PDF spend reports included. SSO coming soon.
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-sky-600 text-white hover:bg-sky-500 transition-colors">
            <Slack className="h-4 w-4" /> Contact sales
          </button>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-mono">from $199/mo</div>
        </div>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-6">FAQ</div>
        <div className="space-y-2 max-w-2xl mx-auto">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors gap-3"
              >
                {item.q}
                <ChevronRight className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-90' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-ink-border pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust bar ───────────────────────────────────────── */}
      <div className="text-center pt-6 border-t border-slate-100 dark:border-ink-border">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> No credit card for trial</div>
          <div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Cancel anytime</div>
          <div className="flex items-center gap-1.5"><Webhook className="h-3.5 w-3.5" /> Webhook alerts on Pro+</div>
          <div className="flex items-center gap-1.5"><Share2 className="h-3.5 w-3.5" /> Shareable links on all plans</div>
        </div>
      </div>
    </div>
  );
};
