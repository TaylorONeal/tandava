import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Users, Calendar } from "lucide-react";

export interface StudioCardProps {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  location: {
    neighborhood: string;
    city: string;
  };
  rating: number;
  reviewCount: number;
  styles: string[];
  classesToday: number;
  isFavorite?: boolean;
}

export function StudioCard({
  id,
  name,
  description,
  imageUrl,
  location,
  rating,
  reviewCount,
  styles,
  classesToday,
}: StudioCardProps) {
  return (
    <Link
      to={`/studios/${id}`}
      className="group block rounded-xl border bg-card overflow-hidden shadow-card transition-all duration-200 hover:shadow-card-hover"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {styles.slice(0, 2).map((style) => (
            <Badge key={style} variant="secondary" className="bg-background/90 backdrop-blur-sm">
              {style}
            </Badge>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-medium">{rating}</span>
            <span className="text-muted-foreground">({reviewCount})</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{location.neighborhood}, {location.city}</span>
          </div>
          <div className="flex items-center gap-1 text-primary font-medium">
            <Calendar className="h-4 w-4" />
            <span>{classesToday} classes today</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
