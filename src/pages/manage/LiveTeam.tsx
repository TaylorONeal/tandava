/**
 * /manage/teachers on a real studio: the owner's team list.
 *
 * Add a person by name and email. They get an invite email, choose a password, and sign in
 * to the Tandava Studio app with that email. All reads and writes go through the
 * `onboarding` edge function, which only answers an active owner.
 */
import { useCallback, useEffect, useId, useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/backend";
import { Loader2, Mail, UserPlus } from "lucide-react";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  canSub: boolean;
  pending: boolean;
}

export const TEAM_ROLES: [string, string, string][] = [
  ["teacher", "Teacher", "Sees their own classes and checks in their students."],
  ["front_desk", "Front desk", "Checks people in at the door and looks up members."],
  ["admin", "Admin", "Manages schedule, members and settings with you."],
  ["sub", "Substitute", "A teacher who can cover classes."],
];
const ROLE_LABEL: Record<string, string> = { owner: "Owner", teacher: "Teacher", front_desk: "Front desk", admin: "Admin" };

/** Shown on the page and reused by the help center, so the steps never drift apart. */
export const TEAM_STEPS = [
  "Tap Add team member. Enter their name, email and role.",
  "They get an email from Tandava. They tap Accept invite and choose a password.",
  "They open the Tandava Studio app and sign in with that email and password.",
] as const;

export function statusOf(member: Pick<TeamMember, "isActive" | "pending">): "Off" | "Invite sent" | "Active" {
  if (!member.isActive) return "Off";
  return member.pending ? "Invite sent" : "Active";
}

export default function LiveTeam() {
  const { toast } = useToast();
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await api.invoke<{ staff: TeamMember[] }>("onboarding", { step: "staff_list" });
    if (error) { setLoadError(error.message); setTeam([]); return; }
    setLoadError(null);
    setTeam(data?.staff ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const act = async (member: TeamMember, step: "staff_set_active" | "staff_resend", data: Record<string, unknown>, done: string) => {
    setBusyId(member.id);
    const { error } = await api.invoke("onboarding", { step, data: { staffId: member.id, ...data } });
    setBusyId(null);
    if (error) { toast({ title: "That didn't work", description: error.message, variant: "destructive" }); return; }
    toast({ title: done });
    void load();
  };

  return (
    <ManageLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Team</h1>
            <p className="text-sm text-muted-foreground mt-1">Teachers and front desk who sign in to the Tandava Studio app.</p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4 me-2" />
            Add team member
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium mb-2">How your team gets in</p>
            <ol className="list-decimal ps-5 space-y-1 text-sm text-muted-foreground">
              {TEAM_STEPS.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <p className="text-xs text-muted-foreground mt-3">
              No email? Ask them to check spam, or tap Resend invite. The app has no sign-up screen: only people you add here can sign in.
            </p>
          </CardContent>
        </Card>

        {team === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading your team</div>
        ) : loadError ? (
          <p role="alert" className="text-sm text-destructive">Couldn't load your team: {loadError}</p>
        ) : (
          <div className="space-y-3">
            {team.map((member) => {
              const status = statusOf(member);
              const isOwner = member.role === "owner";
              return (
                <Card key={member.id}>
                  <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{member.name || member.email}</p>
                      <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{ROLE_LABEL[member.role] ?? member.role}{member.canSub && member.role === "teacher" ? " · can sub" : ""}</Badge>
                      <Badge variant={status === "Active" ? "default" : "outline"}>{status}</Badge>
                      {!isOwner && status === "Invite sent" && (
                        <Button variant="outline" size="sm" disabled={busyId === member.id}
                          onClick={() => act(member, "staff_resend", {}, `Invite sent again to ${member.email}`)}>
                          <Mail className="h-4 w-4 me-1.5" />Resend invite
                        </Button>
                      )}
                      {!isOwner && (
                        <Button variant="ghost" size="sm" disabled={busyId === member.id}
                          onClick={() => act(member, "staff_set_active", { active: !member.isActive }, member.isActive ? `${member.name || member.email} can no longer sign in to your studio` : `${member.name || member.email} is back on the team`)}>
                          {member.isActive ? "Turn off" : "Turn on"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {team.length <= 1 && (
              <p className="text-sm text-muted-foreground">It's just you so far. Add your first teacher or front desk person above.</p>
            )}
          </div>
        )}
      </div>
      <AddDialog open={open} onOpenChange={setOpen} onAdded={load} />
    </ManageLayout>
  );
}

function AddDialog({ open, onOpenChange, onAdded }: { open: boolean; onOpenChange: (open: boolean) => void; onAdded: () => void }) {
  const { toast } = useToast();
  const nameId = useId(); const emailId = useId(); const roleId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("teacher");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) { setError("Enter a name and a valid email."); return; }
    setSaving(true);
    const { data, error: apiError } = await api.invoke<{ emailed?: number }>("onboarding", {
      step: "staff_add", data: { staff: [{ name: name.trim(), email: email.trim(), role }] },
    });
    setSaving(false);
    if (apiError) { setError(apiError.message); return; }
    toast({
      title: `${name.trim()} added`,
      description: data?.emailed
        ? `We emailed an invite to ${email.trim()}.`
        : `${email.trim()} already has a Tandava account, so no invite was needed. They sign in with their usual password.`,
    });
    setName(""); setEmail(""); setRole("teacher");
    onOpenChange(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add team member</DialogTitle>
          <DialogDescription>We email them an invite. They choose a password and sign in to the Tandava Studio app.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor={nameId}>Full name</Label>
            <Input id={nameId} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={emailId}>Email</Label>
            <Input id={emailId} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={roleId}>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id={roleId}><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEAM_ROLES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{TEAM_ROLES.find(([value]) => value === role)?.[2]}</p>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin me-2" />}Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
