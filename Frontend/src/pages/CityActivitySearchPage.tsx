import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  MapPin,
  Compass,
  Sparkles,
  Heart,
  Plus,
  Star,
  ArrowRight,
  X,
  Clock,
  IndianRupee,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { Activity, City, Trip, CityWithActivities } from '../types';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { CityCard } from '../components/cards/CityCard';
import { ActivityCard } from '../components/cards/ActivityCard';
import { CardSkeleton } from '../components/common/Skeleton';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const CityActivitySearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const initialSearch = searchParams.get('search') || '';
  const initialCityParam = searchParams.get('city');

  const [activeTab, setActiveTab] = useState<'cities' | 'activities'>('cities');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedCost, setSelectedCost] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCityId, setSelectedCityId] = useState<number | 'All'>(
    initialCityParam ? Number(initialCityParam) : 'All'
  );
  const [sortBy, setSortBy] = useState('popularity');

  const [cities, setCities] = useState<City[]>([]);
  const [allCitiesList, setAllCitiesList] = useState<City[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [savedCityIds, setSavedCityIds] = useState<number[]>([]);
  const [savedActivityIds, setSavedActivityIds] = useState<number[]>([]);
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected city details modal
  const [detailCity, setDetailCity] = useState<CityWithActivities | null>(null);

  // Add to trip modal
  const [selectedCityForTrip, setSelectedCityForTrip] = useState<City | null>(null);
  const [targetTripId, setTargetTripId] = useState<number>(0);

  // Load master cities list
  useEffect(() => {
    async function loadMasterCities() {
      try {
        const fullCities = await api.getCities({ sort_by: 'popularity', order: 'desc' });
        setAllCitiesList(fullCities);
      } catch (err) {
        console.error('Failed to load master cities:', err);
      }
    }
    loadMasterCities();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [citiesData, actsData, favsData, tripsData] = await Promise.all([
        api.getCities({
          search: searchQuery,
          region: selectedRegion,
          cost_index: selectedCost,
          sort_by: sortBy,
        }),
        api.getActivities({
          search: searchQuery,
          city_id: selectedCityId !== 'All' ? Number(selectedCityId) : undefined,
          category: selectedCategory,
          sort_by: sortBy,
        }),
        api.getFavorites().catch(() => []),
        api.getTrips().catch(() => []),
      ]);

      setCities(citiesData);
      setActivities(actsData);
      setUserTrips(tripsData);
      if (tripsData.length > 0 && targetTripId === 0) {
        setTargetTripId(tripsData[0].id);
      }

      setSavedCityIds(favsData.filter((f) => f.item_type === 'city').map((f) => f.item_id));
      setSavedActivityIds(favsData.filter((f) => f.item_type === 'activity').map((f) => f.item_id));

      if (initialCityParam && !detailCity) {
        const cityId = Number(initialCityParam);
        const detail = await api.getCityDetails(cityId);
        setDetailCity(detail);
      }
    } catch (err: any) {
      showToast('error', 'Failed to fetch destinations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, selectedRegion, selectedCost, selectedCategory, selectedCityId, sortBy]);

  const handleCitySaveToggle = async (city: City) => {
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

  const handleActivitySaveToggle = async (act: Activity) => {
    try {
      if (savedActivityIds.includes(act.id)) {
        const favs = await api.getFavorites();
        const existing = favs.find((f) => f.item_type === 'activity' && f.item_id === act.id);
        if (existing) {
          await api.removeFavorite(existing.id);
          setSavedActivityIds((prev) => prev.filter((id) => id !== act.id));
          showToast('info', `Removed ${act.name} from saved.`);
        }
      } else {
        await api.addFavorite('activity', act.id);
        setSavedActivityIds((prev) => [...prev, act.id]);
        showToast('success', `Saved ${act.name}!`);
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleOpenCityDetails = async (city: City) => {
    try {
      const details = await api.getCityDetails(city.id);
      setDetailCity(details);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleExploreCityActivities = (city: City) => {
    setSelectedCityId(city.id);
    setActiveTab('activities');
    setSearchParams({ city: city.id.toString() });
  };

  const handleAddStopToTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCityForTrip || !targetTripId) return;

    try {
      const chosenTrip = userTrips.find((t) => t.id === targetTripId);
      const arrDate = chosenTrip?.start_date || '2026-09-01';
      const depDate = chosenTrip?.end_date || '2026-09-03';

      await api.addStop(targetTripId, {
        city_id: selectedCityForTrip.id,
        arrival_date: arrDate,
        departure_date: depDate,
        travel_mode: 'Train',
        travel_cost: 600,
      });

      showToast('success', `Added ${selectedCityForTrip.name} to "${chosenTrip?.title}"!`);
      setSelectedCityForTrip(null);
      navigate(`/builder/${targetTripId}`);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Find currently active city if filtered
  const activeSelectedCity = selectedCityId !== 'All'
    ? allCitiesList.find((c) => c.id === Number(selectedCityId))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">Explore Destinations & Experiences</h1>
        <p className="text-xs text-ink-secondary">
          Discover verified Indian cities, royal palaces, food walks, and coastal getaways
        </p>
      </div>

      {/* Main Search & Filters Card */}
      <div className="p-4 sm:p-6 rounded-card bg-surface border border-borderLight shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Input
            placeholder="Search by city, monument, street food, beach, state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-brand" />}
            rightIcon={
              searchQuery ? (
                <button onClick={() => setSearchQuery('')} className="hover:text-ink-primary">
                  <X className="w-4 h-4" />
                </button>
              ) : undefined
            }
          />
        </div>

        {/* Tab Switch & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-borderLight">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('cities')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'cities'
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-slate-100 text-ink-secondary hover:bg-slate-200'
              }`}
            >
              Cities ({cities.length})
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'activities'
                  ? 'bg-teal text-white shadow-xs'
                  : 'bg-slate-100 text-ink-secondary hover:bg-slate-200'
              }`}
            >
              Activities ({activities.length})
            </button>
          </div>

          {/* Filters Grid */}
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'cities' ? (
              <>
                <div className="w-36">
                  <Select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    options={[
                      { value: 'All', label: 'All Regions' },
                      { value: 'North', label: 'North India' },
                      { value: 'West', label: 'West India' },
                      { value: 'South', label: 'South India' },
                      { value: 'East', label: 'East India' },
                      { value: 'Central', label: 'Central India' },
                    ]}
                  />
                </div>
                <div className="w-32">
                  <Select
                    value={selectedCost}
                    onChange={(e) => setSelectedCost(e.target.value)}
                    options={[
                      { value: 'All', label: 'All Budgets' },
                      { value: 'Budget', label: 'Budget (₹)' },
                      { value: 'Moderate', label: 'Moderate (₹₹)' },
                      { value: 'Luxury', label: 'Luxury (₹₹₹)' },
                    ]}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Specific City Filter for Activities */}
                <div className="w-44">
                  <Select
                    value={selectedCityId.toString()}
                    onChange={(e) => setSelectedCityId(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                    options={[
                      { value: 'All', label: 'All Indian Cities' },
                      ...allCitiesList.map((c) => ({
                        value: c.id.toString(),
                        label: `${c.name} (${c.state})`,
                      })),
                    ]}
                  />
                </div>

                <div className="w-36">
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    options={[
                      { value: 'All', label: 'All Categories' },
                      { value: 'Sightseeing', label: 'Sightseeing' },
                      { value: 'Food', label: 'Food & Culinary' },
                      { value: 'Culture', label: 'Heritage & Culture' },
                      { value: 'Adventure', label: 'Adventure' },
                      { value: 'Photography', label: 'Photography' },
                      { value: 'Nature', label: 'Nature & Parks' },
                    ]}
                  />
                </div>
              </>
            )}

            <div className="w-36">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'popularity', label: 'Sort: Popularity' },
                  { value: 'cost', label: 'Sort: Cost' },
                  { value: 'rating', label: 'Sort: Rating' },
                  { value: 'name', label: 'Sort: Name' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Active City Filter Info Bar when browsing activities */}
        {activeTab === 'activities' && activeSelectedCity && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 text-xs">
            <div className="flex items-center gap-2.5">
              <img
                src={activeSelectedCity.image_url}
                alt={activeSelectedCity.name}
                className="w-9 h-9 rounded-lg object-cover"
              />
              <div>
                <span className="font-bold text-ink-primary">
                  Showing all activities in {activeSelectedCity.name}, {activeSelectedCity.state}
                </span>
                <p className="text-[11px] text-teal-800">
                  {activities.length} curated authentic experiences available
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCityId('All');
                setSearchParams({});
              }}
            >
              Show All Cities
            </Button>
          </div>
        )}
      </div>

      {/* ================= RESULTS GRID ================= */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : activeTab === 'cities' ? (
        cities.length === 0 ? (
          <div className="p-12 text-center bg-surface rounded-card border border-borderLight text-xs text-ink-secondary">
            No Indian destinations matched your search filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cities.map((city) => (
              <div key={city.id} className="flex flex-col h-full">
                <CityCard
                  city={city}
                  isSaved={savedCityIds.includes(city.id)}
                  onSaveToggle={handleCitySaveToggle}
                  onAddToTrip={(c) => setSelectedCityForTrip(c)}
                  onViewDetails={handleOpenCityDetails}
                />
              </div>
            ))}
          </div>
        )
      ) : activities.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-card border border-borderLight text-xs text-ink-secondary space-y-2">
          <p>No activities found for this city and category filter.</p>
          {selectedCityId !== 'All' && (
            <Button variant="secondary" size="sm" onClick={() => setSelectedCityId('All')}>
              View Activities Across All Cities
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((act) => (
            <ActivityCard
              key={act.id}
              activity={act}
              isSaved={savedActivityIds.includes(act.id)}
              onSaveToggle={handleActivitySaveToggle}
              onAddToDay={() => navigate('/my-trips')}
            />
          ))}
        </div>
      )}

      {/* ================= RICH CITY DETAILS MODAL ================= */}
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
            {/* Cover Visual */}
            <div className="relative h-56 w-full rounded-2xl overflow-hidden bg-slate-900 shadow-md">
              <img
                src={detailCity.image_url}
                alt={detailCity.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

              <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                <Badge variant="teal" size="sm" className="bg-white/90 text-teal-800 font-bold backdrop-blur-xs shadow-xs">
                  {detailCity.region} India
                </Badge>
                <button
                  onClick={() => handleCitySaveToggle(detailCity)}
                  className="p-2 rounded-full bg-white/90 text-ink-secondary hover:text-rose-600 transition-colors shadow-sm cursor-pointer"
                  title={savedCityIds.includes(detailCity.id) ? 'Remove from Saved' : 'Save to Favorites'}
                >
                  <Heart className={`w-4 h-4 ${savedCityIds.includes(detailCity.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-2xl font-extrabold drop-shadow-sm">{detailCity.name}</h3>
                <p className="text-xs text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-300" />
                  {detailCity.state}, {detailCity.country}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
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

            {/* Top Curated Experiences */}
            {detailCity.activities && detailCity.activities.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-borderLight">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-primary">
                    Top Experiences in {detailCity.name} ({detailCity.activities.length})
                  </h4>
                  <button
                    onClick={() => {
                      const c = detailCity;
                      setDetailCity(null);
                      handleExploreCityActivities(c);
                    }}
                    className="text-xs font-bold text-teal hover:underline flex items-center gap-1"
                  >
                    <span>View All {detailCity.name} Activities</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {detailCity.activities.map((act) => (
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
                    const cityToAdd = detailCity;
                    setDetailCity(null);
                    handleExploreCityActivities(cityToAdd);
                  }}
                >
                  View City Activities Tab
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const cityToAdd = detailCity;
                    setDetailCity(null);
                    setSelectedCityForTrip(cityToAdd);
                  }}
                >
                  Add {detailCity.name} to Trip
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= ADD CITY TO TRIP MODAL ================= */}
      <Modal
        isOpen={selectedCityForTrip !== null}
        onClose={() => setSelectedCityForTrip(null)}
        title={`Add ${selectedCityForTrip?.name} to Trip`}
        maxWidth="sm"
      >
        {userTrips.length === 0 ? (
          <div className="space-y-4 text-center py-2">
            <p className="text-xs text-ink-secondary">
              You haven't created a trip yet. Create a trip to add {selectedCityForTrip?.name} to your route.
            </p>
            <Button variant="primary" size="sm" onClick={() => navigate('/create-trip')}>
              Create a Trip First
            </Button>
          </div>
        ) : (
          <form onSubmit={handleAddStopToTripSubmit} className="space-y-4">
            <Select
              label="Select Target Trip *"
              value={targetTripId}
              onChange={(e) => setTargetTripId(Number(e.target.value))}
              options={userTrips.map((t) => ({ value: t.id, label: `${t.title} (${t.duration_days} Days)` }))}
              required
            />
            <p className="text-xs text-ink-secondary">
              This will append <strong className="text-ink-primary font-bold">{selectedCityForTrip?.name}</strong> to the itinerary route.
            </p>
            <div className="pt-2 border-t border-borderLight flex justify-end gap-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setSelectedCityForTrip(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Add to Trip Itinerary
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
