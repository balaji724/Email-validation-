import React from 'react';
import { FinalStatus } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: FinalStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md',
}) => {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const textClass = size === 'sm' ? 'text-xs' : 'text-xs font-medium';

  switch (status) {
    case 'VALID':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 ${textClass}`}>
          {showIcon && <CheckCircle2 className={`${iconSize} text-emerald-600 shrink-0`} />}
          <span>Valid</span>
        </span>
      );
    case 'INVALID':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200/80 ${textClass}`}>
          {showIcon && <XCircle className={`${iconSize} text-rose-600 shrink-0`} />}
          <span>Invalid</span>
        </span>
      );
    case 'RISKY':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 ${textClass}`}>
          {showIcon && <AlertTriangle className={`${iconSize} text-amber-600 shrink-0`} />}
          <span>Risky</span>
        </span>
      );
    case 'UNKNOWN':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-300/80 ${textClass}`}>
          {showIcon && <HelpCircle className={`${iconSize} text-slate-500 shrink-0`} />}
          <span>Unknown</span>
        </span>
      );
  }
};

export const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  let color = 'text-slate-600 bg-slate-100 border-slate-200';
  if (score >= 80) color = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  else if (score >= 50) color = 'text-amber-700 bg-amber-50 border-amber-200';
  else color = 'text-rose-700 bg-rose-50 border-rose-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono tabular-nums font-semibold border ${color}`}>
      {score}/100
    </span>
  );
};
