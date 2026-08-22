import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search, MapPin, Compass, ArrowRight } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { Trip } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Tabs } from '../components/common/Tabs';
import { TripCard } from '../components/cards/TripCard';
import { CardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const MyTripsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTripId, setDeleteTripId] = useState<number | null>(null);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const data = await api.getTrips({ status: activeTab, search });
      setTrips(data);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to fetch trips.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [activeTab, search]);

  const handleDuplicate = async (id: number) => {
    try {
      const cloned = await api.duplicateTrip(id);
      showToast('success', `Duplicated "${cloned.title}"!`);
      fetchTrips();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTripId) return;
    try {
      await api.deleteTrip(deleteTripId);
      showToast('success', 'Trip deleted.');
      setDeleteTripId(null);
      fetchTrips();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Trips' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">My Trips</h1>
          <p className="text-xs text-ink-secondary">View and manage all your multi-city travel itineraries</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => navigate('/create-trip')}
        >
          Plan New Trip
        </Button>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-card border border-borderLight shadow-xs">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by trip name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Trips Grid / Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-8 h-8 text-brand" />}
          title="No trips yet."
          description="Start planning your next adventure with multi-city routing and live budget calculations."
          actionText="Plan New Trip"
          actionIcon={<PlusCircle className="w-4 h-4" />}
          onAction={() => navigate('/create-trip')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onView={(id) => navigate(`/itinerary/${id}/budget`)}
              onEdit={(id) => navigate(`/builder/${id}`)}
              onShare={(id) => navigate(`/itinerary/${id}/budget`)}
              onDuplicate={handleDuplicate}
              onDelete={(id) => setDeleteTripId(id)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteTripId !== null}
        onClose={() => setDeleteTripId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Trip"
        message="Are you sure you want to delete this trip? All stops and scheduled activities will be permanently deleted."
        confirmText="Delete Trip"
        isDestructive
      />
    </div>
  );
};
