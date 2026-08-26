import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { api, isBackendConfigured } from "@/lib/backend";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import {
  Building2, MapPin, Palette, Tag, CalendarClock, DollarSign, Users,
  ShieldCheck, Upload, CreditCard, Rocket, Check, ChevronRight,
  SkipForward, ExternalLink, CheckCircle2, Circle, Plus, Trash2, Loader2,
} from "lucide-react";

const STEPS = [
  { key: "studio", label: "Studio Info", icon: Building2 },
  { key: "location", label: "Location", icon: MapPin },
  { key: "branding", label: "Branding", icon: Palette },
  { key: "offerings", label: "Offerings", icon: Tag },
  { key: "schedule", label: "Schedule", icon: CalendarClock },
  { key: "pricing", label: "Pricing", icon: DollarSign },
  { key: "staff", label: "Staff", icon: Users },
  { key: "waivers", label: "Waivers", icon: ShieldCheck },
  { key: "import", label: "Import", icon: Upload },
  { key: "stripe", label: "Stripe Connect", icon: CreditCard },
  { key: "launch", label: "Launch", icon: Rocket },
] as const;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Where in-progress answers live so a refresh (or a lost session) can resume. */
const DRAFT_KEY = "tandava:onboarding-draft";

interface StaffRow {
  name: string;
  email: string;
  role: string;
  payType: string;
  payRate: string;
}

const emptyStaffRow = (): StaffRow => ({ name: "", email: "", role: "teacher", payType: "per_class", payRate: "" });

interface OnboardingStatus {
  studioId: string | null;
  studio?: {
    name?: string; description?: string; timezone?: string; currency?: string;
    primaryColor?: string; secondaryColor?: string; discoverable?: boolean; address?: string;
  } | null;
  completedSteps?: string[];
  currentStep?: string;
  isLaunched?: boolean;
  stripeConnected?: boolean;
  offerings?: { id: string; name: string }[];
  staff?: { id: string; name: string }[];
  rooms?: string[];
}

interface StepResult {
  ok?: boolean;
  studioId?: string;
  invited?: number;
  staffErrors?: { email: string; message: string }[];
}

// Hoisted so inputs keep identity (and focus) across parent re-renders.
function StepCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Field({ label, id, value, onChange, ...props }: {
  label: string; id: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={onChange} {...props} />
    </div>
  );
}

