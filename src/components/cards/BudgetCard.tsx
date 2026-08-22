import React from 'react';
import { IndianRupee, AlertTriangle, TrendingUp, CheckCircle, PieChart } from 'lucide-react';
import { BudgetSummary } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface BudgetCardProps {
  budget: BudgetSummary;
  onViewFullBudget?: () => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  onViewFullBudget,
}) => {
  const percentageUsed = Math.min(100, Math.round((budget.estimated_total / (budget.overall_budget || 1)) * 100));

  return (
    <Card padding="md" className="bg-surface border border-borderLight shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-brand-50 text-brand">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink-primary">Live Trip Budget</h4>
            <p className="text-xs text-ink-secondary">{budget.duration_days} Days Planned</p>
          </div>
        </div>
        <Badge variant={budget.is_overbudget ? 'danger' : 'success'} size="sm">
          {budget.is_overbudget ? 'Over Budget' : 'Within Budget'}
        </Badge>
      </div>

      {/* Primary KPI Numbers */}
      <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-borderLight/60">
        <div>
          <span className="text-xs text-ink-secondary font-medium">Estimated Total</span>
          <div className="text-lg font-extrabold text-ink-primary flex items-center">
            <IndianRupee className="w-4 h-4 text-ink-secondary" />
            {budget.estimated_total.toLocaleString('en-IN')}
          </div>
        </div>
        <div>
          <span className="text-xs text-ink-secondary font-medium">Overall Budget</span>
          <div className="text-lg font-bold text-brand flex items-center">
            <IndianRupee className="w-4 h-4 text-brand-400" />
            {budget.overall_budget.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-ink-secondary">Budget Utilized</span>
          <span className={budget.is_overbudget ? 'text-rose-600 font-bold' : 'text-emerald-700'}>
            {percentageUsed}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              budget.is_overbudget ? 'bg-rose-500' : 'bg-brand'
            }`}
            style={{ width: `${percentageUsed}%` }}
          />
        </div>
      </div>

      {/* Overbudget Warning Alert if applicable (per Section 24) */}
      {budget.is_overbudget && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>You are ₹{budget.overbudget_amount.toLocaleString('en-IN')} over budget!</span>
          </div>
          {budget.overbudget_category && (
            <p className="text-rose-700">
              Primary contributing factor: <strong className="font-semibold">{budget.overbudget_category}</strong> expenses.
            </p>
          )}
        </div>
      )}

      {/* Category distribution mini badges */}
      <div className="space-y-2 pt-2 border-t border-borderLight/80">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Category Breakdown</span>
        <div className="grid grid-cols-2 gap-2">
          {budget.breakdown_by_category.slice(0, 4).map((cat) => (
            <div key={cat.category} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50">
              <span className="flex items-center gap-1.5 font-medium text-ink-secondary">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.category}
              </span>
              <span className="font-bold text-ink-primary">₹{Math.round(cat.amount).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>

      {onViewFullBudget && (
        <button
          onClick={onViewFullBudget}
          className="w-full text-center text-xs font-bold text-brand hover:text-brand-700 py-1 transition-colors"
        >
          View Full Breakdown & Charts →
        </button>
      )}
    </Card>
  );
};
