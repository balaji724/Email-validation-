import React, { useState } from 'react';
import {
  Check,
  Zap,
  Shield,
  CreditCard,
  Building,
  HelpCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import { Plan, UsageSummary } from '../types';

interface PricingProps {
  plans: Plan[];
  usage: UsageSummary | null;
  onRefreshUsage: () => void;
}

export const Pricing: React.FC<PricingProps> = ({
  plans,
  usage,
  onRefreshUsage,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<Plan | null>(null);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlanForCheckout(plan);
    setCheckoutComplete(false);
  };

  const handleSimulateSubscription = () => {
    setCheckoutComplete(true);
    setTimeout(() => {
      setSelectedPlanForCheckout(null);
      setCheckoutComplete(false);
      onRefreshUsage();
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Title & Billing Toggle */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Transparent, Predictable Deliverability Plans
        </h1>
        <p className="text-sm text-slate-500">
          Clean your CRM database, prevent hard bounces, and maintain 99%+ sender reputation.
          Upgrade or downgrade at any time with flexible monthly allowances.
        </p>

        {/* Billing cycle segmented toggle */}
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 mt-2">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.5 rounded">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = usage?.planId === plan.id;
          const price = billingCycle === 'annual'
            ? Math.round(plan.annualPrice / 12)
            : plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl p-6 border flex flex-col justify-between transition-all ${
                plan.isPopular
                  ? 'border-blue-500 shadow-md ring-1 ring-blue-500/30'
                  : 'border-slate-200 shadow-2xs'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {plan.name}
                  </h3>
                  {plan.isPopular && (
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      Most Popular
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Active Plan
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mt-4 mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 font-mono">
                      ${price}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ month</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {billingCycle === 'annual' && plan.annualPrice > 0
                      ? `$${plan.annualPrice} billed annually`
                      : 'Billed monthly'}
                  </div>
                </div>

                {/* Credit Limit Badge */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 space-y-1 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Monthly Credits:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {plan.monthlyCreditLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Bulk Upload Cap:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {plan.bulkUploadLimit.toLocaleString()} rows
                    </span>
                  </div>
                </div>

                {/* Feature checklist */}
                <ul className="space-y-2.5 text-xs text-slate-600">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrent}
                  className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors shadow-2xs ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : plan.isPopular
                      ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription Architecture FAQ */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Subscription & Credit Policy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
          <div>
            <h4 className="font-semibold text-slate-800 mb-1">How are credits deducted?</h4>
            <p>1 validation credit is deducted per unique email evaluated. Syntax errors, disposable flags, and verified addresses count equally toward computational DNS throughput.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-1">What happens if a job fails?</h4>
            <p>If an uploaded file fails to parse or DNS times out, partial rows are recorded and non-evaluated rows are not charged to your billing cycle quota.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-1">Payment Provider Integration</h4>
            <p>Configured for plug-and-play Stripe or Paddle billing with cryptographic webhook signature verification and automated quota adjustments.</p>
          </div>
        </div>
      </div>

      {/* Simulated Checkout Modal */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Upgrade to {selectedPlanForCheckout.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlanForCheckout(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Plan Selected:</span>
                <span className="font-semibold text-slate-900">{selectedPlanForCheckout.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Billing Cadence:</span>
                <span className="font-semibold text-slate-900 capitalize">{billingCycle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total Price:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ${billingCycle === 'annual' ? selectedPlanForCheckout.annualPrice : selectedPlanForCheckout.monthlyPrice}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="text-slate-600">Included Credits:</span>
                <span className="font-mono font-bold text-blue-600">
                  {selectedPlanForCheckout.monthlyCreditLimit.toLocaleString()} / mo
                </span>
              </div>
            </div>

            {/* Demo Architecture Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                <span>Sandbox Billing Mode (V1 Architecture)</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Live payment credentials (`STRIPE_SECRET_KEY` / `PADDLE_API_KEY`) are kept in environment variables.
                In this development mode, clicking confirm will immediately update your mock session entitlement to the selected tier.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPlanForCheckout(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulateSubscription}
                disabled={checkoutComplete}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-2xs"
              >
                {checkoutComplete ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Entitlement Activated!</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Confirm Upgrade (Demo Mode)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
