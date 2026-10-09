/**
 * /manage/schedule on the live backend: the studio's weekly classes (schedule
 * rules). Saving a rule regenerates the next 8 weeks (00036/00037). Classes
 * that already have bookings keep their time, so nobody is moved silently.
 */
import { useState, type ReactNode } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useStudioCatalog } from "@/hooks/useStudioCatalog";
import {
  WEEKDAYS, dayLabel, formatTime, pickableLocations, recurrenceNote, ruleEndTime, ruleFromForm, ruleToForm, rulesByDay,
  type CatalogRule, type RuleForm, type Weekday,
} from "@/lib/hosted/catalog";
import { Link } from "react-router-dom";
import { Loader2, Pencil, Plus } from "lucide-react";

const NO_TEACHER = "none";

function Field({ label, id, children }: { label: string; id?: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label>{children}</div>;
}

export default function LiveSchedule() {
  const { toast } = useToast();
  const { catalog, staff, isLoading, error, noStudio, save } = useStudioCatalog();
  const [editing, setEditing] = useState<{ id?: string; form: RuleForm } | null>(null);
  const [saving, setSaving] = useState(false);

  const offerings = catalog?.offerings ?? [];
  const activeOfferings = offerings.filter((o) => o.is_active !== false);
  const locations = catalog?.locations ?? [];
  const openLocations = pickableLocations(locations);
  const primaryLocation = openLocations.find((l) => l.is_primary) ?? openLocations[0];
  const offeringName = (id: string) => offerings.find((o) => o.id === id)?.name ?? "Class";
  const teacherName = (id: string | null) => (id ? staff.find((s) => s.profile_id === id)?.name ?? "Teacher" : null);

  const startNew = () =>
    setEditing({
      form: {
        offeringId: activeOfferings[0]?.id ?? "",
        day: "monday",
        start: "09:00",
        teacherId: "",
        locationId: primaryLocation?.id ?? "",
        isActive: true,
      },
    });

  const setForm = (key: keyof RuleForm, value: unknown) =>
    setEditing((e) => (e ? { ...e, form: { ...e.form, [key]: value } } : e));

  const submit = async () => {
    if (!editing) return;
    const { patch, errors } = ruleFromForm(editing.form, offerings);
    if (errors) {
      toast({ title: "Check the details", description: errors.join(" "), variant: "destructive" });
      return;
    }
    setSaving(true);
    const err = await save("schedule_rules", { ...patch, ...(editing.id ? { id: editing.id } : {}) });
    setSaving(false);
    if (err) {
      toast({ title: "Not saved", description: err, variant: "destructive" });
      return;
    }
    toast({ title: "Schedule saved", description: "The next 8 weeks are updated." });
    setEditing(null);
  };

  const editingOffering = editing ? offerings.find((o) => o.id === editing.form.offeringId) : undefined;

  let body: ReactNode;
  if (isLoading) {
    body = <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  } else if (noStudio) {
    body = <p className="text-sm text-muted-foreground">Only a studio owner or admin can edit the schedule.</p>;
  } else if (error || !catalog) {
    body = <p className="text-sm text-destructive">Could not load your schedule. Refresh to try again.</p>;
  } else if (activeOfferings.length === 0 && catalog.rules.length === 0) {
    body = (
      <p className="text-sm text-muted-foreground">
        Add a class first in <Link className="underline" to="/manage/offerings">Classes and pricing</Link>, then put it on the schedule.
      </p>
    );
  } else {
    const groups = rulesByDay(catalog.rules);
    body = (
      <div className="space-y-5">
        {groups.length === 0 && <p className="text-sm text-muted-foreground">Nothing on the weekly schedule yet.</p>}
        {groups.map((g) => (
          <section key={g.day} className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">{dayLabel(g.day)}</h2>
            {g.rules.map((r: CatalogRule) => (
              <Card key={r.id} className={r.is_active === false ? "opacity-60" : undefined}>
                <CardContent className="p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {formatTime(r.start_time)} to {formatTime(r.end_time)} · {offeringName(r.offering_id)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[recurrenceNote(r.recurrence), teacherName(r.teacher_id), locations.length > 1 ? locations.find((l) => l.id === r.location_id)?.name : null]
                        .filter(Boolean).join(" · ") || "No teacher set"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {r.is_active === false && <Badge variant="secondary">Off</Badge>}
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit class time"
                      onClick={() => setEditing({ id: r.id, form: ruleToForm(r) })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        ))}
      </div>
    );
  }

  return (
    <ManageLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Weekly schedule</h1>
            <p className="text-sm text-muted-foreground mt-1">Classes repeat every week and are bookable 8 weeks ahead.</p>
          </div>
          {catalog && activeOfferings.length > 0 && (
            <Button size="sm" onClick={startNew}><Plus className="h-4 w-4 me-2" />Add weekly class</Button>
          )}
        </div>
        {body}
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit weekly class" : "Add weekly class"}</DialogTitle>
            <DialogDescription>
              Classes that already have bookings keep their time and teacher. Everything else updates.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <Field label="Class">
                <Select value={editing.form.offeringId} onValueChange={(v) => setForm("offeringId", v)}>
                  <SelectTrigger><SelectValue placeholder="Pick a class" /></SelectTrigger>
                  <SelectContent>
                    {offerings
                      .filter((o) => o.is_active !== false || o.id === editing.form.offeringId)
                      .map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Day">
                  <Select value={editing.form.day} onValueChange={(v) => setForm("day", v as Weekday)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map((d) => <SelectItem key={d} value={d}>{dayLabel(d)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Starts" id="f-starts">
                  <Input id="f-starts" type="time" value={editing.form.start} onChange={(e) => setForm("start", e.target.value)} />
                </Field>
              </div>
              {editingOffering && /^\d{2}:\d{2}$/.test(editing.form.start) && (
                <p className="text-xs text-muted-foreground">
                  Ends {formatTime(ruleEndTime(editing.form.start, editingOffering.duration_minutes))} ({editingOffering.duration_minutes} min)
                </p>
              )}
              <Field label="Teacher">
                <Select value={editing.form.teacherId || NO_TEACHER} onValueChange={(v) => setForm("teacherId", v === NO_TEACHER ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_TEACHER}>No teacher set</SelectItem>
                    {staff.map((s) => <SelectItem key={s.profile_id} value={s.profile_id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              {pickableLocations(locations, editing.id ? editing.form.locationId : undefined).length > 1 && (
                <Field label="Location">
                  <Select value={editing.form.locationId} onValueChange={(v) => setForm("locationId", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {pickableLocations(locations, editing.id ? editing.form.locationId : undefined)
                        .map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <div className="flex items-center justify-between">
                <Label htmlFor="rule-active">On the schedule</Label>
                <Switch id="rule-active" checked={editing.form.isActive} onCheckedChange={(v) => setForm("isActive", v)} />
              </div>
              {editing.id && !editing.form.isActive && (
                <p className="text-xs text-muted-foreground">Future classes nobody booked are cancelled. Booked ones stay.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManageLayout>
  );
}