function Sel({ label, value, onChange, options, placeholder, disabled }: {
  label: string; value: string; onChange: (val: string) => void;
  options: [string, string][]; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function Onboarding() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshProfile } = useAuth();
  // Fixed at build/config time: real backend vs demo dry-run.
  const production = isBackendConfigured();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [f, setF] = useState<Record<string, string>>({
    timezone: "America/Los_Angeles", currency: "USD", rooms: "Main Studio, Hot Room",
    classStyle: "vinyasa", classLevel: "all", classDuration: "60", classCapacity: "25",
    classPrice: "25", schedDay: "monday", schedTime: "09:00", memberCycle: "monthly",
    packClasses: "10", waiverName: "Liability Waiver",
    primaryColor: "#4fd1c5", secondaryColor: "#f687b3",
  });
  const [memberUnlimited, setMemberUnlimited] = useState(true);
  const [discoverable, setDiscoverable] = useState(false);
  const [staffList, setStaffList] = useState<StaffRow[]>([emptyStaffRow()]);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [restoring, setRestoring] = useState(isBackendConfigured());
  const [studioId, setStudioId] = useState<string | null>(null);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeBusy, setStripeBusy] = useState(false);
  // Real records for the schedule step (production only; demo uses samples).
  const [offerings, setOfferings] = useState<{ id: string; name: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [key]: e.target.value }));
  const sel = (key: string) => (val: string) => setF((p) => ({ ...p, [key]: val }));

  // When returning from Stripe we pin the wizard to the Stripe step; the async
  // status restore must not yank the cursor elsewhere.
  const pinStepRef = useRef(false);

  // -------------------------------------------------------------------------
  // Draft persistence: every answer autosaves locally so closing the tab
  // (or losing connectivity) never loses work. Server-side progress is
  // restored on top of the draft below.
  // -------------------------------------------------------------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.f) setF((p) => ({ ...p, ...draft.f }));
      if (typeof draft.memberUnlimited === "boolean") setMemberUnlimited(draft.memberUnlimited);
      if (typeof draft.discoverable === "boolean") setDiscoverable(draft.discoverable);
      if (Array.isArray(draft.staffList) && draft.staffList.length > 0) setStaffList(draft.staffList);
      // Steps are stored by key, not index, so drafts survive step reordering.
      const stepIdx = STEPS.findIndex((s) => s.key === draft.step);
      if (stepIdx >= 0) setStep(stepIdx);
      if (Array.isArray(draft.done)) {
        setDone(new Set<number>(
          (draft.done as string[])
            .map((key) => STEPS.findIndex((s) => s.key === key))
            .filter((i) => i >= 0),
        ));
      }
    } catch {
      // Corrupt draft — start fresh.
    }
  }, []);

  useEffect(() => {
    // Debounced: `f` changes on every keystroke; serialize once the user pauses.
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            f, memberUnlimited, discoverable, staffList,
            step: STEPS[step].key,
            done: [...done].map((i) => STEPS[i].key),
          }),
        );
      } catch {
        // Storage full/unavailable — drafts are best-effort.
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [f, memberUnlimited, discoverable, staffList, step, done]);

  const applyStatus = useCallback((status: OnboardingStatus, restoreCursor: boolean) => {
    setStudioId(status.studioId ?? null);
    setStripeConnected(Boolean(status.stripeConnected));
    setOfferings(status.offerings ?? []);
    setTeachers(status.staff ?? []);
    setRooms(status.rooms ?? []);

    if (status.studio) {
      const s = status.studio;
      setF((p) => ({
        ...p,
        studioName: p.studioName ?? s.name ?? "",
        studioDesc: p.studioDesc ?? s.description ?? "",
        timezone: s.timezone ?? p.timezone,
        currency: s.currency ?? p.currency,
        primaryColor: s.primaryColor ?? p.primaryColor,
        secondaryColor: s.secondaryColor ?? p.secondaryColor,
        address: p.address ?? s.address ?? "",
      }));
      if (typeof s.discoverable === "boolean") setDiscoverable(s.discoverable);
    }

    if (!status.studioId) return;

    // The server knows which steps are truly complete — it wins over drafts.
    const completed = new Set<number>(
      (status.completedSteps ?? [])
        .map((key) => STEPS.findIndex((st) => st.key === key))
        .filter((i) => i >= 0),
    );
    setDone(completed);
    // Only reposition on the initial restore — mid-session refreshes must not
    // yank the user away from the step they're on.
    if (restoreCursor) {
      const cursor = STEPS.findIndex((st) => st.key === status.currentStep);
      if (cursor >= 0 && !pinStepRef.current) setStep(cursor);
    }
  }, []);

  // Re-pull offerings/staff/rooms after a save so later steps (Schedule) can
  // reference entities created earlier in the same session.
  const refreshStatus = useCallback(async () => {
    const { data, error } = await api.invoke<OnboardingStatus>("onboarding", { step: "status" });
    if (!error && data) applyStatus(data, false);
  }, [applyStatus]);

  // -------------------------------------------------------------------------
  // Resume from the server: restores completed steps + prefills studio data.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isBackendConfigured()) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await api.invoke<OnboardingStatus>("onboarding", { step: "status" });
      if (!cancelled) {
        if (!error && data) applyStatus(data, true);
        setRestoring(false);
      }
    })();
    return () => { cancelled = true; };
  }, [applyStatus]);

  // -------------------------------------------------------------------------
  // Returning from Stripe's hosted onboarding (?stripe=return|refresh).
  // -------------------------------------------------------------------------
  useEffect(() => {
    const stripeParam = searchParams.get("stripe");
    if (!stripeParam || !isBackendConfigured()) return;
    searchParams.delete("stripe");
    setSearchParams(searchParams, { replace: true });
    pinStepRef.current = true;
    setStep(STEPS.findIndex((s) => s.key === "stripe"));
    if (stripeParam !== "return") return;
    (async () => {
      const { data } = await api.invoke<{ connected?: boolean }>("stripe-connect", { action: "status" });
      if (data?.connected) {
        setStripeConnected(true);
        setDone((prev) => new Set([...prev, STEPS.findIndex((s) => s.key === "stripe")]));
        toast({ title: "Stripe connected", description: "Your studio can now accept payments." });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const stepPayload = (): Record<string, unknown> => {
    if (STEPS[step].key === "staff") {
      return { staff: staffList.filter((s) => s.name.trim() || s.email.trim()) };
    }
    if (STEPS[step].key === "launch") {
      return { ...f, memberUnlimited, discoverable };
    }
    return { ...f, memberUnlimited };
  };

  const handleSave = async () => {
    // Persist the step server-side when a backend is configured; demo just advances.
    let invited: number | undefined;
    if (isBackendConfigured()) {
      setSaving(true);
      const isFirstStudioSave = STEPS[step].key === "studio" && !studioId;
      const { data, error } = await api.invoke<StepResult>("onboarding", {
        step: STEPS[step].key,
        data: stepPayload(),
      });
      setSaving(false);
      if (error) {
        toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
        return;
      }
      if (data?.studioId) setStudioId(data.studioId);
      invited = data?.invited;
      if (data?.staffErrors?.length) {
        toast({
          title: "Some invites failed",
          description: data.staffErrors.map((e) => `${e.email}: ${e.message}`).join("; "),
          variant: "destructive",
        });
      }
      if (isFirstStudioSave) {
        // Creating the studio made this user its owner — unlock /manage.
        await refreshProfile();
      }
      // Refresh offerings/staff/rooms so later steps see what was just created.
      void refreshStatus();
    }
    setDone((prev) => new Set([...prev, step]));
    toast({
      title: `${STEPS[step].label} saved`,
      description: invited
        ? `${invited} invitation${invited === 1 ? "" : "s"} sent. Your progress has been saved.`
        : "Your progress has been saved.",
    });
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleSkip = () => {
    if (isBackendConfigured() && studioId) {
      // Record the skip so resuming (on any device) lands on the next step.
      api.invoke("onboarding", { step: STEPS[step].key, skip: true });
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleConnectStripe = async () => {
    if (!isBackendConfigured()) {
      toast({ title: "Demo mode", description: "Stripe Connect is available once a backend is configured." });
      return;
    }
    setStripeBusy(true);
    const { data, error } = await api.invoke<{ url?: string }>("stripe-connect", { action: "start" });
    setStripeBusy(false);
    if (error || !data?.url) {
      toast({ title: "Couldn't start Stripe onboarding", description: error?.message ?? "No URL returned", variant: "destructive" });
      return;
    }
    window.location.href = data.url;
  };

  const handleLaunch = async () => {
    setLaunching(true);
    if (isBackendConfigured()) {
      const { error } = await api.invoke("onboarding", { step: "launch", data: stepPayload() });
      if (error) {
        setLaunching(false);
        toast({ title: "Couldn't launch", description: error.message, variant: "destructive" });
        return;
      }
    }
    setLaunching(false);
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* best-effort */ }
    toast({ title: "Studio launched!", description: "Your studio is now live. Welcome to Tandava!" });
    if (isBackendConfigured()) navigate("/manage");
  };

  const updateStaff = (i: number, key: keyof StaffRow, value: string) =>
    setStaffList((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));

  // Schedule-step choices: real records in production, samples in demo.
  const offeringOptions: [string, string][] = production
    ? offerings.map((o) => [o.id, o.name])
    : [["morning-vinyasa", "Morning Vinyasa"], ["gentle-flow", "Gentle Flow"], ["power-yoga", "Power Yoga"]];
  const teacherOptions: [string, string][] = production
    ? teachers.map((t) => [t.id, t.name])
    : [["maya", "Maya Patel"], ["james", "James Liu"], ["sarah", "Sarah Chen"]];
  const roomOptions: [string, string][] = production
    ? rooms.map((r) => [r, r])
    : [["main", "Main Studio"], ["hot", "Hot Room"], ["meditation", "Meditation Room"]];

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <StepCard title="Studio Information" desc="Tell us about your studio to get started">
          <Field label="Studio Name" id="studioName" placeholder="e.g. Tandava Yoga" value={f.studioName ?? ""} onChange={set("studioName")} />
          <div className="space-y-2">
            <Label htmlFor="studioDesc">Description</Label>
            <Textarea id="studioDesc" placeholder="A brief description of your studio..." value={f.studioDesc ?? ""} onChange={set("studioDesc")} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Sel label="Timezone" value={f.timezone ?? ""} onChange={sel("timezone")} options={[["America/New_York","Eastern (ET)"],["America/Chicago","Central (CT)"],["America/Denver","Mountain (MT)"],["America/Los_Angeles","Pacific (PT)"]]} />
            <Sel label="Currency" value={f.currency ?? ""} onChange={sel("currency")} options={[["USD","USD ($)"],["EUR","EUR"],["GBP","GBP"],["CAD","CAD"]]} />
          </div>
        </StepCard>
      );
      case 1: return (
        <StepCard title="Location" desc="Where is your studio located?">
          <Field label="Street Address" id="address" placeholder="123 Main St, San Francisco, CA 94105" value={f.address ?? ""} onChange={set("address")} />
          <Field label="Rooms (comma-separated)" id="rooms" placeholder="Main Studio, Hot Room" value={f.rooms ?? ""} onChange={set("rooms")} />
          <Field label="Amenities" id="amenities" placeholder="Showers, Mat Rentals, Changing Rooms, Lockers" value={f.amenities ?? ""} onChange={set("amenities")} />
        </StepCard>
      );
      case 2: return (
        <StepCard title="Branding" desc="Customize how your studio looks to students">
          <div className="grid grid-cols-2 gap-4">
            {(["primaryColor", "secondaryColor"] as const).map((key) => (
              <div key={key} className="space-y-2">
                <Label>{key === "primaryColor" ? "Primary Color" : "Secondary Color"}</Label>
                <div className="flex items-center gap-2">
                  <Input type="color" value={f[key]} onChange={set(key)} className="w-12 h-10 p-1" />
                  <Input value={f[key]} onChange={set(key)} />
                </div>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <p className="text-sm text-muted-foreground">Drag and drop your logo, or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, SVG, or JPG (512x512px recommended)</p>
              <Button variant="outline" size="sm" className="mt-3">Upload Logo</Button>
            </div>
          </div>
        </StepCard>
      );
      case 3: return (
        <StepCard title="Create a Class Offering" desc="Define the types of classes you teach">
          <Field label="Class Name" id="className" placeholder="e.g. Morning Vinyasa" value={f.className ?? ""} onChange={set("className")} />
          <div className="grid grid-cols-2 gap-4">
            <Sel label="Style" value={f.classStyle ?? ""} onChange={sel("classStyle")} options={[["vinyasa","Vinyasa"],["hatha","Hatha"],["yin","Yin"],["power","Power"],["restorative","Restorative"]]} />
            <Sel label="Level" value={f.classLevel ?? ""} onChange={sel("classLevel")} options={[["all","All Levels"],["beginner","Beginner"],["intermediate","Intermediate"],["advanced","Advanced"]]} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Duration (min)" id="classDuration" type="number" value={f.classDuration ?? ""} onChange={set("classDuration")} />
            <Field label="Capacity" id="classCapacity" type="number" value={f.classCapacity ?? ""} onChange={set("classCapacity")} />
            <Field label="Drop-in Price ($)" id="classPrice" type="number" value={f.classPrice ?? ""} onChange={set("classPrice")} />
          </div>
        </StepCard>
      );
      case 4: return (
        <StepCard title="Set Up a Recurring Class" desc="Add your first class to the weekly schedule">
          {production && offeringOptions.length === 0 && (
            <p className="text-sm text-muted-foreground">Complete the Offerings step first to schedule a class, or skip for now.</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Sel label="Offering" value={f.schedOffering ?? ""} onChange={sel("schedOffering")} placeholder="Select a class" options={offeringOptions} disabled={production && offeringOptions.length === 0} />
            <Sel label="Teacher (optional)" value={f.schedTeacher ?? ""} onChange={sel("schedTeacher")} placeholder="Select a teacher" options={teacherOptions} disabled={production && teacherOptions.length === 0} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Sel label="Day" value={f.schedDay ?? ""} onChange={sel("schedDay")} options={DAYS.map((d) => [d.toLowerCase(), d])} />
            <Field label="Time" id="schedTime" type="time" value={f.schedTime ?? ""} onChange={set("schedTime")} />
            <Sel label="Room" value={f.schedRoom ?? ""} onChange={sel("schedRoom")} placeholder="Select room" options={roomOptions} disabled={production && roomOptions.length === 0} />
          </div>
        </StepCard>
      );
      case 5: return (
        <StepCard title="Pricing Plans" desc="Create membership types and class packs">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Membership</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Membership Name" id="memberName" placeholder="e.g. Unlimited Monthly" value={f.memberName ?? ""} onChange={set("memberName")} />
            <Sel label="Billing Cycle" value={f.memberCycle ?? ""} onChange={sel("memberCycle")} options={[["monthly","Monthly"],["quarterly","Quarterly"],["annual","Annual"]]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price ($)" id="memberPrice" type="number" placeholder="149" value={f.memberPrice ?? ""} onChange={set("memberPrice")} />
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={memberUnlimited} onCheckedChange={setMemberUnlimited} />
              <Label>Unlimited classes</Label>
            </div>
          </div>
          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Class Pack</p>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Pack Name" id="packName" placeholder="e.g. 10-Class Pack" value={f.packName ?? ""} onChange={set("packName")} />
            <Field label="Classes" id="packClasses" type="number" value={f.packClasses ?? ""} onChange={set("packClasses")} />
            <Field label="Price ($)" id="packPrice" type="number" placeholder="200" value={f.packPrice ?? ""} onChange={set("packPrice")} />
          </div>
        </StepCard>
      );
      case 6: return (
        <StepCard title="Add Your Team" desc="Invite teachers and staff — each gets an email invitation to join your studio">
          <div className="space-y-4">
            {staffList.map((member, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team member {i + 1}</p>
                  {staffList.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => setStaffList((rows) => rows.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Full Name" id={`staffName-${i}`} placeholder="Maya Patel" value={member.name} onChange={(e) => updateStaff(i, "name", e.target.value)} />
                  <Field label="Email" id={`staffEmail-${i}`} placeholder="maya@tandava.yoga" value={member.email} onChange={(e) => updateStaff(i, "email", e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Sel label="Role" value={member.role} onChange={(v) => updateStaff(i, "role", v)} options={[["teacher","Teacher"],["sub","Substitute"],["admin","Admin"],["front_desk","Front Desk"]]} />
                  <Sel label="Pay Type" value={member.payType} onChange={(v) => updateStaff(i, "payType", v)} options={[["per_class","Per Class"],["hourly","Hourly"],["salary","Salary"]]} />
                  <Field label="Pay Rate ($)" id={`staffRate-${i}`} type="number" placeholder="75" value={member.payRate} onChange={(e) => updateStaff(i, "payRate", e.target.value)} />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setStaffList((rows) => [...rows, emptyStaffRow()])}>
              <Plus className="h-4 w-4 me-1.5" />Add another
            </Button>
          </div>
        </StepCard>
      );
      case 7: return (
        <StepCard title="Liability Waiver" desc="Create a waiver that students must sign before their first class">
          <Field label="Waiver Name" id="waiverName" value={f.waiverName ?? ""} onChange={set("waiverName")} />
          <div className="space-y-2">
            <Label htmlFor="waiverContent">Waiver Content</Label>
            <Textarea id="waiverContent" rows={8} placeholder="I acknowledge that yoga involves physical activity and that I participate at my own risk..." value={f.waiverContent ?? ""} onChange={set("waiverContent")} />
            <p className="text-xs text-muted-foreground">Students will be required to agree to this waiver before booking.</p>
          </div>
        </StepCard>
      );
      case 8: return (
        <StepCard title="Import Existing Data" desc="Migrate students, schedules, and memberships from another platform">
          <p className="text-sm text-muted-foreground">If you have existing data from Mindbody, Momoyoga, or another platform, you can import it now or come back later. Completing an import checks this step off automatically.</p>
          <Button variant="outline" asChild>
            <Link to="/manage/import"><ExternalLink className="h-4 w-4 me-2" />Go to Import Tool</Link>
          </Button>
        </StepCard>
      );
      case 9: return (
        <StepCard title="Connect Stripe" desc="Enable payment processing for your studio">
          {stripeConnected ? (
            <div className="p-6 rounded-xl border-2 border-primary/30 bg-primary/5 text-center">
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
              <h3 className="text-sm font-semibold mt-3">Stripe is connected</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Your studio can accept memberships, class packs, and drop-in payments.</p>
            </div>
          ) : (
            <div className="p-6 rounded-xl border-2 border-dashed border-border text-center">
              <CreditCard className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-sm font-semibold mt-3">Connect your Stripe account</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Securely process memberships, class packs, and drop-in payments with Stripe Connect. You'll be redirected to Stripe and brought back here.</p>
              <Button className="mt-4" onClick={handleConnectStripe} disabled={stripeBusy}>
                {stripeBusy ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : null}
                Connect with Stripe
              </Button>
            </div>
          )}
        </StepCard>
      );
      case 10: {
        const checklist = STEPS.slice(0, -1).map((s, i) => ({ label: s.label, ok: done.has(i) }));
        return (
          <StepCard title="Ready to Launch" desc="Review your setup and go live when you are ready">
            <div className="space-y-2">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                  {item.ok ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> : <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />}
                  <span className={`text-sm ${item.ok ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
                  {item.ok && <Badge variant="outline" className="ms-auto text-xs">Done</Badge>}
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Switch checked={discoverable} onCheckedChange={setDiscoverable} />
              <div>
                <Label>List my studio in the public directory</Label>
                <p className="text-xs text-muted-foreground">Students browsing Tandava can find and book your classes.</p>
              </div>
            </div>
            <Separator />
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground mb-4">{done.size} of {STEPS.length - 1} steps completed</p>
              <Button size="lg" className="px-8" onClick={handleLaunch} disabled={launching}>
                {launching ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Rocket className="h-4 w-4 me-2" />}
                Launch Studio
              </Button>
            </div>
          </StepCard>
        );
      }
      default: return null;
    }
  };

  return (
    <ManageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Studio Setup</h1>
          <p className="text-sm text-muted-foreground mt-1">Complete these steps to get your studio up and running. Every step can be skipped and finished later — your progress is saved as you go.</p>
        </div>
        {restoring ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground py-12 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />Restoring your progress…
          </div>
        ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Step indicator */}
          <div className="lg:w-64 shrink-0">
            <Card>
              <CardContent className="p-3">
                <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
                  {STEPS.map((s, i) => {
                    const isCurrent = i === step;
                    const isDone = done.has(i);
                    const Icon = s.icon;
                    return (
                      <button key={s.key} onClick={() => setStep(i)} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-start text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 lg:shrink lg:whitespace-normal w-full ${isCurrent ? "bg-primary text-primary-foreground shadow-sm" : isDone ? "text-foreground hover:bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                        <span className="shrink-0">{isDone && !isCurrent ? <Check className="h-4 w-4 text-primary" /> : <Icon className="h-4 w-4" />}</span>
                        <span className="hidden sm:inline text-xs lg:text-sm">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            <div className="mt-3 px-1">
              <p className="text-xs text-muted-foreground">{done.size} of {STEPS.length - 1} completed</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(done.size / (STEPS.length - 1)) * 100}%` }} />
              </div>
            </div>
          </div>
          {/* Step content */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Step {step + 1} of {STEPS.length}</Badge>
              {done.has(step) && <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Completed</Badge>}
            </div>
            {renderStep()}
            {step < STEPS.length - 1 && (
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
                  <SkipForward className="h-4 w-4 me-1.5" />Skip for now
                </Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save & Continue"}<ChevronRight className="h-4 w-4 ms-1.5" /></Button>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </ManageLayout>
  );
}
