/**
 * Demo Landing — Oxatl Yoga
 *
 * The FIRST thing visitors see. This IS the landing page.
 * Built around the demo studio Oxatl Yoga with prominent role switching
 * so studio owners can explore the platform from every perspective.
 */

import { useNavigate } from 'react-router-dom';
import { useDemo } from '@/contexts/DemoContext';
import type { UserRole } from '@/types/database';
import {
  OXATL_STUDIO,
  OXATL_LOCATIONS,
  OXATL_TEACHERS,
  OXATL_CLASS_TYPES,
  OXATL_SCHEDULE,
} from '@/data/demo';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  LayoutDashboard,
  GraduationCap,
  ClipboardCheck,
  Sparkles,
  ArrowRight,
  Github,
  Monitor,
} from 'lucide-react';

// ============================================================================
// TODAY'S SCHEDULE (derived from Oxatl demo data)
// ============================================================================

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
const today = DAYS[new Date().getDay()];

const todaysClasses = OXATL_SCHEDULE
  .filter((slot) => slot.day === today)
  .sort((a, b) => a.time.localeCompare(b.time))
  .slice(0, 5)
  .map((slot) => {
    const classType = OXATL_CLASS_TYPES.find((c) => c.id === slot.class_type_id);
    const teacher = OXATL_TEACHERS.find((t) => t.profile.id === slot.teacher_id);
    const location = OXATL_LOCATIONS.find((l) => l.id === slot.location_id);
    return { ...slot, classType, teacher, location };
  });

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

// ============================================================================
// ROLE CARDS
// ============================================================================

interface RoleConfig {
  role: UserRole;
  title: string;
  description: string;
  icon: typeof LayoutDashboard;
  destination: string;
  accent: string;
  bg: string;
}

