import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Search,
  Copy,
  Heart,
  Share2,
  Calendar,
  MapPin,
  IndianRupee,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CommunityTrip } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { CardSkeleton } from '../components/common/Skeleton';
import { format, parseISO } from 'date-fns';

export const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [communityTrips, setCommunityTrips] = useState<CommunityTrip[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [loading, setLoading] = useState(true);
  const [savedTripTokens, setSavedTripTokens] = useState<string[]>([]);

  const fetchCommunity = async () => {
    try {
      setLoading(true);
      const data = await api.getCommunityTrips({ search, sort_by: sortBy });
      setCommunityTrips(data);
    } catch (err: any) {
      showToast('error', 'Failed to load community feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunity();
  }, [search, sortBy]);

  const handleCopyTrip = async (token: string, title: string) => {
    if (!user) {
      showToast('info', 'Please sign in to copy this itinerary to your account.');
      navigate('/login');
      return;
    }
    try {
      const cloned = await api.copySharedTrip(token);
      showToast('success', `Copied "${title}" to your trips!`);
      navigate(`/builder/${cloned.id}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to copy trip.');
    }
  };

  const handleShareLink = (token: string) => {
    const url = `${window.location.origin}/shared-trip/${token}`;
    navigator.clipboard.writeText(url);
    showToast('success', 'Public share link copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold mb-2">
          <Globe className="w-3.5 h-3.5" />
          GlobeTrotter Community Hub
        </div>
        <h1 className="text-2xl font-bold text-ink-primary">Discover Public Travel Itineraries</h1>
        <p className="text-xs text-ink-secondary">
          Explore real traveler itineraries across India, get inspired, and clone plans into your own account
        </p>
      </div>

      {/* Search & Sort Bar */}
      <div className="p-4 rounded-card bg-surface border border-borderLight shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search Rajasthan, Golden Triangle, beaches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'latest', label: 'Latest Shared' },
              { value: 'popular', label: 'Most Stops / Popular' },
              { value: 'budget', label: 'Budget Friendly' },
            ]}
          />
        </div>
      </div>

      {/* Community Trips Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : communityTrips.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-card border border-dashed border-borderLight text-xs text-ink-secondary space-y-2">
          <Globe className="w-8 h-8 text-ink-muted mx-auto" />
          <p className="font-bold text-sm text-ink-primary">No public community trips found</p>
          <p>Be the first to share your trip with the community by toggling "Share Trip" in the builder!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {communityTrips.map((trip) => (
            <Card key={trip.id} padding="none" hoverable className="group flex flex-col h-full bg-surface border border-borderLight transition-all">
              {/* Cover Photo & Traveler Badge */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src={trip.cover_image || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80'}
                  alt={trip.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Top Author Tag */}
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-semibold text-ink-primary shadow-xs">
                  <div className="w-4 h-4 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center">
                    {trip.author_name[0]}
                  </div>
                  <span>{trip.author_name}</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <Badge variant="teal" size="sm" className="bg-teal-500/90 text-white font-semibold mb-1">
                    {trip.travel_style}
                  </Badge>
                  <h3 className="text-base font-bold truncate drop-shadow-sm">{trip.title}</h3>
                </div>
              </div>

              {/* Body Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs font-bold text-teal">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{trip.route_display}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-ink-secondary">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand" />
                      {trip.duration_days} Days ({trip.cities_count} Cities)
                    </span>
                    <span className="font-bold text-ink-primary flex items-center">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                      ₹{Number(trip.overall_budget).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {trip.description && (
                    <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                      {trip.description}
                    </p>
                  )}
                </div>

                {/* Actions: View Details, Share, Copy Trip */}
                <div className="pt-3 border-t border-borderLight flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleShareLink(trip.share_token)}
                    className="p-2 rounded-lg text-ink-secondary hover:text-teal hover:bg-teal-50 transition-colors"
                    title="Copy Share Link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/shared-trip/${trip.share_token}`)}
                    >
                      View
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Copy className="w-3.5 h-3.5" />}
                      onClick={() => handleCopyTrip(trip.share_token, trip.title)}
                    >
                      Copy Plan
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
