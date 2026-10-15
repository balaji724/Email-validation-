/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { SingleValidator } from './pages/SingleValidator';
import { BulkValidator } from './pages/BulkValidator';
import { ValidationHistory } from './pages/ValidationHistory';
import { Pricing } from './pages/Pricing';
import { Documentation } from './pages/Documentation';
import { Settings } from './pages/Settings';
import { UsageSummary, Plan, BulkJobSummary } from './types';
import { api } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [inspectJobId, setInspectJobId] = useState<string | null>(null);

  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [jobs, setJobs] = useState<BulkJobSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial SaaS state
  const loadData = async () => {
    try {
      const [usageData, plansData, historyData] = await Promise.allSettled([
        api.getUsage(),
        api.getPlans(),
        api.getHistory(),
      ]);

      if (usageData.status === 'fulfilled') setUsage(usageData.value);
      if (plansData.status === 'fulfilled') setPlans(plansData.value.plans);
      if (historyData.status === 'fulfilled') setJobs(historyData.value.jobs);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNavigate = (tab: string, jobId?: string) => {
    setCurrentTab(tab);
    if (jobId) {
      setInspectJobId(jobId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAllHistory = async () => {
    // Delete each job
    for (const job of jobs) {
      await api.deleteJob(job.id);
    }
    await loadData();
    setCurrentTab('history');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar adhering to Top Bar Contract */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => handleNavigate(tab)}
        creditsRemaining={usage?.creditsRemaining ?? 10000}
        creditsLimit={usage?.creditsLimit ?? 10000}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-xs text-slate-400">
            <span>Loading deliverability console...</span>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <Dashboard
                usage={usage}
                recentJobs={jobs}
                onNavigate={handleNavigate}
                onRefreshData={loadData}
              />
            )}

            {currentTab === 'single' && (
              <SingleValidator onValidated={loadData} />
            )}

            {currentTab === 'bulk' && (
              <BulkValidator
                initialJobId={inspectJobId}
                onJobCompleted={loadData}
              />
            )}

            {currentTab === 'history' && (
              <ValidationHistory
                jobs={jobs}
                onInspectJob={(id) => handleNavigate('bulk', id)}
                onRefresh={loadData}
                onNavigateToUpload={() => {
                  setInspectJobId(null);
                  handleNavigate('bulk');
                }}
              />
            )}

            {currentTab === 'pricing' && (
              <Pricing
                plans={plans}
                usage={usage}
                onRefreshUsage={loadData}
              />
            )}

            {currentTab === 'docs' && <Documentation />}

            {currentTab === 'settings' && (
              <Settings onClearHistory={handleClearAllHistory} />
            )}
          </>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">EmailCheck Pro</span>
            <span aria-hidden="true">·</span>
            <span>Enterprise Deliverability & Verification SaaS</span>
          </div>

          <div className="flex items-center gap-5 text-slate-500">
            <button
              onClick={() => handleNavigate('docs')}
              className="hover:text-slate-900 transition-colors"
            >
              Validation Rules
            </button>
            <button
              onClick={() => handleNavigate('pricing')}
              className="hover:text-slate-900 transition-colors"
            >
              Subscription Tiers
            </button>
            <button
              onClick={() => handleNavigate('settings')}
              className="hover:text-slate-900 transition-colors"
            >
              API Keys
            </button>
            <span>v1.0.0 Production</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