const ROLES: RoleConfig[] = [
  {
    role: 'owner',
    title: 'Studio Owner',
    description: 'Dashboard, schedule, members, payments, analytics, marketing',
    icon: LayoutDashboard,
    destination: '/manage',
    accent: 'text-amber-400',
    bg: 'from-amber-500/20 to-amber-600/5 hover:from-amber-500/30 hover:to-amber-600/10 border-amber-500/20 hover:border-amber-400/40',
  },
  {
    role: 'teacher',
    title: 'Instructor',
    description: 'Teaching schedule, sub requests, earnings, availability',
    icon: GraduationCap,
    destination: '/teach',
    accent: 'text-blue-400',
    bg: 'from-blue-500/20 to-blue-600/5 hover:from-blue-500/30 hover:to-blue-600/10 border-blue-500/20 hover:border-blue-400/40',
  },
  {
    role: 'front_desk',
    title: 'Front Desk',
    description: 'Check-in members, manage waitlists, daily roster',
    icon: ClipboardCheck,
    destination: '/staff/checkin',
    accent: 'text-violet-400',
    bg: 'from-violet-500/20 to-violet-600/5 hover:from-violet-500/30 hover:to-violet-600/10 border-violet-500/20 hover:border-violet-400/40',
  },
  {
    role: 'student',
    title: 'Member',
    description: 'Browse classes, book sessions, track practice, community',
    icon: Sparkles,
    destination: '/home',
    accent: 'text-teal-400',
    bg: 'from-teal-500/20 to-teal-600/5 hover:from-teal-500/30 hover:to-teal-600/10 border-teal-500/20 hover:border-teal-400/40',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function Demo() {
  const navigate = useNavigate();
  const { switchPersona } = useDemo();

  const handleRoleSelect = (config: RoleConfig) => {
    switchPersona(config.role);
    navigate(config.destination);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ================================================================ */}
      {/* HERO — Oxatl Yoga + Role Picker                                 */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

        <div className="relative max-w-6xl mx-auto px-6 pt-12 pb-16">
          {/* Studio header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-lg font-display font-bold text-primary">O</span>
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold">{OXATL_STUDIO.name}</h2>
                <p className="text-xs text-muted-foreground">Austin, Texas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground border border-border rounded-full px-3 py-1">
                Interactive Demo
              </span>
              <a
                href="https://github.com/TaylorONeal/tandava"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-full px-3 py-1"
              >
                <Github className="w-3.5 h-3.5" />
                GitHub
              </a>
            </div>
          </div>

          {/* Main headline */}
          <div className="max-w-3xl mb-12">
            <p className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Powered by Tandava — Open Source Studio Management
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-tight mb-5">
              {OXATL_STUDIO.name}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {OXATL_STUDIO.description}
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {OXATL_LOCATIONS.length} locations
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {OXATL_TEACHERS.length} teachers
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {OXATL_CLASS_TYPES.length} class types
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* ROLE PICKER — The main interaction                           */}
          {/* ============================================================ */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-1">Explore the platform</h2>
            <p className="text-sm text-muted-foreground">
              Choose a role to see how Tandava works for everyone in the studio
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map((config) => {
              const Icon = config.icon;
              return (
                <button
                  key={config.role}
                  onClick={() => handleRoleSelect(config)}
                  className={`group relative text-left rounded-2xl border bg-gradient-to-br ${config.bg} p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-card/50 flex items-center justify-center ${config.accent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{config.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {config.description}
                  </p>
                  <div className={`flex items-center gap-2 text-sm font-medium ${config.accent} group-hover:gap-3 transition-all`}>
                    Enter as {config.title}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* TODAY'S SCHEDULE                                                 */}
      {/* ================================================================ */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Today at Oxatl</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => { switchPersona('student'); navigate('/schedule'); }}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Full schedule <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todaysClasses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {todaysClasses.map((cls, i) => (
              <button
                key={i}
                onClick={() => { switchPersona('student'); navigate('/schedule'); }}
                className="text-left p-4 rounded-xl border bg-card hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cls.classType?.color || "#888" }}
                  />
                  <span className="text-sm font-medium truncate">{cls.classType?.name}</span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(cls.time)} · {cls.classType?.duration_minutes}min
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {cls.teacher?.profile.display_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {cls.location?.name}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground rounded-xl border bg-card">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No classes today. Check the full schedule.</p>
          </div>
        )}
      </section>

      {/* ================================================================ */}
      {/* CLASS TYPES + LOCATIONS                                          */}
      {/* ================================================================ */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Class types */}
          <div>
            <h2 className="text-lg font-semibold mb-4">What We Offer</h2>
            <div className="grid grid-cols-2 gap-3">
              {OXATL_CLASS_TYPES.map((ct) => (
                <div key={ct.id} className="p-3 rounded-xl border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ct.color }} />
                    <span className="text-sm font-medium">{ct.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{ct.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{ct.duration_minutes} min</p>
                </div>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Our Locations</h2>
            <div className="space-y-3">
              {OXATL_LOCATIONS.map((loc) => (
                <div key={loc.id} className="p-4 rounded-xl border bg-card">
                  <h3 className="font-medium mb-1">{loc.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {loc.address_line1}, {loc.city}, {loc.state} {loc.postal_code}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{loc.rooms.map((r) => r.name).join(", ")}</span>
                    <span>· Capacity: {loc.capacity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* OUR TEACHERS                                                     */}
      {/* ================================================================ */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <h2 className="text-lg font-semibold mb-4">Our Teachers</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {OXATL_TEACHERS.slice(0, 8).map((teacher) => (
            <div key={teacher.profile.id} className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {teacher.profile.first_name?.[0]}{teacher.profile.last_name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{teacher.profile.display_name}</p>
                  <p className="text-xs text-muted-foreground">{teacher.pay_type === 'per_class' ? 'Per-class' : 'Hourly'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {teacher.specialties.slice(0, 2).map((s) => (
                  <span key={s} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* FOOTER                                                           */}
      {/* ================================================================ */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{OXATL_STUDIO.name}</span>
            <span>·</span>
            <span>Powered by <a href="https://github.com/TaylorONeal/tandava" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Tandava</a></span>
          </div>
          <p className="text-xs text-muted-foreground">
            Open source · AGPL-3.0 · Self-hosted
          </p>
        </div>
      </footer>
    </div>
  );
}
