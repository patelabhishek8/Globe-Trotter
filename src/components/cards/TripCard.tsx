import React from 'react';
import { Calendar, MapPin, IndianRupee, Share2, Copy, Trash2, Edit3, ArrowRight } from 'lucide-react';
import { Trip } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { format, parseISO } from 'date-fns';

interface TripCardProps {
  trip: Trip;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onShare: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onView,
  onEdit,
  onShare,
  onDuplicate,
  onDelete,
}) => {
  const formattedDates = `${format(parseISO(trip.start_date), 'dd MMM')} – ${format(parseISO(trip.end_date), 'dd MMM yyyy')}`;

  const statusVariantMap = {
    upcoming: 'brand',
    ongoing: 'teal',
    completed: 'neutral',
  } as const;

  return (
    <Card padding="none" hoverable className="group flex flex-col h-full bg-surface border border-borderLight transition-all">
      {/* Cover Image & Status Header */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={trip.cover_image || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80'}
          alt={trip.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        
        {/* Badges on top of cover */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant={statusVariantMap[trip.status] || 'brand'} size="sm" className="bg-white/90 backdrop-blur-xs font-semibold capitalize text-ink-primary shadow-xs">
            {trip.status}
          </Badge>
          {trip.is_public && (
            <Badge variant="teal" size="sm" className="bg-teal-500/90 text-white backdrop-blur-xs shadow-xs">
              Public
            </Badge>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="text-lg font-bold truncate drop-shadow-sm">{trip.title}</h3>
          <p className="text-xs text-white/90 flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDates} ({trip.duration_days || 1} Days)
          </p>
        </div>
      </div>

      {/* Body details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-secondary">
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-brand" />
              {trip.stops_count || 0} Cities on Route
            </span>
            <span className="flex items-center gap-0.5 font-bold text-ink-primary">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              {Number(trip.overall_budget || 30000).toLocaleString('en-IN')} Budget
            </span>
          </div>

          {trip.description && (
            <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
              {trip.description}
            </p>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="pt-3 border-t border-borderLight/80 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(trip.id); }}
              title="Edit Itinerary"
              className="p-1.5 rounded-lg text-ink-secondary hover:text-brand hover:bg-brand-50 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onShare(trip.id); }}
              title="Share Trip"
              className="p-1.5 rounded-lg text-ink-secondary hover:text-teal hover:bg-teal-50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(trip.id); }}
              title="Duplicate Trip"
              className="p-1.5 rounded-lg text-ink-secondary hover:text-amber-600 hover:bg-amber-50 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(trip.id); }}
              title="Delete Trip"
              className="p-1.5 rounded-lg text-ink-secondary hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => onView(trip.id)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Open Plan
          </Button>
        </div>
      </div>
    </Card>
  );
};
