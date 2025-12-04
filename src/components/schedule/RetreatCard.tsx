import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MapPin, Users, Plane } from "lucide-react";

export interface RetreatCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  duration: string;
  price: number;
  spotsLeft: number;
  capacity: number;
  teachers: { name: string; avatar?: string }[];
  tags: string[];
  onBook: (id: string) => void;
}

export function RetreatCard({
  id,
  title,
  description,
  imageUrl,
  destination,
  country,
  startDate,
  endDate,
  duration,
  price,
  spotsLeft,
  capacity,
  teachers,
  tags,
  onBook,
}: RetreatCardProps) {
  const isFull = spotsLeft === 0;

  return (
    <div className="group rounded-2xl border border-border bg-card overflow-hidden shadow-card transition-all duration-200 hover:shadow-card-hover hover:scale-[1.01]">
      {/* Image */}
      <div className="relative aspect-[2/1] overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="retreat" className="gap-1">
            <Plane className="h-3 w-3" />
            Retreat
          </Badge>
          <Badge variant="lilac">
            {duration}
          </Badge>
        </div>

        {/* Destination on image */}
        <div className="absolute bottom-3 left-3 text-white">
          <p className="text-sm font-medium opacity-80">{country}</p>
          <h3 className="text-xl font-bold">{destination}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title and tags */}
        <h4 className="text-lg font-semibold mb-2">{title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Teachers */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex -space-x-2">
            {teachers.slice(0, 3).map((teacher, i) => (
              <Avatar key={i} className="h-8 w-8 border-2 border-card">
                <AvatarImage src={teacher.avatar} alt={teacher.name} />
                <AvatarFallback className="text-xs bg-accent-peach text-foreground">
                  {teacher.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            with {teachers.map((t) => t.name).join(" & ")}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{startDate} - {endDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span className={spotsLeft <= 3 ? "text-warning font-medium" : ""}>
              {isFull ? "Sold out" : `${spotsLeft} spots left`}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Starting from</p>
            <p className="text-2xl font-bold">${price.toLocaleString()}</p>
          </div>
          <Button
            variant={isFull ? "secondary" : "soft-peach"}
            size="lg"
            onClick={() => onBook(id)}
          >
            {isFull ? "Join Waitlist" : "View Details"}
          </Button>
        </div>
      </div>
    </div>
  );
}
