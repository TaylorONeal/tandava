import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PaymentSourceSelector, PaymentSource } from "./PaymentSourceSelector";
import { BookingConfirmation } from "./BookingConfirmation";
import { Clock, MapPin, AlertCircle, Shield, ChevronLeft, Zap, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Quick book = single-tap for members with active coverage
// Standard = payment selection → confirm (for drop-in or multiple options)
type BookingStep = "quick" | "select" | "confirm" | "success";

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
  // Enable instant booking mode (skip payment selection if user has membership)
  enableQuickBook?: boolean;
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

export function BookingModal({ open, onOpenChange, booking, enableQuickBook = true }: BookingModalProps) {
  // Determine if user can quick-book (has active membership that covers this class)
  const primaryCoveringSource = useMemo(() => {
    // Prioritize: membership > class pack > drop-in
    return mockPaymentSources.find(s => s.type === "MEMBERSHIP" && s.covers) ||
           mockPaymentSources.find(s => s.covers) ||
           null;
  }, []);

  const canQuickBook = enableQuickBook && primaryCoveringSource !== null;

  // Start in quick mode if user has coverage, otherwise go to select
  const initialStep: BookingStep = canQuickBook ? "quick" : "select";

  const [step, setStep] = useState<BookingStep>(initialStep);
  const [selectedSource, setSelectedSource] = useState<PaymentSource | null>(
    primaryCoveringSource
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset step when modal opens
  useEffect(() => {
    if (open) {
      setStep(canQuickBook ? "quick" : "select");
      setSelectedSource(primaryCoveringSource);
      setIsProcessing(false);
    }
  }, [open, canQuickBook, primaryCoveringSource]);

  const isFull = booking.spotsLeft === 0;
  const cancellationHours = (booking.cancellationMinutes || 120) / 60;

  const handleBack = () => {
    if (step === "confirm") {
      setStep("select");
    } else if (step === "select" && canQuickBook) {
      setStep("quick");
    }
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

  // Quick book - single tap instant confirmation
  const handleQuickBook = async () => {
    if (!selectedSource) return;

    setIsProcessing(true);

    // Simulate API call - faster for quick book
    await new Promise(resolve => setTimeout(resolve, 800));

    setIsProcessing(false);
    setStep("success");

    toast({
      title: isFull ? "Added to waitlist!" : "You're booked!",
      description: isFull
        ? "We'll notify you if a spot opens up"
        : `See you at ${booking.studio}`,
    });
  };

  // Switch to full payment options from quick mode
  const handleShowAllOptions = () => {
    setStep("select");
  };

  const handleConfirmBooking = async () => {
    if (!selectedSource) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));

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
      setStep(canQuickBook ? "quick" : "select");
      setSelectedSource(primaryCoveringSource);
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
      <DialogContent className={cn(
        "max-h-[90vh] overflow-y-auto",
        step === "quick" ? "max-w-sm" : "max-w-md"
      )}>
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
        ) : step === "quick" ? (
          /* Quick Book Mode - One-tap booking for members */
          <div className="space-y-4 py-2">
            {/* Compact class info */}
            <div className="text-center space-y-2">
              <Badge variant="class" className="mb-2">
                {typeLabels[booking.type]}
              </Badge>
              <h2 className="text-lg font-semibold">{booking.title}</h2>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{booking.dateTime}</span>
                <span>•</span>
                <span>{booking.duration} min</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{booking.studio}</span>
              </div>
            </div>

            {/* Quick book using membership/pack indicator */}
            {selectedSource && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>Using {selectedSource.name}</span>
              </div>
            )}

            {/* Waitlist note */}
            {isFull && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20 text-sm">
                <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Class is full</p>
                  <p className="text-muted-foreground">You'll be added to the waitlist.</p>
                </div>
              </div>
            )}

            {/* Quick Book Button - Large, prominent */}
            <Button
              className={cn(
                "w-full h-14 text-lg font-semibold gap-2",
                !isFull && "bg-primary hover:bg-primary/90"
              )}
              size="lg"
              onClick={handleQuickBook}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  {isFull ? "Join Waitlist" : "Book Now"}
                </>
              )}
            </Button>

            {/* Cancellation policy note - inline, not a checkbox */}
            <p className="text-xs text-center text-muted-foreground">
              Free cancellation up to {cancellationHours}h before class
            </p>

            {/* Option to see other payment methods */}
            <button
              onClick={handleShowAllOptions}
              className="w-full text-sm text-muted-foreground hover:text-foreground text-center py-2 touch-manipulation"
            >
              Use different payment method
            </button>
          </div>
        ) : (
          <>
            <DialogHeader>
              {(step === "confirm" || (step === "select" && canQuickBook)) && (
                <button
                  onClick={handleBack}
                  className="absolute left-4 top-4 p-1 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
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
                  className="w-full h-12"
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
                            ? `${selectedSource.remaining - 1} classes remaining after this`
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

                {/* Cancellation policy - informational, no checkbox */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/30">
                  <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Free cancellation up to {cancellationHours}h before class.
                    Late cancellations may incur a fee.
                  </p>
                </div>

                {/* Confirm Button - large touch target */}
                <Button
                  className="w-full h-14 text-base font-semibold"
                  size="lg"
                  onClick={handleConfirmBooking}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : isFull ? (
                    "Join Waitlist"
                  ) : selectedSource?.priceCents ? (
                    `Pay $${(selectedSource.priceCents / 100).toFixed(2)}`
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>

                {/* Agreement note */}
                <p className="text-xs text-center text-muted-foreground">
                  By booking, you agree to the cancellation policy
                </p>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
