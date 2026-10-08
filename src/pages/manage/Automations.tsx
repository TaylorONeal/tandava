import { useEffect, useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HelpTip } from "@/components/help/HelpTip";
import { useToast } from "@/hooks/use-toast";
import { useMyStudio } from "@/hooks/useBooking";
import { useAutomationSettings, useSaveAutomationSettings } from "@/hooks/useAttribution";
import { isBackendConfigured } from "@/lib/backend";
import { safeUrl } from "@/lib/marketing/automationEmails";
import { Loader2, Mail } from "lucide-react";

interface FormState {
  guestToMember: boolean;
  firstVisit: boolean;
  lapsed: boolean;
  lapsedMode: "smart" | "fixed";
  lapsedDays: string;
  introOfferUrl: string;
}

const DEFAULTS: FormState = {
  guestToMember: true,
  firstVisit: true,
  lapsed: true,
  lapsedMode: "smart",
  lapsedDays: "21",
  introOfferUrl: "",
};

const AUTOMATIONS = [
  {
    key: "guestToMember" as const,
    help: "automation-guest-to-member",
    title: "Guest follow-up",
    summary: "A day after a guest books: save your details. Two days later: your intro offer.",
  },
  {
    key: "firstVisit" as const,
    help: "automation-first-visit",
    title: "First-visit welcome",
    summary: "A few hours after a first class: a short welcome. Three days later: your intro offer.",
  },
  {
    key: "lapsed" as const,
    help: "automation-lapsed",
    title: "Lapsed check-in",
    summary: "One email when a regular stops coming. Once per lapse, not a series.",
  },
];

export default function Automations() {
  const live = isBackendConfigured();
  const { toast } = useToast();
  const { data: studio } = useMyStudio();
  const { data: saved, isLoading } = useAutomationSettings(studio?.studio_id);
  const save = useSaveAutomationSettings();
  const [form, setForm] = useState<FormState>(DEFAULTS);

  useEffect(() => {
    if (!saved) return;
    setForm({
      guestToMember: saved.guest_to_member_enabled,
      firstVisit: saved.first_visit_enabled,
      lapsed: saved.lapsed_enabled,
      lapsedMode: saved.lapsed_days_override ? "fixed" : "smart",
      lapsedDays: String(saved.lapsed_days_override ?? 21),
      introOfferUrl: saved.intro_offer_url ?? "",
    });
  }, [saved]);

  const days = Number(form.lapsedDays);
  const daysValid = form.lapsedMode === "smart" || (Number.isInteger(days) && days >= 7 && days <= 120);
  const urlValid = !form.introOfferUrl.trim() || safeUrl(form.introOfferUrl.trim(), "") !== "";

  const onSave = async () => {
    if (!studio?.studio_id || !daysValid || !urlValid) return;
    try {
      await save.mutateAsync({
        studio_id: studio.studio_id,
        guest_to_member_enabled: form.guestToMember,
        first_visit_enabled: form.firstVisit,
        lapsed_enabled: form.lapsed,
        lapsed_days_override: form.lapsedMode === "fixed" ? days : null,
        intro_offer_url: form.introOfferUrl.trim() || null,
      });
      toast({ title: "Saved", description: "Automations will use these settings from the next hourly run." });
    } catch (e) {
      toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <ManageLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Automations</h1>
            <HelpTip id="marketing-automation" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Three emails that send themselves, in your studio's name. The defaults work without changes.
          </p>
          {!live && <Badge variant="secondary" className="mt-2">Preview: nothing is saved or sent</Badge>}
        </div>

        <Card>
          <CardContent className="pt-5 text-sm text-muted-foreground space-y-1">
            <p className="flex items-center gap-2 text-foreground font-medium">
              <Mail className="h-4 w-4" aria-hidden="true" /> Rules every automation follows
            </p>
            <p>Only people who said yes to your emails. Never between 9pm and 8am your time. At most one a day per person.</p>
            <p>Every email has a one-click unsubscribe, and replies go to the email on your studio profile.</p>
          </CardContent>
        </Card>

        {AUTOMATIONS.map((a) => (
          <Card key={a.key}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base flex items-center gap-1">
                    {a.title} <HelpTip id={a.help} />
                  </CardTitle>
                  <CardDescription>{a.summary}</CardDescription>
                </div>
                <Switch
                  checked={form[a.key]}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, [a.key]: v }))}
                  aria-label={`${a.title} on or off`}
                />
              </div>
            </CardHeader>
            {a.key === "lapsed" && form.lapsed && (
              <CardContent className="space-y-3">
                <RadioGroup
                  value={form.lapsedMode}
                  onValueChange={(v) => setForm((f) => ({ ...f, lapsedMode: v as FormState["lapsedMode"] }))}
                >
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="smart" id="lapsed-smart" className="mt-1" />
                    <Label htmlFor="lapsed-smart" className="font-normal leading-snug">
                      <span className="font-medium">Smart default (recommended)</span>
                      <span className="block text-muted-foreground text-sm">
                        Twice each person's usual gap between classes, 14 to 45 days.
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="fixed" id="lapsed-fixed" className="mt-1" />
                    <Label htmlFor="lapsed-fixed" className="font-normal leading-snug">
                      <span className="font-medium">Same number of days for everyone</span>
                    </Label>
                  </div>
                </RadioGroup>
                {form.lapsedMode === "fixed" && (
                  <div className="flex items-center gap-2 pl-6">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={7}
                      max={120}
                      className="w-24"
                      value={form.lapsedDays}
                      onChange={(e) => setForm((f) => ({ ...f, lapsedDays: e.target.value }))}
                      aria-label="Days without a visit"
                      aria-invalid={!daysValid}
                    />
                    <span className="text-sm text-muted-foreground">days without a visit</span>
                  </div>
                )}
                {!daysValid && <p className="text-xs text-destructive pl-6">Pick a number from 7 to 120.</p>}
              </CardContent>
            )}
          </Card>
        ))}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-1">
              Intro offer link <HelpTip id="automation-intro-offer" />
            </CardTitle>
            <CardDescription>Optional. Used by the guest follow-up and the first-visit welcome.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <Input
              type="url"
              inputMode="url"
              placeholder="https://"
              value={form.introOfferUrl}
              onChange={(e) => setForm((f) => ({ ...f, introOfferUrl: e.target.value }))}
              aria-label="Intro offer link"
              aria-invalid={!urlValid}
            />
            {!urlValid && <p className="text-xs text-destructive">Use a full link starting with https://</p>}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={() => void onSave()} disabled={!live || !studio || isLoading || save.isPending || !daysValid || !urlValid}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Save"}
          </Button>
          <span className="text-xs text-muted-foreground">Owners and admins can change these.</span>
        </div>
      </div>
    </ManageLayout>
  );
}
