import React from 'react';
import { Clock, IndianRupee, Star, Plus, Heart, Sparkles } from 'lucide-react';
import { Activity } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface ActivityCardProps {
  activity: Activity;
  isSaved?: boolean;
  onSaveToggle?: (activity: Activity) => void;
  onAddToDay?: (activity: Activity) => void;
  buttonLabel?: string;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  isSaved = false,
  onSaveToggle,
  onAddToDay,
  buttonLabel = 'Add to Day',
}) => {
  const categoryVariantMap: Record<string, 'brand' | 'teal' | 'accent' | 'success' | 'warning' | 'danger'> = {
    Sightseeing: 'brand',
    Food: 'accent',
    Culture: 'teal',
    Adventure: 'warning',
    Photography: 'brand',
    Nature: 'success',
    Shopping: 'accent',
    Entertainment: 'danger',
  };

  return (
    <Card padding="none" hoverable className="group flex flex-col h-full bg-surface border border-borderLight transition-all">
      {/* Activity Image */}
      <div className="relative h-36 w-full overflow-hidden bg-slate-100">
        <img
          src={activity.image_url}
          alt={activity.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center">
          <Badge variant={categoryVariantMap[activity.category] || 'brand'} size="sm" className="bg-white/95 backdrop-blur-xs font-semibold">
            {activity.category}
          </Badge>

          {onSaveToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSaveToggle(activity);
              }}
              className="p-1.5 rounded-full bg-white/90 backdrop-blur-xs text-ink-secondary hover:text-rose-600 transition-colors shadow-xs"
              title={isSaved ? 'Remove from Saved' : 'Save Activity'}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          )}
        </div>

        <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
          <div className="flex items-center gap-1 text-xs text-amber-300 font-semibold mb-0.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {activity.rating.toFixed(1)} ({activity.popularity_score}% match)
          </div>
          <h4 className="text-sm font-bold truncate drop-shadow-sm">{activity.name}</h4>
        </div>
      </div>

      {/* Activity Details */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-secondary font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand" />
              {activity.duration_hours}h duration
            </span>
            <span className="flex items-center gap-0.5 font-bold text-ink-primary">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              {activity.estimated_cost === 0 ? 'Free Entry' : `₹${activity.estimated_cost.toLocaleString('en-IN')}`}
            </span>
          </div>

          <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
            {activity.description}
          </p>
        </div>

        {onAddToDay && (
          <Button
            variant="teal"
            size="sm"
            className="w-full"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => onAddToDay(activity)}
          >
            {buttonLabel}
          </Button>
        )}
      </div>
    </Card>
  );
};
