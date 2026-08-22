import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  IndianRupee,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { Trip, TripDetail } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns';

export const CalendarTimelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [trips, setTrips] = useState<TripDetail[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllTripDetails() {
      try {
        setLoading(true);
        const list = await api.getTrips();
        const fullTrips = await Promise.all(list.map((t) => api.getTripDetail(t.id)));
        setTrips(fullTrips);
        if (fullTrips.length > 0 && fullTrips[0].start_date) {
          setSelectedDate(parseISO(fullTrips[0].start_date));
          setCurrentMonth(parseISO(fullTrips[0].start_date));
        }
      } catch (err: any) {
        showToast('error', 'Failed to load calendar events.');
      } finally {
        setLoading(false);
      }
    }
    loadAllTripDetails();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Helper to find trip for a date
  const getTripForDate = (date: Date) => {
    return trips.find((t) => {
      try {
        return isWithinInterval(date, {
          start: parseISO(t.start_date),
          end: parseISO(t.end_date),
        });
      } catch {
        return false;
      }
    });
  };

  // Helper to find activities for selected date
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const activeTripForSelectedDate = getTripForDate(selectedDate);
  const activitiesForSelectedDate = activeTripForSelectedDate?.itinerary_activities.filter(
    (a) => a.date === selectedDateStr
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Trip Calendar & Timeline</h1>
          <p className="text-xs text-ink-secondary">
            Visualize your multi-day journeys, stops, and scheduled activities
          </p>
        </div>

        {/* Calendar / Timeline Toggle */}
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-borderLight shadow-xs">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'calendar' ? 'bg-brand text-white shadow-xs' : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            Calendar View
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'timeline' ? 'bg-brand text-white shadow-xs' : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            Vertical Timeline
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Calendar Grid (8 COLS) */}
          <div className="lg:col-span-8 space-y-4">
            <Card padding="md" className="border border-borderLight shadow-sm">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-borderLight">
                <h2 className="text-base font-bold text-ink-primary">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-1.5 rounded-lg text-ink-secondary hover:bg-slate-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-50 rounded-md"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-1.5 rounded-lg text-ink-secondary hover:bg-slate-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-ink-muted mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days Matrix */}
              <div className="grid grid-cols-7 gap-1.5">
                {daysInMonth.map((day, idx) => {
                  const tripOnDay = getTripForDate(day);
                  const isSelected = isSameDay(day, selectedDate);

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-[72px] sm:min-h-[88px] p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-brand bg-brand-50/80 ring-2 ring-brand/30'
                          : tripOnDay
                          ? 'border-brand-200/80 bg-brand-50/40 hover:bg-brand-50/70'
                          : 'border-borderLight/70 bg-surface hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold ${isSelected ? 'text-brand' : 'text-ink-primary'}`}>
                          {format(day, 'd')}
                        </span>
                        {tripOnDay && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                        )}
                      </div>

                      {tripOnDay && (
                        <div className="mt-1">
                          <span className="block text-[10px] font-bold text-brand truncate">
                            {tripOnDay.title}
                          </span>
                          <span className="text-[9px] text-teal block truncate">
                            {tripOnDay.stops.length} stops
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Selected Date Inspector (4 COLS) */}
          <div className="lg:col-span-4 space-y-4">
            <Card padding="md" className="border border-borderLight shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-borderLight pb-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal">Day Inspector</span>
                  <h3 className="text-base font-bold text-ink-primary">
                    {format(selectedDate, 'EEEE, dd MMM yyyy')}
                  </h3>
                </div>
                {activeTripForSelectedDate && (
                  <Badge variant="brand" size="sm">Active Trip</Badge>
                )}
              </div>

              {activeTripForSelectedDate ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-borderLight/80">
                    <h4 className="text-sm font-bold text-ink-primary">{activeTripForSelectedDate.title}</h4>
                    <p className="text-xs text-ink-secondary mt-0.5">
                      {activeTripForSelectedDate.stops.map((s) => s.city?.name).filter(Boolean).join(' → ')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary block">
                      Scheduled Activities ({activitiesForSelectedDate.length})
                    </span>

                    {activitiesForSelectedDate.length === 0 ? (
                      <p className="text-xs text-ink-muted italic py-2">
                        No activities scheduled for this date yet.
                      </p>
                    ) : (
                      activitiesForSelectedDate.map((act) => (
                        <div
                          key={act.id}
                          className="p-2.5 rounded-lg bg-surface border border-borderLight/80 text-xs space-y-1 shadow-2xs"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-ink-primary">{act.activity?.name || act.custom_activity_name}</span>
                            <span className="font-bold text-teal">{act.start_time} - {act.end_time}</span>
                          </div>
                          {act.activity?.category && (
                            <span className="text-[10px] text-ink-secondary block">{act.activity.category}</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => navigate(`/builder/${activeTripForSelectedDate.id}`)}
                  >
                    Open in Builder
                  </Button>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-ink-secondary space-y-2">
                  <CalendarIcon className="w-6 h-6 text-ink-muted mx-auto" />
                  <p>No active trips scheduled on this day.</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/create-trip')}>
                    Schedule a Trip
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        /* Vertical Chronological Timeline Mode */
        <div className="space-y-6 max-w-4xl mx-auto">
          {trips.map((t) => (
            <Card key={t.id} padding="md" className="space-y-4 border border-borderLight shadow-sm">
              <div className="flex items-center justify-between border-b border-borderLight pb-3">
                <div>
                  <h3 className="text-lg font-bold text-ink-primary">{t.title}</h3>
                  <p className="text-xs text-ink-secondary">
                    {format(parseISO(t.start_date), 'dd MMM')} – {format(parseISO(t.end_date), 'dd MMM yyyy')} ({t.duration_days} Days)
                  </p>
                </div>
                <Button size="sm" variant="primary" onClick={() => navigate(`/builder/${t.id}`)}>
                  View Plan
                </Button>
              </div>

              <div className="space-y-4 pl-4 border-l-2 border-brand-200">
                {t.stops.map((stop, idx) => (
                  <div key={stop.id} className="relative space-y-1">
                    <div className="absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full bg-brand ring-4 ring-white" />
                    <h4 className="text-sm font-bold text-ink-primary">{stop.city?.name}</h4>
                    <p className="text-xs text-ink-secondary">
                      {format(parseISO(stop.arrival_date), 'dd MMM')} → {format(parseISO(stop.departure_date), 'dd MMM')} via {stop.travel_mode}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
