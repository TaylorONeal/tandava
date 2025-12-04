import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { PaymentSourceSelector, PaymentSource } from "./PaymentSourceSelector";
import { BookingConfirmation } from "./BookingConfirmation";
import { Clock, MapPin, AlertCircle, Shield, ChevronLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type BookingStep = "select" | "confirm" | "success";

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    type: "class" | "workshop" | "retreat" | "appointment";
    title: string;
    style?: string;
    teacher: string;
    studio: string;
    location: string;
    dateTime: string;
    duration: number;
    spotsLeft: number;
    dropInPriceCents: number;
    cancellationMinutes?: number;
  };
}

// Mock user payment sources
const mockPaymentSources: PaymentSource[] = [
  {
    id: "mem-1",
    type: "MEMBERSHIP",
    name: "Unlimited Monthly",
    description: "All classes included",
    covers: true,
  },
  {
    id: "pack-1",
    type: "CLASS_PACK",
    name: "10-Class Pack",
    remaining: 7,
    expiresAt: "Jan 15, 2025",
    covers: true,
  },
];

export function BookingModal({ open, onOpenChange, booking }: BookingModalProps) {
  const [step, setStep] = useState<BookingStep>("select");
  const [selectedSource, setSelectedSource] = useState<PaymentSource | null>(
    mockPaymentSources.find(s => s.covers) || null
  );
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isFull = booking.spotsLeft === 0;
  const cancellationHours = (booking.cancellationMinutes || 120) / 60;

  const handleBack = () => {
    setStep("select");
  };

  const handleContinue = () => {
    if (!selectedSource) {
      toast({
        title: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }
    setStep("confirm");
  };

  const handleConfirmBooking = async () => {
    if (!acceptedPolicy) {
      toast({
        title: "Please accept the cancellation policy",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsProcessing(false);
    setStep("success");
    
    toast({
      title: isFull ? "Added to waitlist!" : "Booking confirmed!",
      description: isFull 
        ? "We'll notify you if a spot opens up" 
        : `See you at ${booking.studio}`,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setStep("select");
      setAcceptedPolicy(false);
    }, 300);
  };

  const typeLabels = {
    class: "Class",
    workshop: "Workshop",
    retreat: "Retreat",
    appointment: "Appointment",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {step === "success" ? (
          <BookingConfirmation
            booking={{
              id: booking.id,
              title: booking.title,
              type: booking.type,
              teacher: booking.teacher,
              studio: booking.studio,
              location: booking.location,
              dateTime: booking.dateTime,
              duration: booking.duration,
            }}
            onClose={handleClose}
            onAddToCalendar={() => {
              toast({ title: "Added to calendar" });
            }}
            onInviteFriend={() => {
              toast({ title: "Share link copied!" });
            }}
          />
        ) : (
          <>
            <DialogHeader>
              {step === "confirm" && (
                <button
                  onClick={handleBack}
                  className="absolute left-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <DialogTitle>
                {step === "select" 
                  ? (isFull ? "Join Waitlist" : "Book Class") 
                  : "Confirm Booking"
                }
              </DialogTitle>
            </DialogHeader>

            {/* Booking summary (always visible) */}
            <div className="p-4 rounded-2xl bg-muted/50 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="class" className="mb-2">
                    {typeLabels[booking.type]}
                  </Badge>
                  <h3 className="font-semibold">{booking.title}</h3>
                  {booking.style && (
                    <p className="text-sm text-muted-foreground">{booking.style}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{booking.dateTime}</span>
                </div>
                <span>•</span>
                <span>{booking.duration} min</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{booking.studio} • {booking.location}</span>
              </div>
            </div>

            {step === "select" && (
              <>
                <Separator />
                
                {/* Payment source selection */}
                <PaymentSourceSelector
                  sources={mockPaymentSources}
                  dropInPriceCents={booking.dropInPriceCents}
                  selectedId={selectedSource?.id || null}
                  onSelect={setSelectedSource}
                />

                {/* Waitlist note */}
                {isFull && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
                    <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-warning">Class is full</p>
                      <p className="text-muted-foreground">
                        You'll be added to the waitlist. We'll notify you if a spot opens.
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleContinue}
                  disabled={!selectedSource}
                >
                  Continue
                </Button>
              </>
            )}

            {step === "confirm" && (
              <>
                <Separator />

                {/* Payment summary */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Payment Summary</h3>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <div>
                      <p className="font-medium">{selectedSource?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedSource?.type === "DROP_IN" 
                          ? "One-time payment" 
                          : selectedSource?.remaining 
                            ? `${selectedSource.remaining} classes remaining after this` 
                            : "Unlimited classes"
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      {selectedSource?.priceCents ? (
                        <span className="font-semibold">
                          ${(selectedSource.priceCents / 100).toFixed(2)}
                        </span>
                      ) : (
                        <Badge variant="mint">Included</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cancellation policy */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50">
                    <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Cancellation Policy</p>
                      <p className="text-muted-foreground">
                        Free cancellation up to {cancellationHours} hours before class. 
                        Late cancellations may incur a fee.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      checked={acceptedPolicy}
                      onCheckedChange={(checked) => setAcceptedPolicy(checked === true)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-muted-foreground">
                      I understand and accept the cancellation policy
                    </span>
                  </label>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleConfirmBooking}
                  disabled={!acceptedPolicy || isProcessing}
                >
                  {isProcessing 
                    ? "Processing..." 
                    : isFull 
                      ? "Join Waitlist" 
                      : selectedSource?.priceCents 
                        ? `Pay $${(selectedSource.priceCents / 100).toFixed(2)}` 
                        : "Confirm Booking"
                  }
                </Button>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
