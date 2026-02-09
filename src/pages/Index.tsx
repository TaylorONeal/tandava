import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { organizationSchema, websiteSchema } from "@/lib/structured-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  OXATL_STUDIO,
  OXATL_LOCATIONS,
  OXATL_TEACHERS,
  OXATL_CLASS_TYPES,
  OXATL_SCHEDULE,
} from "@/data/demo";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  ArrowRight,
  Mail,
  Phone,
  Sparkles,
} from "lucide-react";

// Build today's schedule from demo data
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
const today = DAYS[new Date().getDay()];

const todaysClasses = OXATL_SCHEDULE
  .filter((slot) => slot.day === today)
  .sort((a, b) => a.time.localeCompare(b.time))
  .slice(0, 6)
  .map((slot) => {
    const classType = OXATL_CLASS_TYPES.find((c) => c.id === slot.class_type_id);
    const teacher = OXATL_TEACHERS.find((t) => t.profile.id === slot.teacher_id);
    const location = OXATL_LOCATIONS.find((l) => l.id === slot.location_id);
    return { ...slot, classType, teacher, location };
  });

const featuredTeachers = OXATL_TEACHERS.slice(0, 6);

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

const Index = () => {
  return (
    <AppLayout>
      <SEOHead
        title={`${OXATL_STUDIO.name} | Yoga, Pilates & Meditation in Austin`}
        description={OXATL_STUDIO.description}
        canonical="/"
        structuredData={[organizationSchema(), websiteSchema()]}
      />
      <div className="space-y-16">
        {/* ---- Hero ---- */}
        <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-accent/10 to-background p-8 md:p-14">
          <div className="max-w-2xl relative z-10">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              <Sparkles className="h-3 w-3 mr-1" />
              3 Locations in Austin
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-semibold tracking-tight mb-4">
              {OXATL_STUDIO.name}
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {OXATL_STUDIO.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/schedule">
                  <Calendar className="h-5 w-5 mr-2" />
                  View Schedule
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/auth/register">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ---- Today's Schedule ---- */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Today's Classes</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            <Link
              to="/schedule"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Full schedule
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {todaysClasses.length > 0 ? (
            <div className="grid gap-3">
              {todaysClasses.map((cls, i) => (
                <Card key={i} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-sm font-semibold">{formatTime(cls.time)}</p>
                        <p className="text-xs text-muted-foreground">
                          {cls.classType?.duration_minutes}min
                        </p>
                      </div>
                      <div
                        className="w-1 h-10 rounded-full"
                        style={{ backgroundColor: cls.classType?.color || "#888" }}
                      />
                      <div>
                        <p className="font-medium">{cls.classType?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {cls.teacher?.profile.display_name} · {cls.location?.name}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/schedule">Book</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No classes scheduled for today. Check the full schedule for upcoming classes.
              </CardContent>
            </Card>
          )}
        </section>

        {/* ---- What We Offer ---- */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">What We Offer</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {OXATL_CLASS_TYPES.map((ct) => (
              <Card key={ct.id} className="group hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div
                    className="w-3 h-3 rounded-full mb-3"
                    style={{ backgroundColor: ct.color }}
                  />
                  <h3 className="font-medium mb-1">{ct.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{ct.description}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {ct.duration_minutes} min
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ---- Our Teachers ---- */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Our Teachers</h2>
            <Link
              to="/instructors"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Meet the team
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredTeachers.map((teacher) => (
              <Card key={teacher.profile.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-5 flex items-start gap-4">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className="text-sm font-medium">
                      {teacher.profile.first_name?.[0]}
                      {teacher.profile.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium">{teacher.profile.display_name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {teacher.specialties.slice(0, 2).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{teacher.bio}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ---- Pricing ---- */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Pricing</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="hover:border-primary/30 transition-colors">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Drop-in</p>
                <p className="text-3xl font-bold">$25</p>
                <p className="text-sm text-muted-foreground mt-1">per class</p>
                <Button variant="outline" className="mt-4 w-full" asChild>
                  <Link to="/schedule">Book a Class</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-primary/50 hover:border-primary transition-colors relative">
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">Most Popular</Badge>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Unlimited Monthly</p>
                <p className="text-3xl font-bold">$149</p>
                <p className="text-sm text-muted-foreground mt-1">per month</p>
                <Button className="mt-4 w-full" asChild>
                  <Link to="/auth/register">Start Membership</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/30 transition-colors">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">10-Class Pack</p>
                <p className="text-3xl font-bold">$200</p>
                <p className="text-sm text-muted-foreground mt-1">$20 per class</p>
                <Button variant="outline" className="mt-4 w-full" asChild>
                  <Link to="/auth/register">Buy Pack</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ---- Locations ---- */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Our Locations</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {OXATL_LOCATIONS.map((loc) => (
              <Card key={loc.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <h3 className="font-medium mb-2">{loc.name}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        {loc.address_line1}
                        {loc.address_line2 ? `, ${loc.address_line2}` : ""}
                        <br />
                        {loc.city}, {loc.state} {loc.postal_code}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0" />
                      {loc.rooms.map((r) => r.name).join(", ")}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0" />
                      {loc.phone}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ---- CTA ---- */}
        <section className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-3">Ready to start your practice?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Join our community of practitioners. Your first class is on us.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/schedule">
                <Calendar className="h-5 w-5 mr-2" />
                Browse Classes
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={`mailto:${OXATL_STUDIO.email}`}>
                <Mail className="h-5 w-5 mr-2" />
                Contact Us
              </a>
            </Button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Index;
