import React from 'react';
import { MailCheck, Zap, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  creditsRemaining: number;
  creditsLimit: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  creditsRemaining,
  creditsLimit,
}) => {
  const percentRemaining = Math.max(0, Math.min(100, Math.round((creditsRemaining / creditsLimit) * 100)));

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg p-1"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <MailCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
              EmailCheck Pro
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'dashboard'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onSelectTab('single')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'single'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Single Validator
          </button>
          <button
            onClick={() => onSelectTab('bulk')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'bulk'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Bulk Validator
          </button>
          <button
            onClick={() => onSelectTab('history')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'history'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            History
          </button>
          <button
            onClick={() => onSelectTab('pricing')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'pricing'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Plans
          </button>
          <button
            onClick={() => onSelectTab('docs')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'docs'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Documentation
          </button>
          <button
            onClick={() => onSelectTab('settings')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'settings'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Settings
          </button>
        </nav>

        {/* Zone 3: Primary action & credits indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => onSelectTab('pricing')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-lg cursor-pointer transition-colors text-xs text-slate-700"
            title={`${creditsRemaining.toLocaleString()} of ${creditsLimit.toLocaleString()} credits remaining`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="font-mono tabular-nums font-medium text-slate-900">
              {creditsRemaining.toLocaleString()}
            </span>
            <span className="text-slate-500">credits</span>
          </div>

          <button
            onClick={() => onSelectTab('bulk')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors whitespace-nowrap shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Validate List</span>
          </button>
        </div>
      </div>
    </header>
  );
};
