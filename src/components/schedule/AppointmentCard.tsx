import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin } from "lucide-react";

export interface AppointmentCardProps {
  id: string;
  type: string;
  description: string;
  teacher: {
    name: string;
    avatar?: string;
  };
  startTime: string;
  duration: number;
  location: string;
  price: number;
  isBooked: boolean;
  onBook: (id: string) => void;
}

export function AppointmentCard({
  id,
  type,
  description,
  teacher,
  startTime,
  duration,
  location,
  price,
  isBooked,
  onBook,
}: AppointmentCardProps) {
  return (
    <div className="group flex rounded-2xl border border-border bg-card overflow-hidden shadow-card transition-all duration-200 hover:shadow-card-hover hover:scale-[1.01]">
      {/* Left color bar - Mint for appointments */}
      <div className="w-1.5 bg-accent-mint flex-shrink-0" />
      
      <div className="flex-1 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="appointment">Appointment</Badge>
            </div>

            {/* Type and description */}
            <h3 className="text-lg font-semibold text-foreground mb-1">{type}</h3>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>

            {/* Teacher */}
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={teacher.avatar} alt={teacher.name} />
                <AvatarFallback className="text-xs bg-accent-mint text-foreground">
                  {teacher.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{teacher.name}</span>
            </div>

            {/* Details */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{startTime}</span>
                <span className="text-muted-foreground/50">•</span>
                <span>{duration} min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            </div>
          </div>

          {/* Right side - price and CTA */}
          <div className="flex sm:flex-col items-center sm:items-end gap-3">
            {/* Price */}
            <div className="text-right">
              <span className="text-2xl font-bold">${price}</span>
            </div>

            {/* Book button */}
            <Button
              variant={isBooked ? "secondary" : "soft-mint"}
              size="sm"
              onClick={() => onBook(id)}
              disabled={isBooked}
              className="min-w-[120px]"
            >
              {isBooked ? "Booked" : "Book"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
