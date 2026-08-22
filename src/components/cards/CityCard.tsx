import React from 'react';
import { Heart, Plus, MapPin, Star, Compass } from 'lucide-react';
import { City } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface CityCardProps {
  city: City;
  isSaved?: boolean;
  onSaveToggle?: (city: City) => void;
  onAddToTrip?: (city: City) => void;
  onViewDetails?: (city: City) => void;
  recommendationReason?: string;
}

export const CityCard: React.FC<CityCardProps> = ({
  city,
  isSaved = false,
  onSaveToggle,
  onAddToTrip,
  onViewDetails,
  recommendationReason,
}) => {
  const costColorMap: Record<string, 'success' | 'brand' | 'warning'> = {
    Budget: 'success',
    Moderate: 'brand',
    Luxury: 'warning',
  };

  return (
    <Card padding="none" hoverable className="group flex flex-col h-full bg-surface border border-borderLight transition-all">
      {/* City Thumbnail & Badges */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={city.image_url}
          alt={city.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* Top Header Controls */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
          <Badge variant="teal" size="sm" className="bg-white/90 text-teal-800 backdrop-blur-xs font-semibold">
            {city.region} India
          </Badge>

          {onSaveToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSaveToggle(city);
              }}
              className="p-1.5 rounded-full bg-white/90 backdrop-blur-xs text-ink-secondary hover:text-rose-600 transition-colors shadow-xs"
              title={isSaved ? 'Remove from Saved' : 'Save to Favorites'}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          )}
        </div>

        {/* City & State bottom overlay */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="text-lg font-bold drop-shadow-sm">{city.name}</h3>
          <p className="text-xs text-white/90 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-brand-300" />
            {city.state}, {city.country}
          </p>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <Badge variant={costColorMap[city.cost_index] || 'brand'} size="sm">
              {city.cost_index} Cost
            </Badge>
            <div className="flex items-center gap-1.5 font-semibold">
              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= Math.round(city.popularity / 20)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-ink-primary">
                {(city.popularity / 20).toFixed(1)}
                <span className="text-[10px] text-ink-muted font-normal">/5</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
            {city.description}
          </p>

          {recommendationReason && (
            <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/50 flex items-start gap-1.5 text-xs text-amber-900 font-medium">
              <Compass className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{recommendationReason}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          {onViewDetails && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => onViewDetails(city)}
            >
              Details
            </Button>
          )}
          {onAddToTrip && (
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => onAddToTrip(city)}
            >
              Add Stop
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
