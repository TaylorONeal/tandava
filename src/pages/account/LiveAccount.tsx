/**
 * /account for a signed-in person on the live backend: their real profile,
 * memberships and class packs. Settings that have no backing store yet
 * (notification preferences, saved cards) are not shown rather than faked.
 */
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { data as backendData } from "@/lib/backend";
import { openCustomerPortal } from "@/lib/stripe";
import { profileToForm, formToPatch, toEntitlementView, type MyProfileForm } from "@/lib/myAccount";
import type { MyEntitlementRow } from "@/types/database";
import { Loader2, Package } from "lucide-react";

const FIELDS: { key: keyof MyProfileForm; label: string; type?: string; placeholder?: string }[] = [
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "pronouns", label: "Pronouns", placeholder: "e.g., she/her, he/him, they/them" },
  { key: "dateOfBirth", label: "Date of birth", type: "date" },
  { key: "instagramHandle", label: "Instagram", placeholder: "handle" },
  { key: "emergencyContactName", label: "Emergency contact name" },
  { key: "emergencyContactPhone", label: "Emergency contact phone", type: "tel" },
];

export default function LiveAccount() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MyProfileForm>(() => profileToForm(profile));
  const [saving, setSaving] = useState(false);
  const [portalFor, setPortalFor] = useState<string | null>(null);

  // The profile arrives after first render on a cold load.
  useEffect(() => setForm(profileToForm(profile)), [profile]);

  const { data: entitlements, isLoading, isError } = useQuery({
    queryKey: ["my-entitlements"],
    enabled: Boolean(user),
    queryFn: async (): Promise<MyEntitlementRow[]> => {
      const { data, error } = await backendData.getMyEntitlements();
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const views = (entitlements ?? []).map((e) => toEntitlementView(e));

  const save = async () => {
    if (!user) return;
    const { patch, errors } = formToPatch(form);
    if (errors) {
      toast({ title: "Check your details", description: errors.join(" "), variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await backendData.updateMyProfile(user.id, patch!);
    setSaving(false);
    if (error) {
      toast({ title: "Not saved", description: error.message, variant: "destructive" });
      return;
    }
    await refreshProfile();
    await queryClient.invalidateQueries({ queryKey: ["my-entitlements"] });
    toast({ title: "Profile saved" });
  };

  const manageBilling = async (studioId: string) => {
    setPortalFor(studioId);
    const { error } = await openCustomerPortal(studioId);
    setPortalFor(null);
    if (error) toast({ title: "Billing page unavailable", description: error, variant: "destructive" });
  };

  return (
    <AppLayout>
      <SEOHead title="Account" noindex />
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account</h1>
          <p className="text-muted-foreground mt-1">Your profile, memberships and class packs</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Studios you book with see these details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="acct-email">Email</Label>
              <Input id="acct-email" value={profile?.email ?? user?.email ?? ""} disabled />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label htmlFor={`acct-${f.key}`}>{f.label}</Label>
                  <Input
                    id={`acct-${f.key}`}
                    type={f.type ?? "text"}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving || !user}>
                {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                Save profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memberships and class packs</CardTitle>
            <CardDescription>Across every studio you book with.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : isError ? (
              <p className="text-sm text-muted-foreground">These could not be loaded. Refresh to try again.</p>
            ) : views.length === 0 ? (
              <div className="text-center py-6">
                <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-4">No memberships or class packs yet.</p>
                <Button asChild variant="outline"><a href="/discover">Find a class</a></Button>
              </div>
            ) : (
              views.map((v) => (
                <div key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium">{v.name}</h4>
                      <Badge variant={v.isActive ? "secondary" : "outline"}>{v.statusLabel}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {[v.studioName, v.priceLabel, v.remainingLabel, v.dateLabel].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {v.canManageBilling && (
                    <Button variant="outline" size="sm" onClick={() => manageBilling(v.studioId)} disabled={portalFor === v.studioId}>
                      {portalFor === v.studioId && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                      Manage billing
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
