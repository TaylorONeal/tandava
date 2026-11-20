/** Wording and small rules for the owner's Team page. Pure, so it is easy to test. */

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  canSub: boolean;
  pending: boolean;
  upcomingClasses: number;
}

export interface TeamEvent { id: string; action: string; description: string; by: string; who: string; at: string }

/** What the owner is told before turning someone off. Plain facts, no surprises afterwards. */
export function offboardingSummary(member: Pick<TeamMember, "name" | "email" | "upcomingClasses">): string[] {
  const who = member.name || member.email;
  return [
    `${who} loses access to your studio right away, on the web and in the Tandava Studio app.`,
    member.upcomingClasses > 0
      ? `${member.upcomingClasses} upcoming ${member.upcomingClasses === 1 ? "class" : "classes"} they were due to teach will show "No teacher set". Pick a new teacher in Schedule.`
      : "They have no upcoming classes to hand over.",
    "Their past classes, check-ins and pay history stay in your records.",
    "The change is written to your team history with your name and the time.",
  ];
}

/** Role line for one person, including the two "nothing yet" states. */
export function assignmentNote(member: Pick<TeamMember, "role" | "isActive" | "pending" | "upcomingClasses">): string | null {
  if (!member.isActive) return null;
  if (member.role !== "teacher") return null;
  if (member.upcomingClasses > 0) return `${member.upcomingClasses} upcoming ${member.upcomingClasses === 1 ? "class" : "classes"}`;
  return member.pending ? "No classes assigned yet. You can assign them before they sign in." : "No classes assigned yet";
}

export const TEAM_ROLES: [string, string, string][] = [
  ["teacher", "Teacher", "Sees their own classes and checks in their students."],
  ["front_desk", "Front desk", "Checks people in at the door and looks up members."],
  ["admin", "Admin", "Manages schedule, members and settings with you."],
  ["sub", "Substitute", "A teacher who can cover classes."],
];

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
