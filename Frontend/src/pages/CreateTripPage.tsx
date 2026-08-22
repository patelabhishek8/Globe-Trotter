import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Calendar,
  IndianRupee,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Upload,
  Search,
  Check,
  Star,
  X,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { City, Activity } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { addDays, format } from 'date-fns';

export const CreateTripPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const citySearchRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const defaultStart = format(addDays(today, 7), 'yyyy-MM-dd');
  const defaultEnd = format(addDays(today, 14), 'yyyy-MM-dd');

  const [cities, setCities] = useState<City[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    start_date: defaultStart,
    end_date: defaultEnd,
    overall_budget: 30000,
    travel_style: 'Standard',
    description: '',
    cover_image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
  });

  const [cityCovers, setCityCovers] = useState<{ name: string; url: string }[]>([]);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [uploadedCoverPreview, setUploadedCoverPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load all cities and activities on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [citiesData, actsData] = await Promise.all([
          api.getCities({ sort_by: 'popularity', order: 'desc' }),
          api.getActivities().catch(() => []),
        ]);
        setCities(citiesData);
        setActivities(actsData);

        // Default to Jaipur if available
        if (citiesData.length > 0) {
          const defaultCity = citiesData[0];
          handleSelectCity(defaultCity, false, citiesData, actsData);
        }
      } catch (err: any) {
        console.error('Failed to load cities:', err);
      }
    }
    loadData();
  }, []);

  // Handle outside click for city autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (citySearchRef.current && !citySearchRef.current.contains(e.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter cities for autocomplete
  const matchingCities = citySearchQuery.trim()
    ? cities.filter(
        (c) =>
          c.name.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          c.state.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          c.region.toLowerCase().includes(citySearchQuery.toLowerCase())
      )
    : cities;

  const handleSelectCity = (
    city: City,
    autoSetTitle = true,
    citiesList = cities,
    actsList = activities
  ) => {
    setSelectedCity(city);
    setCitySearchQuery(city.name);
    setIsCityDropdownOpen(false);

    if (autoSetTitle || !formData.title.trim()) {
      setFormData((prev) => ({
        ...prev,
        title: `${city.name} Explorer`,
        cover_image: city.image_url,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        cover_image: city.image_url,
      }));
    }

    // Generate city-specific cover image options
    const cityActs = actsList.filter((a) => a.city_id === city.id);
    const covers: { name: string; url: string }[] = [
      { name: `${city.name} Landmark`, url: city.image_url },
    ];

    cityActs.forEach((act) => {
      if (act.image_url && !covers.some((c) => c.url === act.image_url)) {
        covers.push({ name: act.name, url: act.image_url });
      }
    });

    setCityCovers(covers);
    setUploadedCoverPreview('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Image size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadedCoverPreview(result);
      setFormData((prev) => ({ ...prev, cover_image: result }));
      showToast('success', 'Custom cover image uploaded!');
    };
    reader.readAsDataURL(file);
  };

  const travelStyles = [
    { id: 'Budget', label: 'Budget', desc: 'Hostels, local transit & street treats' },
    { id: 'Standard', label: 'Standard', desc: 'Comfortable hotels, trains & guided walks' },
    { id: 'Premium', label: 'Premium', desc: '4-star resorts, private cars & flights' },
    { id: 'Luxury', label: 'Luxury', desc: '5-star heritage palaces & bespoke tours' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please provide a trip name.');
      return;
    }
    if (!selectedCity) {
      setError('Please select a destination city for this trip.');
      return;
    }
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setError('End date cannot be earlier than start date.');
      return;
    }
    if (formData.overall_budget < 0) {
      setError('Budget cannot be negative.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const finalCover = uploadedCoverPreview || formData.cover_image;

      // 1. Create Trip
      const createdTrip = await api.createTrip({
        ...formData,
        cover_image: finalCover,
      });

      // 2. Automatically add the selected city as the initial TripStop
      try {
        await api.addStop(createdTrip.id, {
          city_id: selectedCity.id,
          arrival_date: formData.start_date,
          departure_date: formData.end_date,
          travel_mode: 'Train',
          travel_cost: 0,
          notes: `Exploring ${selectedCity.name}, ${selectedCity.state}`,
        });
      } catch (err) {
        console.warn('Initial stop creation fallback:', err);
      }

      showToast('success', `Trip "${createdTrip.title}" created with ${selectedCity.name}!`);
      navigate(`/builder/${createdTrip.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create trip.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-ink-secondary hover:text-ink-primary hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-ink-primary">Plan a New Trip</h1>
            <p className="text-xs text-ink-secondary">
              Choose your destination city, dates, budget, and travel style
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card padding="lg" className="space-y-6">
          {/* Trip Name & Overall Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="sm:col-span-2">
              <Input
                label="Trip Name *"
                placeholder="e.g. Jaipur Heritage Expedition"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Input
                label="Overall Budget (INR ₹) *"
                type="number"
                min="0"
                step="500"
                placeholder="30000"
                value={formData.overall_budget}
                onChange={(e) => setFormData({ ...formData, overall_budget: Number(e.target.value) })}
                leftIcon={<IndianRupee className="w-4 h-4" />}
                required
              />
            </div>
          </div>

          {/* ================= SELECT CITY (AUTOCOMPLETE DROPDOWN) ================= */}
          <div ref={citySearchRef} className="relative space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary">
              Select Destination City * (Type to search Indian destinations)
            </label>
            <div className="relative">
              <div className="flex items-center relative">
                <input
                  type="text"
                  placeholder="Type city name (e.g. Jaipur, Goa, Udaipur, Varanasi, Srinagar...)"
                  value={citySearchQuery}
                  onFocus={() => setIsCityDropdownOpen(true)}
                  onChange={(e) => {
                    setCitySearchQuery(e.target.value);
                    setIsCityDropdownOpen(true);
                  }}
                  className="w-full rounded-lg border border-borderLight bg-surface px-3 py-2.5 pl-10 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
                <MapPin className="w-4 h-4 text-brand absolute left-3 pointer-events-none" />
                {citySearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setCitySearchQuery('');
                      setIsCityDropdownOpen(true);
                    }}
                    className="p-1 text-ink-muted hover:text-ink-primary absolute right-3"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Selected City Confirmation Badge */}
              {selectedCity && (
                <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedCity.image_url}
                      alt={selectedCity.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div>
                      <span className="font-bold text-ink-primary">{selectedCity.name}</span>
                      <span className="text-teal-700 ml-1.5 font-medium">({selectedCity.state} • {selectedCity.region} India)</span>
                    </div>
                  </div>
                  <Badge variant="teal" size="sm">Active Destination</Badge>
                </div>
              )}

              {/* Autocomplete Dropdown List */}
              {isCityDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-surface rounded-xl border border-borderLight shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-borderLight/60">
                  {matchingCities.length === 0 ? (
                    <div className="p-4 text-xs text-ink-muted text-center">
                      No matching Indian cities found for "{citySearchQuery}".
                    </div>
                  ) : (
                    matchingCities.map((city) => {
                      const isSelected = selectedCity?.id === city.id;
                      return (
                        <div
                          key={city.id}
                          onClick={() => handleSelectCity(city, true)}
                          className={`p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-brand-50/70 font-bold' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={city.image_url}
                              alt={city.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div>
                              <p className="text-sm font-bold text-ink-primary">{city.name}</p>
                              <p className="text-xs text-ink-secondary">{city.state} • {city.region} India</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {(city.popularity / 20).toFixed(1)}
                            </span>
                            <span className="text-[10px] text-ink-muted bg-slate-100 px-2 py-0.5 rounded-md">
                              {city.cost_index}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-brand" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Travel Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Start Date *"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              leftIcon={<Calendar className="w-4 h-4" />}
              required
            />
            <Input
              label="End Date *"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              leftIcon={<Calendar className="w-4 h-4" />}
              required
            />
          </div>

          {/* Travel Style Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary">
              Select Travel Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {travelStyles.map((style) => {
                const isSelected = formData.travel_style === style.id;
                return (
                  <div
                    key={style.id}
                    onClick={() => setFormData({ ...formData, travel_style: style.id })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand bg-brand-50/70 shadow-xs ring-1 ring-brand'
                        : 'border-borderLight bg-surface hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold ${isSelected ? 'text-brand' : 'text-ink-primary'}`}>
                        {style.label}
                      </span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-brand" />}
                    </div>
                    <p className="text-[11px] text-ink-secondary leading-snug">{style.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trip Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1.5">
              Trip Description & Goals
            </label>
            <textarea
              rows={3}
              placeholder="What are the goals for this trip? (e.g. Exploring desert forts, taking sunrise photography at Taj, trying local street food...)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-borderLight bg-surface p-3 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* ================= CITY-SPECIFIC COVER IMAGES & UPLOAD OPTION ================= */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                Cover Photo (Specific to {selectedCity?.name || 'Selected City'})
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Upload className="w-3.5 h-3.5 text-brand" />}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Cover Image
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Uploaded Image Preview if custom */}
            {uploadedCoverPreview && (
              <div className="p-3 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={uploadedCoverPreview}
                    alt="Custom Cover"
                    className="w-16 h-12 rounded-lg object-cover border border-brand-300"
                  />
                  <div>
                    <p className="text-xs font-bold text-ink-primary">Custom Cover Image Selected</p>
                    <span className="text-[11px] text-teal">Uploaded from device</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadedCoverPreview('');
                    if (selectedCity) {
                      setFormData((prev) => ({ ...prev, cover_image: selectedCity.image_url }));
                    }
                  }}
                >
                  Reset to City Photo
                </Button>
              </div>
            )}

            {/* City-Specific Curated Photos */}
            {cityCovers.length > 0 && !uploadedCoverPreview && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {cityCovers.map((cov, idx) => {
                  const isSelected = formData.cover_image === cov.url && !uploadedCoverPreview;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setFormData({ ...formData, cover_image: cov.url });
                        setUploadedCoverPreview('');
                      }}
                      className={`group relative rounded-xl overflow-hidden h-28 border cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-3 ring-brand border-transparent shadow-md'
                          : 'border-borderLight hover:opacity-90'
                      }`}
                    >
                      <img src={cov.url} alt={cov.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-2.5">
                        <span className="text-xs font-bold text-white truncate drop-shadow-xs">{cov.name}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-borderLight flex items-center justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Itinerary Builder
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
