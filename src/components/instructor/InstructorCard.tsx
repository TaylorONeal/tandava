import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

export interface InstructorCardProps {
  id: string;
  name: string;
  avatar?: string;
  bio: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  classCount: number;
  studios: string[];
}

export function InstructorCard({
  id,
  name,
  avatar,
  bio,
  specialties,
  rating,
  reviewCount,
  classCount,
  studios,
}: InstructorCardProps) {
  return (
    <Link
      to={`/instructors/${id}`}
      className="group block rounded-xl border bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover"
    >
      <div className="flex gap-4">
        <Avatar className="h-16 w-16 flex-shrink-0">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="text-lg bg-primary text-primary-foreground">
            {name.split(" ").map((n) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold group-hover:text-primary transition-colors">
              {name}
            </h3>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-medium">{rating}</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{bio}</p>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {specialties.slice(0, 3).map((specialty) => (
              <Badge key={specialty} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{classCount} classes taught</span>
            <span>•</span>
            <span>{studios.length} studio{studios.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
