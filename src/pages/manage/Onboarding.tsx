import { useState } from "react";
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
import { api, isBackendConfigured } from "@/lib/backend";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import {
  Building2, MapPin, Palette, Tag, CalendarClock, DollarSign, Users,
  ShieldCheck, Upload, CreditCard, Rocket, Check, ChevronRight,
  SkipForward, ExternalLink, CheckCircle2, Circle,
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

export default function Onboarding() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [f, setF] = useState<Record<string, string>>({
    timezone: "America/Los_Angeles", currency: "USD", rooms: "Main Studio, Hot Room",
    classStyle: "vinyasa", classLevel: "all", classDuration: "60", classCapacity: "25",
    classPrice: "25", schedDay: "monday", schedTime: "09:00", memberCycle: "monthly",
    packClasses: "10", teacherRole: "teacher", payType: "per_class",
    waiverName: "Liability Waiver", primaryColor: "#4fd1c5", secondaryColor: "#f687b3",
  });
  const [memberUnlimited, setMemberUnlimited] = useState(true);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [key]: e.target.value }));
  const sel = (key: string) => (val: string) => setF((p) => ({ ...p, [key]: val }));

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Persist the step server-side when a backend is configured; demo just advances.
    if (isBackendConfigured()) {
      setSaving(true);
      const { error } = await api.invoke("onboarding", {
        step: STEPS[step].key,
        data: { ...f, memberUnlimited },
      });
      setSaving(false);
      if (error) {
        toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
        return;
      }
    }
    setDone((prev) => new Set([...prev, step]));
    toast({ title: `${STEPS[step].label} saved`, description: "Your progress has been saved." });
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleSkip = () => { if (step < STEPS.length - 1) setStep(step + 1); };

  const Field = ({ label, id, ...props }: { label: string; id: string; placeholder?: string; type?: string }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={f[id] ?? ""} onChange={set(id)} {...props} />
    </div>
  );

  const Sel = ({ label, id, options, placeholder }: { label: string; id: string; options: [string, string][]; placeholder?: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={f[id] ?? ""} onValueChange={sel(id)}>
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <StepCard title="Studio Information" desc="Tell us about your studio to get started">
          <Field label="Studio Name" id="studioName" placeholder="e.g. Tandava Yoga" />
          <div className="space-y-2">
            <Label htmlFor="studioDesc">Description</Label>
            <Textarea id="studioDesc" placeholder="A brief description of your studio..." value={f.studioDesc ?? ""} onChange={set("studioDesc")} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Sel label="Timezone" id="timezone" options={[["America/New_York","Eastern (ET)"],["America/Chicago","Central (CT)"],["America/Denver","Mountain (MT)"],["America/Los_Angeles","Pacific (PT)"]]} />
            <Sel label="Currency" id="currency" options={[["USD","USD ($)"],["EUR","EUR"],["GBP","GBP"],["CAD","CAD"]]} />
          </div>
        </StepCard>
      );
      case 1: return (
        <StepCard title="Location" desc="Where is your studio located?">
          <Field label="Street Address" id="address" placeholder="123 Main St, San Francisco, CA 94105" />
          <Field label="Rooms (comma-separated)" id="rooms" placeholder="Main Studio, Hot Room" />
          <Field label="Amenities" id="amenities" placeholder="Showers, Mat Rentals, Changing Rooms, Lockers" />
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
          <Field label="Class Name" id="className" placeholder="e.g. Morning Vinyasa" />
          <div className="grid grid-cols-2 gap-4">
            <Sel label="Style" id="classStyle" options={[["vinyasa","Vinyasa"],["hatha","Hatha"],["yin","Yin"],["power","Power"],["restorative","Restorative"]]} />
            <Sel label="Level" id="classLevel" options={[["all","All Levels"],["beginner","Beginner"],["intermediate","Intermediate"],["advanced","Advanced"]]} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Duration (min)" id="classDuration" type="number" />
            <Field label="Capacity" id="classCapacity" type="number" />
            <Field label="Drop-in Price ($)" id="classPrice" type="number" />
          </div>
        </StepCard>
      );
      case 4: return (
        <StepCard title="Set Up a Recurring Class" desc="Add your first class to the weekly schedule">
          <div className="grid grid-cols-2 gap-4">
            <Sel label="Offering" id="schedOffering" placeholder="Select a class" options={[["morning-vinyasa","Morning Vinyasa"],["gentle-flow","Gentle Flow"],["power-yoga","Power Yoga"]]} />
            <Sel label="Teacher" id="schedTeacher" placeholder="Select a teacher" options={[["maya","Maya Patel"],["james","James Liu"],["sarah","Sarah Chen"]]} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Sel label="Day" id="schedDay" options={DAYS.map((d) => [d.toLowerCase(), d])} />
            <Field label="Time" id="schedTime" type="time" />
            <Sel label="Room" id="schedRoom" placeholder="Select room" options={[["main","Main Studio"],["hot","Hot Room"],["meditation","Meditation Room"]]} />
          </div>
        </StepCard>
      );
      case 5: return (
        <StepCard title="Pricing Plans" desc="Create membership types and class packs">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Membership</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Membership Name" id="memberName" placeholder="e.g. Unlimited Monthly" />
            <Sel label="Billing Cycle" id="memberCycle" options={[["monthly","Monthly"],["quarterly","Quarterly"],["annual","Annual"]]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price ($)" id="memberPrice" type="number" placeholder="149" />
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={memberUnlimited} onCheckedChange={setMemberUnlimited} />
              <Label>Unlimited classes</Label>
            </div>
          </div>
          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Class Pack</p>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Pack Name" id="packName" placeholder="e.g. 10-Class Pack" />
            <Field label="Classes" id="packClasses" type="number" />
            <Field label="Price ($)" id="packPrice" type="number" placeholder="200" />
          </div>
        </StepCard>
      );
      case 6: return (
        <StepCard title="Invite a Teacher" desc="Add your first staff member to the platform">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" id="teacherName" placeholder="Maya Patel" />
            <Field label="Email" id="teacherEmail" placeholder="maya@tandava.yoga" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Sel label="Role" id="teacherRole" options={[["teacher","Teacher"],["sub","Substitute"],["admin","Admin"]]} />
            <Sel label="Pay Type" id="payType" options={[["per_class","Per Class"],["hourly","Hourly"],["salary","Salary"]]} />
            <Field label="Pay Rate ($)" id="payRate" type="number" placeholder="75" />
          </div>
        </StepCard>
      );
      case 7: return (
        <StepCard title="Liability Waiver" desc="Create a waiver that students must sign before their first class">
          <Field label="Waiver Name" id="waiverName" />
          <div className="space-y-2">
            <Label htmlFor="waiverContent">Waiver Content</Label>
            <Textarea id="waiverContent" rows={8} placeholder="I acknowledge that yoga involves physical activity and that I participate at my own risk..." value={f.waiverContent ?? ""} onChange={set("waiverContent")} />
            <p className="text-xs text-muted-foreground">Students will be required to agree to this waiver before booking.</p>
          </div>
        </StepCard>
      );
      case 8: return (
        <StepCard title="Import Existing Data" desc="Migrate students, schedules, and memberships from another platform">
          <p className="text-sm text-muted-foreground">If you have existing data from Mindbody, Momoyoga, or another platform, you can import it now or come back later.</p>
          <Button variant="outline" asChild>
            <Link to="/manage/import"><ExternalLink className="h-4 w-4 mr-2" />Go to Import Tool</Link>
          </Button>
        </StepCard>
      );
      case 9: return (
        <StepCard title="Connect Stripe" desc="Enable payment processing for your studio">
          <div className="p-6 rounded-xl border-2 border-dashed border-border text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="text-sm font-semibold mt-3">Connect your Stripe account</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Securely process memberships, class packs, and drop-in payments with Stripe Connect.</p>
            <Button className="mt-4">Connect with Stripe</Button>
          </div>
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
                  {item.ok && <Badge variant="outline" className="ml-auto text-xs">Done</Badge>}
                </div>
              ))}
            </div>
            <Separator />
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground mb-4">{done.size} of {STEPS.length - 1} steps completed</p>
              <Button size="lg" className="px-8" onClick={() => toast({ title: "Studio launched!", description: "Your studio is now live. Welcome to Tandava!" })}>
                <Rocket className="h-4 w-4 mr-2" />Launch Studio
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
          <p className="text-sm text-muted-foreground mt-1">Complete these steps to get your studio up and running</p>
        </div>
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
                      <button key={s.key} onClick={() => setStep(i)} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 lg:shrink lg:whitespace-normal w-full ${isCurrent ? "bg-primary text-primary-foreground shadow-sm" : isDone ? "text-foreground hover:bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
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
                  <SkipForward className="h-4 w-4 mr-1.5" />Skip for now
                </Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save & Continue"}<ChevronRight className="h-4 w-4 ml-1.5" /></Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ManageLayout>
  );
}

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
