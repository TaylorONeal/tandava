import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingAddOns } from "./BookingAddOns";
import { CheckCircle2, Calendar, Clock, MapPin, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BookingConfirmationProps {
  booking: {
    id: string;
    title: string;
    type: "class" | "workshop" | "retreat" | "appointment";
    teacher: string;
    studio: string;
    location: string;
    dateTime: string;
    duration: number;
  };
  onClose?: () => void;
  onAddToCalendar?: () => void;
  onInviteFriend?: () => void;
}

// Mock add-ons - in real app, these would come from API based on studio
const mockAddOns = [
  {
    id: "1",
    name: "Mat Towel Rental",
    description: "Fresh, clean towel for your practice",
    priceCents: 500,
    currency: "USD",
  },
  {
    id: "2",
    name: "Branded Water Bottle",
    description: "Reusable studio bottle",
    priceCents: 1500,
    currency: "USD",
  },
  {
    id: "3",
    name: "Studio T-Shirt",
    description: "Soft cotton, limited edition",
    priceCents: 3500,
    currency: "USD",
  },
];

export function BookingConfirmation({
  booking,
  onClose,
  onAddToCalendar,
  onInviteFriend,
}: BookingConfirmationProps) {
  const [showAddOns, setShowAddOns] = useState(true);
  const { t } = useTranslation('booking');

  const typeLabels = {
    class: t('common:type.class'),
    workshop: t('common:type.workshop'),
    retreat: t('common:type.retreat'),
    appointment: t('common:type.appointment'),
  };

  return (
    <div className="space-y-6">
      {/* Success message */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-success/10">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{t('youreBooked')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('cantWaitToSee')}
          </p>
        </div>
      </div>

      {/* Booking summary */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="class" className="mb-2">
                {typeLabels[booking.type]}
              </Badge>
              <h3 className="font-semibold">{booking.title}</h3>
              <p className="text-sm text-muted-foreground">
                {t('withTeacher', { teacher: booking.teacher })}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{booking.dateTime}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{t('minutes', { count: booking.duration })}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{booking.studio} • {booking.location}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onAddToCalendar}>
              <Calendar className="h-4 w-4 mr-1.5" />
              {t('addToCalendar')}
            </Button>
            <Button variant="outline" size="sm" onClick={onInviteFriend}>
              <Share2 className="h-4 w-4 mr-1.5" />
              {t('inviteFriend')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add-ons section */}
      {showAddOns && (
        <BookingAddOns
          addOns={mockAddOns}
          onAddOns={(ids) => {
            console.log("Adding add-ons:", ids);
            setShowAddOns(false);
          }}
          onSkip={() => setShowAddOns(false)}
        />
      )}

      {/* Done button */}
      {!showAddOns && (
        <Button className="w-full" onClick={onClose}>
          {t('done')}
        </Button>
      )}
    </div>
  );
}
