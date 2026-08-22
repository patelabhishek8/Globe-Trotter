import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Calendar,
  IndianRupee,
  Copy,
  Share2,
  Clock,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { TripDetail } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';

export const PublicSharedTripPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPublicTrip() {
      if (!token) return;
      try {
        setLoading(true);
        const res = await api.getSharedTrip(token);
        setTrip(res);
      } catch (err: any) {
        setError(err.message || 'Shared trip not found or link has expired.');
      } finally {
        setLoading(false);
      }
    }
    loadPublicTrip();
  }, [token]);

  const handleCopyTrip = async () => {
    if (!token) return;
    if (!user) {
      showToast('info', 'Please log in to copy this trip to your account.');
      navigate('/login');
      return;
    }
    try {
      const cloned = await api.copySharedTrip(token);
      showToast('success', `Copied "${trip?.title}" to your personal trips!`);
      navigate(`/builder/${cloned.id}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to copy trip.');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('success', 'Public trip link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <Compass className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-ink-primary">Trip Unavailable</h2>
        <p className="text-sm text-ink-secondary max-w-md">{error || 'This public itinerary link does not exist.'}</p>
        <Button variant="primary" onClick={() => navigate('/community')}>
          Explore Community Trips
        </Button>
      </div>
    );
  }

  const tripDaysCount = Math.max(1, differenceInDays(parseISO(trip.end_date), parseISO(trip.start_date)) + 1);
  const daysArray = Array.from({ length: tripDaysCount }, (_, idx) => {
    const d = addDays(parseISO(trip.start_date), idx);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayActs = trip.itinerary_activities
      .filter((a) => a.date === dateStr)
      .sort((a, b) => (a.start_time || '00:00').localeCompare(b.start_time || '00:00'));

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
      activities: dayActs,
    };
  });

  return (
    <div className="min-h-screen bg-canvas pb-16">
      {/* Top Floating Navbar */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-borderLight px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-brand">GlobeTrotter</span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" leftIcon={<Share2 className="w-3.5 h-3.5" />} onClick={handleCopyLink}>
            Share Link
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Copy className="w-3.5 h-3.5" />} onClick={handleCopyTrip}>
            Copy Trip to My Account
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        {/* Cover Hero Banner */}
        <div className="relative rounded-card-lg overflow-hidden h-72 sm:h-96 w-full shadow-lg">
          <img
            src={trip.cover_image || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80'}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="teal" size="sm" className="bg-teal-500 text-white font-semibold">
                {trip.travel_style} Travel
              </Badge>
              <Badge variant="accent" size="sm" className="bg-amber-500 text-white font-semibold">
                Shared Itinerary
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md">
              {trip.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 flex flex-wrap items-center gap-3">
              <span>By {trip.user_name || 'Traveler'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-300" />
                {tripDaysCount} Days ({format(parseISO(trip.start_date), 'dd MMM')} – {format(parseISO(trip.end_date), 'dd MMM yyyy')})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                ₹{Number(trip.overall_budget).toLocaleString('en-IN')} Budget
              </span>
            </p>
          </div>
        </div>

        {/* Route Highlights */}
        <Card padding="md" className="space-y-2 border border-borderLight">
          <span className="text-xs font-bold uppercase tracking-wider text-teal">Journey Route</span>
          <div className="text-sm font-bold text-ink-primary">
            {trip.stops.map((s) => s.city?.name).filter(Boolean).join(' → ') || 'Multi-city travel route'}
          </div>
          {trip.description && <p className="text-xs text-ink-secondary pt-1 leading-relaxed">{trip.description}</p>}
        </Card>

        {/* Day-by-Day Read-Only Timeline */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-ink-primary flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand" />
            Complete Day-by-Day Schedule
          </h2>

          <div className="space-y-6">
            {daysArray.map((day) => (
              <Card key={day.dayNum} padding="md" className="space-y-4 border border-borderLight shadow-sm">
                <div className="flex items-center justify-between border-b border-borderLight/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand text-white font-extrabold text-xs flex items-center justify-center">
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
                  <span className="text-xs font-semibold text-ink-secondary">
                    {day.activities.length} Activities
                  </span>
                </div>

                {day.activities.length === 0 ? (
                  <p className="text-xs text-ink-muted italic py-1">Leisure & transit day.</p>
                ) : (
                  <div className="space-y-2.5">
                    {day.activities.map((act) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-xl bg-slate-50 border border-borderLight/60 flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-800 text-[11px] font-bold shrink-0 border border-teal-100 min-w-[62px] text-center">
                            {act.start_time} - {act.end_time}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-ink-primary">
                              {act.activity?.name || act.custom_activity_name}
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

                        <span className="text-xs font-bold text-ink-primary">
                          {act.estimated_cost === 0 ? 'Free' : `₹${act.estimated_cost.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom Copy CTA */}
        <div className="p-8 rounded-card-lg bg-gradient-to-r from-brand to-teal text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-bold">Love this itinerary?</h3>
            <p className="text-xs text-white/90">
              Clone this complete plan into your GlobeTrotter account and customize it to your dates!
            </p>
          </div>
          <Button
            variant="accent"
            size="lg"
            leftIcon={<Copy className="w-4 h-4" />}
            onClick={handleCopyTrip}
          >
            Copy Trip to My Account
          </Button>
        </div>
      </div>
    </div>
  );
};
