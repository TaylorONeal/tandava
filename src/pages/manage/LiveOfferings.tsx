/**
 * /manage/offerings on the live backend: the owner edits classes, class packs
 * and memberships after onboarding (LP-5). Nothing is deleted; "Off" hides a
 * class or price from new bookings and purchases and keeps its history.
 * Price changes apply to the next checkout (prices are read at checkout).
 */
import { useState, type ReactNode } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useStudioCatalog } from "@/hooks/useStudioCatalog";
import {
  BILLING_CYCLES, cycleNoun, emptyMembershipForm, emptyOfferingForm, emptyPackForm, formatPrice, membershipFromForm,
  membershipToForm, offeringFromForm, offeringToForm, packFromForm, packToForm, uniqueSlug,
  type BillingCycle, type CatalogMembership, type CatalogOffering, type CatalogPack, type CatalogTable,
  type MembershipForm, type OfferingForm, type PackForm,
} from "@/lib/hosted/catalog";
import { Clock, Loader2, Pencil, Plus, Users } from "lucide-react";

type Editing =
  | { kind: "offering"; id?: string; form: OfferingForm }
  | { kind: "pack"; id?: string; form: PackForm }
  | { kind: "membership"; id?: string; form: MembershipForm }
  | null;

function Field({ label, id, hint, children }: { label: string; id?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function OffBadge({ active }: { active: boolean | null }) {
  return active === false ? <Badge variant="secondary">Off</Badge> : null;
}

export default function LiveOfferings() {
  const { toast } = useToast();
  const { studio, catalog, isLoading, error, noStudio, save } = useStudioCatalog();
  const [editing, setEditing] = useState<Editing>(null);
  const [saving, setSaving] = useState(false);
  const currency = studio?.currency?.toUpperCase() || "USD";
  const price = (cents: number | null) => formatPrice(cents, currency);

  const submit = async () => {
    if (!editing || !catalog) return;
    let table: CatalogTable;
    let result: { patch?: object; errors?: string[] };
    let extra: Record<string, unknown> = {};
    if (editing.kind === "offering") {
      table = "offerings";
      result = offeringFromForm(editing.form);
      if (!editing.id && result.patch) {
        extra = { slug: uniqueSlug(editing.form.name, catalog.offerings.map((o) => o.slug)) };
      }
    } else if (editing.kind === "pack") {
      table = "class_pack_types";
      result = packFromForm(editing.form);
    } else {
      table = "membership_types";
      result = membershipFromForm(editing.form);
    }
    if (result.errors) {
      toast({ title: "Check the details", description: result.errors.join(" "), variant: "destructive" });
      return;
    }
    setSaving(true);
    const err = await save(table, { ...result.patch, ...extra, ...(editing.id ? { id: editing.id } : {}) });
    setSaving(false);
    if (err) {
      toast({ title: "Not saved", description: err, variant: "destructive" });
      return;
    }
    toast({ title: "Saved" });
    setEditing(null);
  };

  const setForm = <K extends string>(key: K, value: unknown) =>
    setEditing((e) => (e ? ({ ...e, form: { ...e.form, [key]: value } } as Editing) : e));

  let body: ReactNode;
  if (isLoading) {
    body = <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  } else if (noStudio) {
    body = <p className="text-sm text-muted-foreground">Only a studio owner or admin can edit classes and prices.</p>;
  } else if (error || !catalog) {
    body = <p className="text-sm text-destructive">Could not load your classes. Refresh to try again.</p>;
  } else {
    body = (
      <Tabs defaultValue="classes">
        <TabsList>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="pricing">Packs and memberships</TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Length and capacity changes apply to every scheduled class of this type.</p>
            <Button size="sm" onClick={() => setEditing({ kind: "offering", form: emptyOfferingForm() })}>
              <Plus className="h-4 w-4 me-2" />Add class
            </Button>
          </div>
          {catalog.offerings.length === 0 && <p className="text-sm text-muted-foreground">No classes yet. Add your first one.</p>}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalog.offerings.map((o: CatalogOffering) => (
              <Card key={o.id} className={o.is_active === false ? "opacity-60" : undefined}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold">{o.name}</h3>
                    <div className="flex items-center gap-1">
                      <OffBadge active={o.is_active} />
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Edit ${o.name}`}
                        onClick={() => setEditing({ kind: "offering", id: o.id, form: offeringToForm(o) })}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{o.duration_minutes} min</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{o.capacity} spots</span>
                    <span>Drop-in: {price(o.drop_in_price_cents)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6 pt-4">
          <p className="text-sm text-muted-foreground">
            New prices apply to the next purchase. People who already bought keep what they paid for.
          </p>
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-medium">Class packs</h2>
              <Button size="sm" variant="outline" onClick={() => setEditing({ kind: "pack", form: emptyPackForm() })}>
                <Plus className="h-4 w-4 me-2" />Add pack
              </Button>
            </div>
            {catalog.packs.length === 0 && <p className="text-sm text-muted-foreground">No class packs.</p>}
            {catalog.packs.map((p: CatalogPack) => (
              <Card key={p.id} className={p.is_active === false ? "opacity-60" : undefined}>
                <CardContent className="p-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.class_count} classes, valid {p.validity_days} days</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{price(p.price_cents)}</span>
                    <OffBadge active={p.is_active} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Edit ${p.name}`}
                      onClick={() => setEditing({ kind: "pack", id: p.id, form: packToForm(p) })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-medium">Memberships</h2>
              <Button size="sm" variant="outline" onClick={() => setEditing({ kind: "membership", form: emptyMembershipForm() })}>
                <Plus className="h-4 w-4 me-2" />Add membership
              </Button>
            </div>
            {catalog.memberships.length === 0 && <p className="text-sm text-muted-foreground">No memberships.</p>}
            {catalog.memberships.map((m: CatalogMembership) => (
              <Card key={m.id} className={m.is_active === false ? "opacity-60" : undefined}>
                <CardContent className="p-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.classes_per_cycle === null ? "Unlimited" : `${m.classes_per_cycle} classes`} per {cycleNoun(m.billing_cycle)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{price(m.price_cents)}</span>
                    <OffBadge active={m.is_active} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Edit ${m.name}`}
                      onClick={() => setEditing({ kind: "membership", id: m.id, form: membershipToForm(m) })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </TabsContent>
      </Tabs>
    );
  }

  const title = editing
    ? `${editing.id ? "Edit" : "Add"} ${editing.kind === "offering" ? "class" : editing.kind === "pack" ? "class pack" : "membership"}`
    : "";

  return (
    <ManageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classes and pricing</h1>
          <p className="text-sm text-muted-foreground mt-1">What you teach and what it costs.</p>
        </div>
        {body}
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>Nothing is deleted. Turn it off to stop selling or scheduling it.</DialogDescription>
          </DialogHeader>

          {editing?.kind === "offering" && (
            <div className="space-y-4">
              <Field label="Name" id="f-name"><Input id="f-name" value={editing.form.name} onChange={(e) => setForm("name", e.target.value)} /></Field>
              <Field label="Description" id="f-description">
                <Textarea id="f-description" rows={3} value={editing.form.description} onChange={(e) => setForm("description", e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Length (minutes)" id="f-length-minutes">
                  <Input id="f-length-minutes" inputMode="numeric" value={editing.form.duration} onChange={(e) => setForm("duration", e.target.value)} />
                </Field>
                <Field label="Capacity" id="f-capacity">
                  <Input id="f-capacity" inputMode="numeric" value={editing.form.capacity} onChange={(e) => setForm("capacity", e.target.value)} />
                </Field>
              </div>
              <Field label="Drop-in price" id="f-drop-in-price" hint="0 for a free class. Blank if only members and pack holders can book.">
                <Input id="f-drop-in-price" inputMode="decimal" placeholder="25" value={editing.form.dropIn} onChange={(e) => setForm("dropIn", e.target.value)} />
              </Field>
              <div className="flex items-center justify-between">
                <Label htmlFor="offering-active">On</Label>
                <Switch id="offering-active" checked={editing.form.isActive} onCheckedChange={(v) => setForm("isActive", v)} />
              </div>
              {editing.id && !editing.form.isActive && (
                <p className="text-xs text-muted-foreground">Off takes it off the schedule: future classes nobody booked are cancelled. Classes people already booked still run.</p>
              )}
            </div>
          )}

          {editing?.kind === "pack" && (
            <div className="space-y-4">
              <Field label="Name" id="f-name" hint="Blank uses the size, like 10-Class Pack.">
                <Input id="f-name" value={editing.form.name} onChange={(e) => setForm("name", e.target.value)} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Classes" id="f-classes"><Input id="f-classes" inputMode="numeric" value={editing.form.classes} onChange={(e) => setForm("classes", e.target.value)} /></Field>
                <Field label="Price" id="f-price"><Input id="f-price" inputMode="decimal" value={editing.form.price} onChange={(e) => setForm("price", e.target.value)} /></Field>
                <Field label="Valid days" id="f-valid-days"><Input id="f-valid-days" inputMode="numeric" value={editing.form.validDays} onChange={(e) => setForm("validDays", e.target.value)} /></Field>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pack-active">On sale</Label>
                <Switch id="pack-active" checked={editing.form.isActive} onCheckedChange={(v) => setForm("isActive", v)} />
              </div>
            </div>
          )}

          {editing?.kind === "membership" && (
            <div className="space-y-4">
              <Field label="Name" id="f-name"><Input id="f-name" value={editing.form.name} onChange={(e) => setForm("name", e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price" id="f-price"><Input id="f-price" inputMode="decimal" value={editing.form.price} onChange={(e) => setForm("price", e.target.value)} /></Field>
                <Field label="Bills">
                  <Select value={editing.form.cycle} disabled={Boolean(editing.id)} onValueChange={(v) => setForm("cycle", v as BillingCycle)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BILLING_CYCLES.map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Classes per cycle" id="f-classes-per-cycle" hint="Blank for unlimited.">
                <Input id="f-classes-per-cycle" disabled={Boolean(editing.id)} inputMode="numeric" value={editing.form.classesPerCycle} onChange={(e) => setForm("classesPerCycle", e.target.value)} />
              </Field>
              <div className="flex items-center justify-between">
                <Label htmlFor="membership-active">On sale</Label>
                <Switch id="membership-active" checked={editing.form.isActive} onCheckedChange={(v) => setForm("isActive", v)} />
              </div>
              {editing.id && (
                <p className="text-xs text-muted-foreground">Current members keep their price. The new price is for new sign-ups. To change billing or the class limit, add a new membership and turn this one off.</p>
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
