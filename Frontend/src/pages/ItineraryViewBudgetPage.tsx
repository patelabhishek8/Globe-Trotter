import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  IndianRupee,
  PieChart as PieIcon,
  BarChart2,
  Clock,
  AlertTriangle,
  Share2,
  Edit3,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle,
  FileText,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { BudgetSummary, Expense, TripDetail } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';

export const ItineraryViewBudgetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const tripId = Number(id);
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Expense modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseCat, setExpenseCat] = useState('Accommodation');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(1000);
  const [expenseDate, setExpenseDate] = useState('');

  const fetchDetails = async () => {
    if (!tripId) return;
    try {
      setLoading(true);
      const [tripRes, budgetRes] = await Promise.all([
        api.getTripDetail(tripId),
        api.getTripBudget(tripId),
      ]);
      setTrip(tripRes);
      setBudget(budgetRes);
      if (tripRes.start_date) setExpenseDate(tripRes.start_date);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load itinerary and budget view.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [tripId]);

  if (loading || !trip || !budget) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tripDaysCount = Math.max(1, differenceInDays(parseISO(trip.end_date), parseISO(trip.start_date)) + 1);
  const daysArray = Array.from({ length: tripDaysCount }, (_, idx) => {
    const d = addDays(parseISO(trip.start_date), idx);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayActivities = trip.itinerary_activities
      .filter((a) => a.date === dateStr)
      .sort((a, b) => (a.start_time || '00:00').localeCompare(b.start_time || '00:00'));

    // Find city for stop
    let currentCity = 'Transit';
    for (const stop of trip.stops) {
      if (stop.arrival_date <= dateStr && dateStr <= stop.departure_date) {
        currentCity = stop.city?.name || 'City Stop';
        break;
      }
    }

    return {
      dayNum: idx + 1,
      date: dateStr,
      displayDate: format(d, 'EEEE, dd MMMM yyyy'),
      city: currentCity,
      activities: dayActivities,
    };
  });

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addTripExpense(tripId, {
        category: expenseCat,
        description: expenseDesc || `${expenseCat} expense`,
        amount: expenseAmount,
        date: expenseDate || trip.start_date,
      });
      showToast('success', 'Custom expense added to budget!');
      setIsExpenseModalOpen(false);
      setExpenseDesc('');
      fetchDetails();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteExpense = async (expId: number) => {
    try {
      await api.deleteTripExpense(tripId, expId);
      showToast('success', 'Expense removed.');
      fetchDetails();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* ================= HEADER SECTION ================= */}
      <div className="relative rounded-card-lg overflow-hidden bg-surface border border-borderLight shadow-sm">
        <div className="relative h-56 sm:h-64 w-full bg-slate-900 overflow-hidden">
          <img
            src={trip.cover_image || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80'}
            alt={trip.title}
            className="w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* Top Bar on image */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate(`/builder/${trip.id}`)}
              className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30"
            >
              Back to Builder
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/builder/${trip.id}`)}
            >
              Edit Itinerary
            </Button>
          </div>

          {/* Bottom Title & Stats */}
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="teal" size="sm" className="bg-teal-500/90 text-white backdrop-blur-xs font-semibold">
                {trip.travel_style} Travel
              </Badge>
              {trip.is_public && (
                <Badge variant="accent" size="sm" className="bg-amber-500/90 text-white font-semibold">
                  Public Link Live
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md">
              {trip.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 flex flex-wrap items-center gap-3 pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-brand-300" />
                {format(parseISO(trip.start_date), 'dd MMM yyyy')} – {format(parseISO(trip.end_date), 'dd MMM yyyy')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-teal-300" />
                {trip.stops.length} Cities Planned
              </span>
              <span>•</span>
              <span>{tripDaysCount} Days Total</span>
            </p>
          </div>
        </div>

        {/* Route Bar */}
        <div className="p-4 bg-slate-50 border-t border-borderLight flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-ink-secondary">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink-primary">Journey Stops:</span>
            <span>{trip.stops.map((s) => s.city?.name).filter(Boolean).join(' → ') || 'No stops'}</span>
          </div>
          <div className="flex items-center gap-4 font-semibold text-ink-primary">
            <span>Overall Budget: ₹{budget.overall_budget.toLocaleString('en-IN')}</span>
            <span className={budget.is_overbudget ? 'text-rose-600' : 'text-emerald-600'}>
              Estimated Total: ₹{budget.estimated_total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* ================= OVERBUDGET ALERT ================= */}
      {budget.is_overbudget && (
        <div className="p-4 rounded-card bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">
              Budget Warning: You are ₹{budget.overbudget_amount.toLocaleString('en-IN')} over your allocated ₹{budget.overall_budget.toLocaleString('en-IN')} budget!
            </h4>
            <p className="text-xs text-rose-700">
              Responsible high-expenditure category:{' '}
              <strong className="font-bold underline">{budget.overbudget_category}</strong>. You can adjust travel modes, select alternative activities, or add custom budget entries.
            </p>
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT & CHARTS GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT: DAY-BY-DAY ITINERARY TIMELINE (7 COLS) ================= */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink-primary flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand" />
              Day-by-Day Itinerary Plan
            </h2>
            <span className="text-xs text-ink-secondary font-medium">
              Average Cost: <strong className="text-ink-primary font-bold">₹{budget.average_daily_cost.toLocaleString('en-IN')} / Day</strong>
            </span>
          </div>

          <div className="space-y-6">
            {daysArray.map((day) => (
              <Card key={day.dayNum} padding="md" className="space-y-4 border border-borderLight shadow-sm">
                {/* Day Header */}
                <div className="flex items-center justify-between border-b border-borderLight/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                      D{day.dayNum}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink-primary">{day.displayDate}</h3>
                      <p className="text-xs text-teal font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Location: {day.city}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-ink-secondary">
                    {day.activities.length} Activities Scheduled
                  </span>
                </div>

                {/* Day Activities */}
                {day.activities.length === 0 ? (
                  <p className="text-xs text-ink-muted italic py-2">
                    No scheduled activities for this day yet. Add stops and activities in the builder.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {day.activities.map((act) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-xl bg-slate-50 border border-borderLight/60 flex items-start justify-between gap-3 hover:border-brand-200 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-800 text-[11px] font-bold shrink-0 border border-teal-100 min-w-[62px] text-center">
                            {act.start_time} - {act.end_time}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-ink-primary">
                              {act.activity?.name || act.custom_activity_name || 'Activity'}
                            </h4>
                            {act.activity?.category && (
                              <Badge variant="teal" size="sm" className="mt-1">
                                {act.activity.category}
                              </Badge>
                            )}
                            {act.notes && (
                              <p className="text-[11px] text-ink-secondary mt-1">{act.notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-extrabold text-ink-primary flex items-center">
                            <IndianRupee className="w-3 h-3 text-emerald-600" />
                            {act.estimated_cost === 0 ? 'Free' : act.estimated_cost.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* ================= RIGHT: RECHARTS BUDGET ANALYTICS (5 COLS) ================= */}
        <div className="lg:col-span-5 space-y-6 sticky top-20">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink-primary flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-brand" />
              Dynamic Budget Analytics
            </h2>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsExpenseModalOpen(true)}
            >
              Add Expense
            </Button>
          </div>

          {/* Donut Category Chart (Recharts) */}
          <Card padding="md" className="space-y-4 border border-borderLight shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Expense Category Breakdown
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={budget.breakdown_by_category}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {budget.breakdown_by_category.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E4E7EC', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Table */}
            <div className="space-y-1.5 pt-2 border-t border-borderLight/60">
              {budget.breakdown_by_category.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-xs py-1">
                  <span className="flex items-center gap-2 font-medium text-ink-secondary">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.category} ({cat.percentage}%)
                  </span>
                  <span className="font-bold text-ink-primary">₹{cat.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Daily Expenditure Bar Chart (Recharts) */}
          <Card padding="md" className="space-y-4 border border-borderLight shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Daily Cost Allocation (Bar Chart)
            </h3>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budget.daily_breakdown}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E4E7EC', fontSize: '12px' }}
                  />
                  <Bar dataKey="total_cost" fill="#1769AA" radius={[4, 4, 0, 0]} name="Day Total (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Custom Recorded Expenses List */}
          {trip.expenses.length > 0 && (
            <Card padding="md" className="space-y-3 border border-borderLight">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                Recorded Custom Expenses
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {trip.expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-borderLight/60"
                  >
                    <div>
                      <span className="font-bold text-ink-primary block">{exp.description}</span>
                      <span className="text-[10px] text-ink-secondary">{exp.category} • {exp.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700">₹{exp.amount.toLocaleString('en-IN')}</span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-ink-muted hover:text-rose-600 p-1"
                        title="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ================= ADD EXPENSE MODAL ================= */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Add Custom Expense"
        maxWidth="sm"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Select
            label="Category *"
            value={expenseCat}
            onChange={(e) => setExpenseCat(e.target.value)}
            options={[
              { value: 'Accommodation', label: 'Accommodation' },
              { value: 'Transport', label: 'Transport' },
              { value: 'Activities', label: 'Activities & Tours' },
              { value: 'Food', label: 'Food & Dining' },
              { value: 'Other', label: 'Shopping & Miscellaneous' },
            ]}
          />

          <Input
            label="Description *"
            placeholder="e.g. Desert tent booking in Jaisalmer"
            value={expenseDesc}
            onChange={(e) => setExpenseDesc(e.target.value)}
            required
          />

          <Input
            label="Amount (INR ₹) *"
            type="number"
            min="0"
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(Number(e.target.value))}
            leftIcon={<IndianRupee className="w-4 h-4" />}
            required
          />

          <Input
            label="Date *"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
          />

          <div className="pt-2 border-t border-borderLight flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setIsExpenseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Record Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
