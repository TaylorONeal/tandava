import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, DollarSign } from "lucide-react";

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
    <div className="group rounded-xl border bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="appointment">Appointment</Badge>
          </div>

          {/* Type and description */}
          <h3 className="text-lg font-semibold text-foreground">{type}</h3>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>

          {/* Teacher */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-7 w-7">
              <AvatarImage src={teacher.avatar} alt={teacher.name} />
              <AvatarFallback className="text-xs bg-accent text-accent-foreground">
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
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
          {/* Price */}
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-xl font-semibold">{price}</span>
          </div>

          {/* Book button */}
          <Button
            variant={isBooked ? "outline" : "default"}
            size="sm"
            onClick={() => onBook(id)}
            disabled={isBooked}
            className="w-full sm:w-auto"
          >
            {isBooked ? "Booked" : "Book Appointment"}
          </Button>
        </div>
      </div>
    </div>
  );
}