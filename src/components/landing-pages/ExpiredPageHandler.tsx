import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface ExpiredPageHandlerProps {
  originalTitle: string;
  expiredBehavior: "show_alternatives" | "redirect_parent" | "show_message" | "custom_redirect";
  expiredMessage?: string;
  alternativePrograms?: AlternativeProgram[];
  programType?: string;
}

interface AlternativeProgram {
  id: string;
  title: string;
  type: string;
  description: string;
  startDate?: string;
  location?: string;
  spotsRemaining?: number;
  imageUrl?: string;
  url: string;
}

// Mock alternative programs - in production, these would come from the database
const mockAlternatives: AlternativeProgram[] = [
  {
    id: "1",
    title: "200-Hour Spring Teacher Training 2026",
    type: "teacher_training",
    description: "Begin your journey as a certified yoga instructor. Includes philosophy, anatomy, and teaching methodology.",
    startDate: "2026-04-15",
    location: "SOMA Studio",
    spotsRemaining: 8,
    url: "/s/tandava-yoga/teacher-training-spring-2026",
  },
  {
    id: "2",
    title: "Costa Rica Yoga Retreat",
    type: "retreat",
    description: "7 days of yoga, meditation, and adventure in the heart of the jungle.",
    startDate: "2026-06-20",
    location: "Nosara, Costa Rica",
    spotsRemaining: 12,
    url: "/s/tandava-yoga/costa-rica-retreat-2026",
  },
  {
    id: "3",
    title: "Arm Balance Intensive",
    type: "workshop",
    description: "Master crow, handstand, and more in this 3-hour deep dive.",
    startDate: "2026-03-15",
    location: "SOMA Studio",
    spotsRemaining: 6,
    url: "/s/tandava-yoga/arm-balance-workshop",
  },
];

export function ExpiredPageHandler({
  originalTitle,
  expiredBehavior,
  expiredMessage,
  alternativePrograms = mockAlternatives,
  programType,
}: ExpiredPageHandlerProps) {
  // Filter alternatives by program type if specified
  const relevantAlternatives = programType
    ? alternativePrograms.filter((p) => p.type === programType)
    : alternativePrograms;

  // Fall back to all alternatives if no matches
  const displayAlternatives = relevantAlternatives.length > 0
    ? relevantAlternatives
    : alternativePrograms;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (expiredBehavior === "show_message" && expiredMessage) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{originalTitle}</h1>
          <p className="text-muted-foreground mb-6">{expiredMessage}</p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link to="/schedule">View Schedule</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default: show_alternatives
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            <Clock className="h-3 w-3 mr-1" />
            This Promotion Has Ended
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">{originalTitle}</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            This program or promotion is no longer available, but we have exciting alternatives
            that might interest you.
          </p>
        </div>
      </div>

      {/* Alternatives Section */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold mb-4">Current Offerings</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayAlternatives.slice(0, 6).map((program) => (
            <Card key={program.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {program.imageUrl && (
                <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5" />
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {program.type.replace(/_/g, " ")}
                  </Badge>
                  {program.spotsRemaining && program.spotsRemaining <= 10 && (
                    <Badge className="text-[10px] bg-accent-coral/20 text-accent-coral">
                      {program.spotsRemaining} spots left
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base">{program.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {program.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1.5 mb-3">
                  {program.startDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(program.startDate)}
                    </div>
                  )}
                  {program.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {program.location}
                    </div>
                  )}
                </div>
                <Button size="sm" className="w-full" asChild>
                  <Link to={program.url}>
                    Learn More
                    <ArrowRight className="h-3 w-3 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional CTAs */}
        <div className="mt-8 p-6 rounded-2xl bg-secondary/30 text-center">
          <h3 className="text-lg font-semibold mb-2">Looking for Something Else?</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Browse our full schedule or reach out to learn about upcoming programs.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button asChild>
              <Link to="/schedule">View Full Schedule</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/pricing">Membership Options</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>

        {/* SEO Note - Hidden but helps with crawling */}
        <div className="sr-only">
          <p>This page previously featured: {originalTitle}</p>
          <p>Please visit our current offerings for similar programs.</p>
        </div>
      </div>
    </div>
  );
}

// Helper function to add noindex meta tag for expired pages
export function useExpiredPageMeta(isExpired: boolean) {
  if (typeof document !== "undefined" && isExpired) {
    // Add noindex meta tag
    const existingMeta = document.querySelector('meta[name="robots"]');
    if (existingMeta) {
      existingMeta.setAttribute("content", "noindex, follow");
    } else {
      const meta = document.createElement("meta");
      meta.name = "robots";
      meta.content = "noindex, follow";
      document.head.appendChild(meta);
    }

    // Update HTTP header equivalent
    const httpEquiv = document.querySelector('meta[http-equiv="X-Robots-Tag"]');
    if (!httpEquiv) {
      const meta = document.createElement("meta");
      meta.httpEquiv = "X-Robots-Tag";
      meta.content = "noindex, follow";
      document.head.appendChild(meta);
    }
  }
}
