import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Compass,
  Calendar as CalendarIcon,
  IndianRupee,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Share2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Plane,
  Train,
  Bus,
  Car,
  MoveVertical,
  PieChart,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  X,
  Filter,
  Search,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import {
  Activity,
  BudgetSummary,
  City,
  ConflictCheckResult,
  ConflictWarning,
  ItineraryActivity,
  TripDetail,
  TripStop,
} from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Drawer } from '../components/common/Drawer';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Card } from '../components/common/Card';
import { CardSkeleton } from '../components/common/Skeleton';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';

export const ItineraryBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const tripId = Number(id);

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [conflicts, setConflicts] = useState<ConflictCheckResult | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [availableActivities, setAvailableActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Day Navigation state
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Stop Modal state
  const [isAddStopModalOpen, setIsAddStopModalOpen] = useState(false);
  const [stopCityId, setStopCityId] = useState<number>(0);
  const [stopArrival, setStopArrival] = useState('');
  const [stopDeparture, setStopDeparture] = useState('');
  const [stopTravelMode, setStopTravelMode] = useState<'Flight' | 'Train' | 'Bus' | 'Car' | 'Other'>('Train');
  const [stopTravelCost, setStopTravelCost] = useState(500);
  const [stopNotes, setStopNotes] = useState('');

  // Activity Drawer state
  const [isAddActivityDrawerOpen, setIsAddActivityDrawerOpen] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState('All');
  const [drawerSelectedCityId, setDrawerSelectedCityId] = useState<number | null>(null);

  // Schedule Modal state
  const [isCustomActivityModalOpen, setIsCustomActivityModalOpen] = useState(false);
  const [customActName, setCustomActName] = useState('');
  const [customActStart, setCustomActStart] = useState('10:00');
  const [customActEnd, setCustomActEnd] = useState('12:00');
  const [customActCost, setCustomActCost] = useState(0);
  const [customActNotes, setCustomActNotes] = useState('');
  const [pendingActivityId, setPendingActivityId] = useState<number | null>(null);

  // Share Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareToken, setShareToken] = useState('');
  const [isSharingTrip, setIsSharingTrip] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Deletion state
  const [deleteStopId, setDeleteStopId] = useState<number | null>(null);
  const [deleteActivityId, setDeleteActivityId] = useState<number | null>(null);

  const fetchTripData = async () => {
    if (!tripId) return;
    try {
      setLoading(true);
      const [tripRes, budgetRes, conflictRes, citiesRes, actsRes] = await Promise.all([
        api.getTripDetail(tripId),
        api.getTripBudget(tripId),
        api.getTripConflicts(tripId),
        api.getCities(),
        api.getActivities(),
      ]);
      setTrip(tripRes);
      setBudget(budgetRes);
      setConflicts(conflictRes);
      setCities(citiesRes);
      setAvailableActivities(actsRes);
      setShareToken(tripRes.share_token || '');

      if (citiesRes.length > 0 && stopCityId === 0) {
        setStopCityId(citiesRes[0].id);
      }
      if (tripRes.start_date) {
        setStopArrival(tripRes.start_date);
        setStopDeparture(tripRes.start_date);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load trip builder.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripData();
  }, [tripId]);

  if (loading || !trip) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-ink-secondary">Loading Itinerary Builder...</p>
        </div>
      </div>
    );
  }

  const tripDaysCount = Math.max(1, differenceInDays(parseISO(trip.end_date), parseISO(trip.start_date)) + 1);
  const daysList = Array.from({ length: tripDaysCount }, (_, idx) => {
    const d = addDays(parseISO(trip.start_date), idx);
    const dateStr = format(d, 'yyyy-MM-dd');

    // Find city assigned to this day
    let cityForDay: City | undefined = undefined;
    for (const stop of trip.stops) {
      if (stop.arrival_date <= dateStr && dateStr <= stop.departure_date) {
        cityForDay = stop.city;
        break;
      }
    }

    return {
      index: idx,
      dayNum: idx + 1,
      dateStr,
      displayDate: format(d, 'dd MMM (EEE)'),
      city: cityForDay,
    };
  });

  const activeDay = daysList[selectedDayIndex] || daysList[0];
  const currentSelectedDate = activeDay?.dateStr || trip.start_date;
  const currentDayCity = activeDay?.city || (trip.stops.length > 0 ? trip.stops[0].city : undefined);

  const currentDayActivities = trip.itinerary_activities
    .filter((a) => a.date === currentSelectedDate)
    .sort((a, b) => (a.start_time || '00:00').localeCompare(b.start_time || '00:00'));

  // City-filtered activities for "Add Activity" Drawer
  const activeDrawerCityId = drawerSelectedCityId || currentDayCity?.id || (trip.stops[0]?.city_id);
  const filteredActivities = availableActivities.filter((act) => {
    const matchesCity = !activeDrawerCityId || act.city_id === activeDrawerCityId;
    const matchesSearch =
      !activitySearch ||
      act.name.toLowerCase().includes(activitySearch.toLowerCase()) ||
      act.description.toLowerCase().includes(activitySearch.toLowerCase());
    const matchesCat = activityCategoryFilter === 'All' || act.category === activityCategoryFilter;
    return matchesCity && matchesSearch && matchesCat;
  });

  // ================= Stop Operations =================
  const handleAddStopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(stopDeparture) < new Date(stopArrival)) {
      showToast('error', 'Departure date cannot be before arrival date.');
      return;
    }
    try {
      await api.addStop(tripId, {
        city_id: stopCityId,
        arrival_date: stopArrival,
        departure_date: stopDeparture,
        travel_mode: stopTravelMode,
        travel_cost: stopTravelCost,
        notes: stopNotes,
      });
      showToast('success', 'Destination stop added to route!');
      setIsAddStopModalOpen(false);
      fetchTripData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteStop = async (stopId: number) => {
    try {
      await api.deleteStop(tripId, stopId);
      showToast('success', 'Stop removed from route.');
      fetchTripData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleMoveStop = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= trip.stops.length) return;

    const newStops = [...trip.stops];
    const [moved] = newStops.splice(index, 1);
    newStops.splice(targetIndex, 0, moved);

    const reorderPayload = newStops.map((s, idx) => ({ id: s.id, order_index: idx }));
    try {
      await api.reorderStops(tripId, reorderPayload);
      fetchTripData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // ================= Activity Operations =================
  const handleAddCatalogActivity = (act: Activity) => {
    setPendingActivityId(act.id);
    setCustomActName(act.name);
    setCustomActCost(act.estimated_cost);
    setCustomActNotes('');
    setCustomActStart('10:00');
    setCustomActEnd('12:00');
    setIsCustomActivityModalOpen(true);
  };

  const handleScheduleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customActEnd <= customActStart) {
      showToast('error', 'End time must be later than start time.');
      return;
    }
    try {
      await api.addItineraryActivity(tripId, {
        date: currentSelectedDate,
        start_time: customActStart,
        end_time: customActEnd,
        activity_id: pendingActivityId || undefined,
        custom_activity_name: !pendingActivityId ? customActName : undefined,
        estimated_cost: customActCost,
        notes: customActNotes,
      });

      showToast('success', `Activity scheduled for ${format(parseISO(currentSelectedDate), 'dd MMM')}!`);
      setIsCustomActivityModalOpen(false);
      setIsAddActivityDrawerOpen(false);
      fetchTripData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteActivity = async () => {
    if (!deleteActivityId) return;
    try {
      await api.deleteItineraryActivity(tripId, deleteActivityId);
      showToast('success', 'Activity removed from day schedule.');
      setDeleteActivityId(null);
      fetchTripData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // ================= Share Modal Operations =================
  const handleShareClick = async () => {
    try {
      setIsSharingTrip(true);
      const res = await api.toggleShareTrip(trip.id);
      setShareToken(res.share_token || '');
      setTrip((prev) => (prev ? { ...prev, is_public: res.is_public, share_token: res.share_token } : null));
      setIsShareModalOpen(true);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to generate share link.');
    } finally {
      setIsSharingTrip(false);
    }
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/shared-trip/${shareToken || trip.share_token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('success', 'Public share link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const travelModeIcon = (mode: string) => {
    switch (mode) {
      case 'Flight': return <Plane className="w-3.5 h-3.5" />;
      case 'Bus': return <Bus className="w-3.5 h-3.5" />;
      case 'Car': return <Car className="w-3.5 h-3.5" />;
      default: return <Train className="w-3.5 h-3.5" />;
    }
  };

  // List of cities on this trip
  const routeCitiesDisplay = trip.stops.map((s) => s.city?.name).filter(Boolean).join(' → ') || 'No cities added';

  return (
    <div className="space-y-6">
      {/* ================= TOP HEADER WITH CITY NAME & ACTIONS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 sm:p-6 rounded-card border border-borderLight shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal">Itinerary Builder</span>
            <Badge variant="brand" size="sm">{trip.travel_style} Style</Badge>
            {trip.is_public && (
              <Badge variant="teal" size="sm" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Public Shared
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-black text-ink-primary">{trip.title}</h1>

          {/* City / Route Name Display */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-secondary">
            <span className="font-bold text-brand flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {routeCitiesDisplay}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5 text-ink-muted" />
              {format(parseISO(trip.start_date), 'dd MMM yyyy')} – {format(parseISO(trip.end_date), 'dd MMM yyyy')} ({tripDaysCount} Days)
            </span>
            <span>•</span>
            <span>{trip.stops.length} City Stops</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<PieChart className="w-3.5 h-3.5 text-brand" />}
            onClick={() => navigate(`/itinerary/${trip.id}/budget`)}
          >
            Budget Breakdown
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Calendar className="w-3.5 h-3.5 text-teal" />}
            onClick={() => navigate('/calendar')}
          >
            Calendar View
          </Button>
          <Button
            variant={trip.is_public ? 'teal' : 'primary'}
            size="sm"
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
            isLoading={isSharingTrip}
            onClick={handleShareClick}
          >
            {trip.is_public ? 'Share Itinerary' : 'Share Trip'}
          </Button>
        </div>
      </div>

      {/* Overlap / Conflict Warning Banner */}
      {conflicts?.has_conflicts && (
        <div className="p-4 rounded-card bg-amber-50 border border-amber-300 text-amber-900 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Schedule Overlap Conflict Detected!</span>
          </div>
          {conflicts.conflicts.map((c: ConflictWarning, i: number) => (
            <p key={i} className="text-xs leading-relaxed">
              • {c.message}
            </p>
          ))}
        </div>
      )}

      {/* ================= 3-COLUMN DESKTOP LAYOUT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN: STOPS ROUTE (4 COLS) ================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink-primary">
                Trip Route & Stops ({trip.stops.length})
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsAddStopModalOpen(true)}
            >
              Add Stop
            </Button>
          </div>

          {trip.stops.length === 0 ? (
            <div className="p-6 text-center bg-surface rounded-card border border-dashed border-borderLight space-y-2">
              <MapPin className="w-6 h-6 text-ink-muted mx-auto" />
              <p className="text-xs text-ink-secondary">No destination stops added yet.</p>
              <Button variant="primary" size="sm" onClick={() => setIsAddStopModalOpen(true)}>
                Add First Stop
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {trip.stops.map((stop, idx) => (
                <div key={stop.id} className="space-y-2">
                  <div className="p-3.5 rounded-xl bg-surface border border-borderLight hover:border-brand-300 transition-all shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-brand-50 text-brand text-xs font-bold flex items-center justify-center border border-brand-200">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-ink-primary">{stop.city?.name}</h3>
                          <p className="text-[11px] text-ink-secondary">
                            {format(parseISO(stop.arrival_date), 'dd MMM')} – {format(parseISO(stop.departure_date), 'dd MMM')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {idx > 0 && (
                          <button
                            onClick={() => handleMoveStop(idx, 'up')}
                            className="p-1 rounded text-ink-muted hover:text-ink-primary hover:bg-slate-100"
                            title="Move Up"
                          >
                            ↑
                          </button>
                        )}
                        {idx < trip.stops.length - 1 && (
                          <button
                            onClick={() => handleMoveStop(idx, 'down')}
                            className="p-1 rounded text-ink-muted hover:text-ink-primary hover:bg-slate-100"
                            title="Move Down"
                          >
                            ↓
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteStop(stop.id)}
                          className="p-1 rounded text-ink-muted hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Stop"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-borderLight/60 text-xs text-ink-secondary">
                      <span className="flex items-center gap-1.5 font-medium">
                        {travelModeIcon(stop.travel_mode)}
                        {stop.travel_mode}
                      </span>
                      <span className="font-bold text-ink-primary">
                        {stop.travel_cost === 0 ? '₹0 Transit' : `₹${stop.travel_cost}`}
                      </span>
                    </div>
                  </div>

                  {idx < trip.stops.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <div className="w-0.5 h-4 bg-brand-200" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= CENTER COLUMN: DAY SCHEDULE & TIMELINE (5 COLS) ================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink-primary">
                Day Schedule & Timeline
              </h2>
            </div>
            <Button
              variant="teal"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                setDrawerSelectedCityId(currentDayCity?.id || null);
                setIsAddActivityDrawerOpen(true);
              }}
            >
              Add Activity
            </Button>
          </div>

          {/* Horizontal Scrollable Day Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-borderLight scrollbar-thin">
            {daysList.map((d, idx) => {
              const isSelected = selectedDayIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all text-left ${
                    isSelected
                      ? 'bg-brand text-white shadow-xs'
                      : 'bg-surface border border-borderLight text-ink-secondary hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-[10px] opacity-80 uppercase">Day {d.dayNum}</span>
                  <span>{d.displayDate}</span>
                </button>
              );
            })}
          </div>

          {/* Active Day City Banner */}
          <div className="p-3 rounded-xl bg-slate-50 border border-borderLight/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand" />
              <div>
                <span className="text-xs font-bold text-ink-primary">
                  {currentDayCity ? `Visiting ${currentDayCity.name}, ${currentDayCity.state}` : 'Transit & Leisure Day'}
                </span>
                <p className="text-[11px] text-ink-secondary">
                  {format(parseISO(currentSelectedDate), 'EEEE, dd MMMM yyyy')}
                </p>
              </div>
            </div>
            {currentDayCity && (
              <Badge variant="teal" size="sm">
                {currentDayCity.region} India
              </Badge>
            )}
          </div>

          {/* Scheduled Day Activities List */}
          <div className="space-y-2.5">
            {currentDayActivities.length === 0 ? (
              <div className="p-8 text-center bg-surface rounded-card border border-dashed border-borderLight space-y-2">
                <Clock className="w-6 h-6 text-ink-muted mx-auto" />
                <p className="text-xs text-ink-secondary">No activities scheduled for this date.</p>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setDrawerSelectedCityId(currentDayCity?.id || null);
                    setIsAddActivityDrawerOpen(true);
                  }}
                >
                  Schedule an Activity in {currentDayCity?.name || 'Destination'}
                </Button>
              </div>
            ) : (
              currentDayActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-surface border border-borderLight hover:border-brand-300 transition-all shadow-xs flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-teal-50 text-teal-800 text-[11px] font-bold shrink-0 border border-teal-100 text-center min-w-[62px]">
                      {act.start_time} - {act.end_time}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink-primary">
                        {act.activity?.name || act.custom_activity_name}
                      </h4>
                      {act.activity?.category && (
                        <span className="inline-block text-[10px] font-semibold text-teal mt-0.5">
                          {act.activity.category}
                        </span>
                      )}
                      {act.notes && (
                        <p className="text-[11px] text-ink-secondary mt-1">{act.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-ink-primary">
                      {act.estimated_cost === 0 ? 'Free' : `₹${act.estimated_cost}`}
                    </span>
                    <button
                      onClick={() => setDeleteActivityId(act.id)}
                      className="p-1 text-ink-muted hover:text-rose-600 rounded"
                      title="Remove Activity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: LIVE BUDGET PANEL (3 COLS) ================= */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-1.5">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-primary">
              Live Budget & Analytics
            </h2>
          </div>

          <Card padding="md" className="space-y-4 border border-borderLight shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-borderLight">
              <span className="text-xs font-semibold text-ink-secondary">Budget Status</span>
              <Badge variant={budget?.is_overbudget ? 'danger' : 'success'} size="sm">
                {budget?.is_overbudget ? 'Over Budget' : 'On Track'}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-ink-secondary">Allocated Budget:</span>
                <span className="font-bold text-ink-primary">₹{Number(trip.overall_budget).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-secondary">Estimated Total:</span>
                <span className={`font-bold ${budget?.is_overbudget ? 'text-rose-600' : 'text-emerald-700'}`}>
                  ₹{Number(budget?.estimated_total || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    budget?.is_overbudget ? 'bg-rose-500' : 'bg-brand'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round(((budget?.estimated_total || 0) / (trip.overall_budget || 1)) * 100))}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-ink-muted text-right block">
                {Math.round(((budget?.estimated_total || 0) / (trip.overall_budget || 1)) * 100)}% Utilized
              </span>
            </div>

            {/* Quick breakdown preview */}
            {budget?.breakdown_by_category && (
              <div className="space-y-1.5 pt-2 border-t border-borderLight text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                  Category Breakdown
                </span>
                {budget.breakdown_by_category.map((cat) => (
                  <div key={cat.category} className="flex justify-between text-[11px] text-ink-secondary">
                    <span>{cat.category}:</span>
                    <span className="font-bold text-ink-primary">₹{cat.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/itinerary/${trip.id}/budget`)}
            >
              Full Budget Breakdown
            </Button>
          </Card>
        </div>
      </div>

      {/* ================= ADD STOP MODAL ================= */}
      <Modal
        isOpen={isAddStopModalOpen}
        onClose={() => setIsAddStopModalOpen(false)}
        title="Add Destination Stop to Route"
        maxWidth="md"
      >
        <form onSubmit={handleAddStopSubmit} className="space-y-4">
          <Select
            label="Destination City *"
            value={stopCityId}
            onChange={(e) => setStopCityId(Number(e.target.value))}
            options={cities.map((c) => ({ value: c.id, label: `${c.name} (${c.state}, ${c.region} India)` }))}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Arrival Date *"
              type="date"
              value={stopArrival}
              onChange={(e) => setStopArrival(e.target.value)}
              required
            />
            <Input
              label="Departure Date *"
              type="date"
              value={stopDeparture}
              onChange={(e) => setStopDeparture(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Travel Mode"
              value={stopTravelMode}
              onChange={(e) => setStopTravelMode(e.target.value as any)}
              options={[
                { value: 'Train', label: 'Train (IRCTC)' },
                { value: 'Flight', label: 'Flight' },
                { value: 'Bus', label: 'Bus' },
                { value: 'Car', label: 'Car / Taxi' },
                { value: 'Other', label: 'Other' },
              ]}
            />
            <Input
              label="Transit Cost (INR ₹)"
              type="number"
              value={stopTravelCost}
              onChange={(e) => setStopTravelCost(Number(e.target.value))}
            />
          </div>

          <div className="pt-2 border-t border-borderLight flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setIsAddStopModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add Stop to Route
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= ADD ACTIVITY DRAWER (CITY SPECIFIC) ================= */}
      <Drawer
        isOpen={isAddActivityDrawerOpen}
        onClose={() => setIsAddActivityDrawerOpen(false)}
        title={
          <div>
            <h3 className="text-base font-bold text-ink-primary">
              Add Activity to Day {activeDay?.dayNum}
            </h3>
            <p className="text-xs text-teal font-semibold">
              Showing experiences in {currentDayCity?.name || 'Selected Destination'}
            </p>
          </div>
        }
      >
        <div className="space-y-4">
          {/* City Selector within Drawer */}
          {trip.stops.length > 1 && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-borderLight">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-secondary mb-1">
                Filter by Stop City:
              </label>
              <select
                value={activeDrawerCityId || ''}
                onChange={(e) => setDrawerSelectedCityId(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-borderLight bg-white font-semibold text-ink-primary focus:ring-2 focus:ring-brand"
              >
                {trip.stops.map((s) => (
                  <option key={s.id} value={s.city_id}>
                    {s.city?.name} ({s.city?.state})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search & Category Filter */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search activities in this city..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {['All', 'Sightseeing', 'Culture', 'Food', 'Adventure', 'Nature', 'Photography'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActivityCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  activityCategoryFilter === cat
                    ? 'bg-teal text-white'
                    : 'bg-slate-100 text-ink-secondary hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Custom Activity Option Button */}
          <button
            onClick={() => {
              setPendingActivityId(null);
              setCustomActName('');
              setCustomActCost(0);
              setCustomActNotes('');
              setIsCustomActivityModalOpen(true);
            }}
            className="w-full p-3 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 hover:bg-brand-50 text-brand text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Custom Activity / Event</span>
          </button>

          {/* Activities List */}
          <div className="space-y-3">
            {filteredActivities.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-xs text-ink-muted">
                No activities found for this city and category filter.
              </div>
            ) : (
              filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-surface border border-borderLight hover:border-brand-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={act.image_url}
                      alt={act.name}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-ink-primary truncate">{act.name}</h4>
                      <p className="text-[10px] text-ink-secondary flex items-center gap-2 mt-0.5">
                        <span className="text-teal font-semibold">{act.category}</span>
                        <span>•</span>
                        <span>{act.duration_hours} Hours</span>
                      </p>
                      <p className="text-[11px] text-emerald-700 font-bold mt-1">
                        {act.estimated_cost === 0 ? 'Free Entry' : `₹${act.estimated_cost}`}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => handleAddCatalogActivity(act)}
                  >
                    Select
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Drawer>

      {/* ================= SCHEDULE / CUSTOM ACTIVITY MODAL ================= */}
      <Modal
        isOpen={isCustomActivityModalOpen}
        onClose={() => setIsCustomActivityModalOpen(false)}
        title={pendingActivityId ? 'Schedule Activity Time Slot' : 'Create Custom Activity'}
        maxWidth="sm"
      >
        <form onSubmit={handleScheduleActivitySubmit} className="space-y-4">
          <Input
            label="Activity Name *"
            value={customActName}
            onChange={(e) => setCustomActName(e.target.value)}
            disabled={pendingActivityId !== null}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time *"
              type="time"
              value={customActStart}
              onChange={(e) => setCustomActStart(e.target.value)}
              required
            />
            <Input
              label="End Time *"
              type="time"
              value={customActEnd}
              onChange={(e) => setCustomActEnd(e.target.value)}
              required
            />
          </div>

          <Input
            label="Estimated Cost (INR ₹)"
            type="number"
            value={customActCost}
            onChange={(e) => setCustomActCost(Number(e.target.value))}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Personal Notes / Booking Details
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Bring camera, ticket reference number..."
              value={customActNotes}
              onChange={(e) => setCustomActNotes(e.target.value)}
              className="w-full rounded-lg border border-borderLight p-2.5 text-xs text-ink-primary focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-2 border-t border-borderLight flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsCustomActivityModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm & Add to Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= SHARE TRIP MODAL ================= */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-teal" />
            <span>Share Your Travel Itinerary</span>
          </div>
        }
        maxWidth="md"
      >
        <div className="space-y-5">
          <p className="text-xs text-ink-secondary leading-relaxed">
            Anyone with this link can view your read-only itinerary schedule and clone it to their own account.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-borderLight space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-secondary">
              Public Itinerary URL:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/shared-trip/${shareToken || trip.share_token}`}
                className="flex-1 bg-white border border-borderLight rounded-lg px-3 py-2 text-xs font-mono text-ink-primary select-all"
              />
              <Button
                variant={copiedLink ? 'secondary' : 'primary'}
                size="sm"
                leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                onClick={handleCopyShareLink}
              >
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-borderLight">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() => {
                window.open(`/shared-trip/${shareToken || trip.share_token}`, '_blank');
              }}
            >
              Open Public Page Preview
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsShareModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Activity Deletion Confirm */}
      <Modal
        isOpen={deleteActivityId !== null}
        onClose={() => setDeleteActivityId(null)}
        title="Remove Activity"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-ink-secondary">
            Are you sure you want to remove this activity from your schedule?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteActivityId(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteActivity}>
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
