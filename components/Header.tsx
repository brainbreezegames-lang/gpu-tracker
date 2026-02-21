import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Tooltip } from './ui';

export type TabId = 'comparison' | 'trends' | 'recipes' | 'pricing' | 'api' | 'about';

interface HeaderProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; href: string }[] = [
  { id: 'comparison', label: 'Prices',   href: '/'        },
  { id: 'trends',     label: 'Trends',   href: '/trends'  },
  { id: 'recipes',    label: 'Recipes',  href: '/recipes' },
  { id: 'api',        label: 'API',      href: '/api-docs'},
  { id: 'about',      label: 'About',    href: '/about'   },
];

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const handleTab = (id: TabId) => {
    setActiveTab(id);
    setIsMenuOpen(false);
  };

  // Determine if a tab link is active (also matches sub-routes like /gpu/* and /provider/*)
  const isActive = (tab: { id: TabId; href: string }) => {
    if (tab.href === '/') return location.pathname === '/';
    return location.pathname.startsWith(tab.href);
  };

  return (
    <header className="bg-white/90 dark:bg-ink/90 backdrop-blur-md border-b border-slate-200 dark:border-ink-border sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">

          {/* ── Logo ─────────────────────────────── */}
          <Link
            to="/"
            className="flex-shrink-0 flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('comparison')}
          >
            {/* LIVE badge */}
            <div className="flex items-center gap-1.5 bg-brand-400/10 dark:bg-brand-400/10 px-2 py-1 rounded border border-brand-400/30">
              <span className="animate-live h-1.5 w-1.5 rounded-full bg-brand-400" />
              <span className="text-[10px] font-bold font-mono text-brand-600 dark:text-brand-400 tracking-widest uppercase">LIVE</span>
            </div>

            {/* Wordmark */}
            <h1 className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none hidden sm:block">
              GPU<span className="text-brand-400">_</span>TRACKER
              <span className="cursor-blink text-brand-400 ml-0.5">_</span>
            </h1>
          </Link>

          {/* ── Desktop Nav ───────────────────────── */}
          <nav className="hidden md:flex items-center gap-0.5">
            {TABS.map((tab) => (
              <Link
                key={tab.id}
                to={tab.href}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive(tab)
                    ? 'text-white dark:text-slate-900 bg-slate-900 dark:bg-white border border-slate-900 dark:border-white font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {/* ── Actions ──────────────────────────── */}
          <div className="hidden md:flex items-center gap-2">
            {/* Pro CTA */}
            <Tooltip content={"Real-time API access + Unlimited Alerts"} side="bottom">
              <Link
                to="/pricing"
                onClick={() => setActiveTab('pricing')}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all pro-gradient text-white shadow-sm hover:opacity-90 hover:shadow-md active:scale-95"
              >
                Pro API ↗
              </Link>
            </Tooltip>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>

          {/* ── Mobile controls ───────────────────── */}
          <div className="flex items-center md:hidden gap-2">
            <button
              onClick={toggleTheme}
              className="text-slate-400 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ───────────────────────────── */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-ink-card border-b border-slate-200 dark:border-ink-border">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {TABS.map((tab) => (
              <Link
                key={tab.id}
                to={tab.href}
                onClick={() => handleTab(tab.id)}
                className={`flex items-center w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive(tab)
                    ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                {tab.label}
              </Link>
            ))}
            <Link
              to="/pricing"
              onClick={() => handleTab('pricing')}
              className="flex w-full items-center justify-center px-4 py-2.5 rounded-lg text-sm font-bold pro-gradient text-white mt-2"
            >
              <Zap className="h-4 w-4 mr-1.5" /> Upgrade to Pro
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
