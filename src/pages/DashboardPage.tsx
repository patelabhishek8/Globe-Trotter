import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  Compass,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  Star,
  Heart,
  Clock,
  IndianRupee,
  Layers,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { City, RecommendationData, Trip, Activity, CityWithActivities } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { TripCard } from '../components/cards/TripCard';
import { CityCard } from '../components/cards/CityCard';
import { CardSkeleton } from '../components/common/Skeleton';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [popularCities, setPopularCities] = useState<City[]>([]);
  const [savedCityIds, setSavedCityIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog and Details Modal state
  const [deleteTripId, setDeleteTripId] = useState<number | null>(null);
  const [detailCity, setDetailCity] = useState<CityWithActivities | null>(null);
  const [detailCityLoading, setDetailCityLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tripsData, recData, citiesData, actsData, favsData] = await Promise.all([
        api.getTrips(),
        api.getRecommendations().catch(() => null),
        api.getCities({ sort_by: 'popularity', order: 'desc' }),
        api.getActivities().catch(() => []),
        api.getFavorites().catch(() => []),
      ]);

      setTrips(tripsData);
      setRecommendations(recData);
      setAllCities(citiesData);
      setAllActivities(actsData);
      setPopularCities(citiesData.slice(0, 4));
      const favCityIds = favsData.filter((f) => f.item_type === 'city').map((f) => f.item_id);
      setSavedCityIds(favCityIds);
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle click outside autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsAutocompleteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete filtering
  const matchingCities = searchQuery.trim()
    ? allCities.filter(
        (c: City) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.region.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const matchingActivities = searchQuery.trim()
    ? allActivities.filter(
        (a: Activity) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAutocompleteOpen(false);
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const handleOpenCityDetails = async (city: City) => {
    setIsAutocompleteOpen(false);
    try {
      setDetailCityLoading(true);
      const detail = await api.getCityDetails(city.id);
      setDetailCity(detail);
    } catch {
      // Fallback
      setDetailCity({
        ...city,
        activities: allActivities.filter((a: Activity) => a.city_id === city.id),
      });
    } finally {
      setDetailCityLoading(false);
    }
  };

  const handleSaveToggle = async (city: City) => {
    try {
      if (savedCityIds.includes(city.id)) {
        const favs = await api.getFavorites();
        const existing = favs.find((f) => f.item_type === 'city' && f.item_id === city.id);
        if (existing) {
          await api.removeFavorite(existing.id);
          setSavedCityIds((prev) => prev.filter((id) => id !== city.id));
          showToast('info', `Removed ${city.name} from saved.`);
        }
      } else {
        await api.addFavorite('city', city.id);
        setSavedCityIds((prev) => [...prev, city.id]);
        showToast('success', `Saved ${city.name} to favorites!`);
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDuplicateTrip = async (id: number) => {
    try {
      const cloned = await api.duplicateTrip(id);
      showToast('success', `Duplicated "${cloned.title}"!`);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteTripConfirm = async () => {
    if (!deleteTripId) return;
    try {
      await api.deleteTrip(deleteTripId);
      showToast('success', 'Trip deleted.');
      setDeleteTripId(null);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const upcomingTrips = trips.filter((t) => t.status === 'upcoming' || t.status === 'ongoing');

  return (
    <div className="space-y-10">
      {/* ================= HERO SEARCH SECTION WITH AUTOCOMPLETE ================= */}
      <div className="relative rounded-card-lg overflow-visible bg-gradient-to-r from-slate-900 via-brand-700 to-teal-800 text-white p-8 sm:p-12 shadow-xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] rounded-card-lg pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold border border-white/20 text-teal-200">
            <Sparkles className="w-3.5 h-3.5" />
            Namaste, {user?.first_name || 'Traveler'}! Ready for your next journey?
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Where will you go next?
          </h1>

          {/* Quick Destination Search Form with Autocomplete Dropdown */}
          <div ref={searchContainerRef} className="relative max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl shadow-lg relative z-20">
              <div className="flex-1 flex items-center gap-3 px-3 text-ink-primary">
                <Search className="w-5 h-5 text-brand" />
                <input
                  type="text"
                  placeholder="Search Jaipur, Udaipur, Varanasi, Goa beaches, or forts..."
                  value={searchQuery}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) setIsAutocompleteOpen(true);
                  }}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsAutocompleteOpen(e.target.value.trim().length > 0);
                  }}
                  className="w-full bg-transparent text-sm focus:outline-none text-ink-primary placeholder:text-ink-muted"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsAutocompleteOpen(false);
                    }}
                    className="p-1 text-ink-muted hover:text-ink-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button type="submit" variant="primary" size="md" className="rounded-xl px-6">
                Search
              </Button>
            </form>

            {/* Live Autocomplete Suggestions Dropdown */}
            {isAutocompleteOpen && (matchingCities.length > 0 || matchingActivities.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-surface text-ink-primary rounded-2xl border border-borderLight shadow-2xl z-50 overflow-hidden divide-y divide-borderLight/70">
                {/* Matching Destinations */}
                {matchingCities.length > 0 && (
                  <div className="p-3 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted px-2 block">
                      Destinations ({matchingCities.length})
                    </span>
                    <div className="space-y-1">
                      {matchingCities.map((city: City) => (
                        <div
                          key={city.id}
                          onClick={() => handleOpenCityDetails(city)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={city.image_url}
                              alt={city.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div>
                              <p className="text-sm font-bold text-ink-primary">{city.name}</p>
                              <p className="text-xs text-ink-secondary flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-brand" />
                                {city.state} • {city.region}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center text-amber-500 text-xs font-bold gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              {(city.popularity / 20).toFixed(1)}
                            </div>
                            <span className="text-[11px] text-ink-muted font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                              {city.cost_index}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matching Activities */}
                {matchingActivities.length > 0 && (
                  <div className="p-3 space-y-1.5 bg-slate-50/50">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted px-2 block">
                      Things to Do ({matchingActivities.length})
                    </span>
                    <div className="space-y-1">
                      {matchingActivities.map((act: Activity) => (
                        <div
                          key={act.id}
                          onClick={() => {
                            setIsAutocompleteOpen(false);
                            navigate(`/explore?search=${encodeURIComponent(act.name)}`);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-white cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={act.image_url}
                              alt={act.name}
                              className="w-9 h-9 rounded-lg object-cover"
                            />
                            <div>
                              <p className="text-xs font-bold text-ink-primary">{act.name}</p>
                              <span className="text-[10px] text-teal font-semibold">{act.category}</span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-700">
                            {act.estimated_cost === 0 ? 'Free' : `₹${act.estimated_cost}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom View All Link */}
                <div
                  onClick={handleSearchSubmit}
                  className="p-3 bg-slate-100 hover:bg-slate-200/80 cursor-pointer text-center text-xs font-bold text-brand flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>View all results for "{searchQuery}"</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="accent"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => navigate('/create-trip')}
            >
              Plan a New Trip
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/explore')}
              className="bg-white/15 text-white hover:bg-white/25 border-white/30"
            >
              Explore Destinations
            </Button>
          </div>
        </div>
      </div>

      {/* ================= UPCOMING / RECENT TRIPS ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink-primary">Your Trips</h2>
            <p className="text-xs text-ink-secondary">Manage your active plans, stops, and schedules</p>
          </div>
          {trips.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/my-trips')} rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All ({trips.length})
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : upcomingTrips.length === 0 ? (
          <div className="p-8 text-center bg-surface rounded-card border border-dashed border-borderLight space-y-3">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-ink-primary">No upcoming trips planned yet</h3>
            <p className="text-xs text-ink-secondary max-w-sm mx-auto">
              Create your first multi-city adventure with day schedules and instant budget calculations.
            </p>
            <Button variant="primary" size="sm" onClick={() => navigate('/create-trip')} leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create Trip
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingTrips.slice(0, 3).map((trip: Trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onView={(id) => navigate(`/itinerary/${id}/budget`)}
                onEdit={(id) => navigate(`/builder/${id}`)}
                onShare={(id) => navigate(`/itinerary/${id}/budget`)}
                onDuplicate={handleDuplicateTrip}
                onDelete={(id) => setDeleteTripId(id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ================= SMART RECOMMENDATIONS (Rule-based with 5-Star Ratings) ================= */}
      {recommendations && recommendations.recommended_cities.length > 0 && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-ink-primary">Recommended for You</h2>
                <p className="text-xs text-ink-secondary">
                  Tailored based on your interests ({recommendations.user_interests.join(', ')})
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/explore')}>
              Explore More →
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.recommended_cities.slice(0, 3).map((rec) => (
              <CityCard
                key={rec.city.id}
                city={rec.city}
                recommendationReason={rec.reason}
                isSaved={savedCityIds.includes(rec.city.id)}
                onSaveToggle={handleSaveToggle}
                onAddToTrip={() => navigate('/create-trip')}
                onViewDetails={handleOpenCityDetails}
              />
            ))}
          </div>
        </section>
      )}

      {/* ================= POPULAR DESTINATIONS ================= */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink-primary">Popular Indian Destinations</h2>
            <p className="text-xs text-ink-secondary">Top-rated royal palaces, spiritual ghats, and coastal retreats</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/explore')}>
            All 30+ Destinations →
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularCities.map((city: City) => (
            <CityCard
              key={city.id}
              city={city}
              isSaved={savedCityIds.includes(city.id)}
              onSaveToggle={handleSaveToggle}
              onAddToTrip={() => navigate('/create-trip')}
              onViewDetails={handleOpenCityDetails}
            />
          ))}
        </div>
      </section>

      {/* ================= PERFECTLY ALIGNED RICH CITY DETAILS MODAL ================= */}
      <Modal
        isOpen={detailCity !== null}
        onClose={() => setDetailCity(null)}
        title={
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand" />
            <span>Destination Overview: {detailCity?.name}</span>
          </div>
        }
        maxWidth="lg"
      >
        {detailCity && (
          <div className="space-y-5">
            {/* High-res Cover Visual with Badges */}
            <div className="relative h-56 w-full rounded-2xl overflow-hidden bg-slate-900 shadow-md">
              <img
                src={detailCity.image_url}
                alt={detailCity.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

              {/* Top Region Badge & Favorite Action */}
              <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                <Badge variant="teal" size="sm" className="bg-white/90 text-teal-800 font-bold backdrop-blur-xs shadow-xs">
                  {detailCity.region} India
                </Badge>
                <button
                  onClick={() => handleSaveToggle(detailCity)}
                  className="p-2 rounded-full bg-white/90 text-ink-secondary hover:text-rose-600 transition-colors shadow-sm cursor-pointer"
                  title={savedCityIds.includes(detailCity.id) ? 'Remove from Saved' : 'Save to Favorites'}
                >
                  <Heart className={`w-4 h-4 ${savedCityIds.includes(detailCity.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              {/* Bottom City Name & State */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-2xl font-extrabold drop-shadow-sm">{detailCity.name}</h3>
                <p className="text-xs text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-300" />
                  {detailCity.state}, {detailCity.country}
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar: 5-Star Rating, Cost Tier, Region */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-borderLight/80 text-center">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                  Popularity Rating
                </span>
                <div className="flex items-center justify-center gap-1.5">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= Math.round(detailCity.popularity / 20)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-extrabold text-ink-primary">
                    {(detailCity.popularity / 20).toFixed(1)}/5
                  </span>
                </div>
              </div>

              <div className="space-y-1 border-x border-borderLight/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                  Cost Tier
                </span>
                <span className="inline-block text-xs font-bold text-brand">
                  {detailCity.cost_index} Budget
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                  Geographic Region
                </span>
                <span className="inline-block text-xs font-bold text-teal">
                  {detailCity.region} Zone
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                About Destination
              </h4>
              <p className="text-xs text-ink-secondary leading-relaxed bg-white p-3 rounded-xl border border-borderLight/60">
                {detailCity.description}
              </p>
            </div>

            {/* Best Suited Interests Pills */}
            {detailCity.best_suited_interests && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary block">
                  Best Suited For
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {detailCity.best_suited_interests.split(',').map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 text-brand border border-brand-200/60"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Top Curated Experiences in this City */}
            {detailCity.activities && detailCity.activities.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-borderLight">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-primary flex items-center justify-between">
                  <span>Top Experiences in {detailCity.name}</span>
                  <span className="text-[11px] font-normal text-ink-secondary">
                    {detailCity.activities.length} curated activities
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {detailCity.activities.map((act: Activity) => (
                    <div
                      key={act.id}
                      className="p-2.5 rounded-xl bg-slate-50/80 border border-borderLight hover:border-brand-300 transition-colors flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={act.image_url}
                          alt={act.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-ink-primary truncate">{act.name}</p>
                          <p className="text-[10px] text-ink-secondary flex items-center gap-1.5 mt-0.5">
                            <span className="text-teal font-semibold">{act.category}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {act.duration_hours}h
                            </span>
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 shrink-0">
                        {act.estimated_cost === 0 ? 'Free' : `₹${act.estimated_cost}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-borderLight flex items-center justify-between gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDetailCity(null)}>
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate(`/explore?city=${detailCity.id}`);
                  }}
                >
                  Explore All Experiences
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                  onClick={() => {
                    navigate('/create-trip');
                  }}
                >
                  Plan a Trip Here
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteTripId !== null}
        onClose={() => setDeleteTripId(null)}
        onConfirm={handleDeleteTripConfirm}
        title="Delete Trip"
        message="Are you sure you want to delete this trip and its itinerary? This action cannot be undone."
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
};
