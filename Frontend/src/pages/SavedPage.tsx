import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Heart, MapPin, Compass, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { FavoriteItem } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Tabs } from '../components/common/Tabs';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/Skeleton';

export const SavedPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const data = await api.getFavorites();
      setFavorites(data);
    } catch (err: any) {
      showToast('error', 'Failed to load saved items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (id: number, name: string) => {
    try {
      await api.removeFavorite(id);
      showToast('info', `Removed ${name} from saved.`);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const filteredItems = favorites.filter((f) => {
    if (activeTab === 'all') return true;
    return f.item_type === activeTab;
  });

  const tabs = [
    { id: 'all', label: 'All Saved', count: favorites.length },
    { id: 'city', label: 'Saved Cities', count: favorites.filter((f) => f.item_type === 'city').length },
    { id: 'activity', label: 'Saved Activities', count: favorites.filter((f) => f.item_type === 'activity').length },
    { id: 'trip', label: 'Saved Trips', count: favorites.filter((f) => f.item_type === 'trip').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">Saved Destinations & Experiences</h1>
        <p className="text-xs text-ink-secondary">
          Your bookmarked Indian cities, royal palaces, food walks, and community plans
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-surface p-4 rounded-card border border-borderLight shadow-xs">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-8 h-8 text-brand" />}
          title="No saved destinations yet."
          description="Explore verified Indian cities, monuments, and experiences and click the heart icon to save them for your next itinerary."
          actionText="Explore Destinations"
          actionIcon={<Compass className="w-4 h-4" />}
          onAction={() => navigate('/explore')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const details = item.item_details || {};
            const itemName = details.name || details.title || 'Saved Item';

            return (
              <Card key={item.id} padding="none" hoverable className="group flex flex-col h-full bg-surface border border-borderLight">
                <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                  <img
                    src={details.image_url || details.cover_image || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80'}
                    alt={itemName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                  <div className="absolute top-3 left-3">
                    <Badge variant="brand" size="sm" className="bg-white/90 font-bold capitalize text-ink-primary shadow-xs">
                      {item.item_type}
                    </Badge>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-base font-bold truncate drop-shadow-sm">{itemName}</h3>
                    {details.state && <p className="text-xs text-white/80">{details.state}, India</p>}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  {details.description && (
                    <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                      {details.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-borderLight flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleRemove(item.id, itemName)}
                      className="p-1.5 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove from Saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (item.item_type === 'city') navigate(`/explore?city=${item.item_id}`);
                        else if (item.item_type === 'trip') navigate(`/itinerary/${item.item_id}/budget`);
                        else navigate('/create-trip');
                      }}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
