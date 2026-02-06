/**
 * Role & Permission System
 *
 * Three-tier admin model:
 *   1. Platform Admin  — deployed/manages the instance (/admin/...)
 *   2. Studio Owner    — manages their studio (/manage/...)
 *   3. Studio Staff    — front-desk / day-of operations (/staff/...)
 *
 * Members and instructors are NOT admin roles — they use the public app.
 */

import type { UserRole } from "./database";

// ---------------------------------------------------------------------------
// Studio-level roles (stored in studio_members.role)
// ---------------------------------------------------------------------------
export type StudioRole = "owner" | "manager" | "instructor" | "front_desk";

// ---------------------------------------------------------------------------
// Permission definitions
// ---------------------------------------------------------------------------
export type Permission =
  // Platform admin
  | "platform.admin"
  | "platform.manage_studios"
  | "platform.manage_users"
  | "platform.manage_billing"
  | "platform.view_analytics"
  | "platform.send_announcements"
  // Studio management
  | "studio.manage_settings"
  | "studio.manage_schedule"
  | "studio.manage_members"
  | "studio.manage_instructors"
  | "studio.manage_billing"
  | "studio.view_analytics"
  | "studio.view_inbox"
  // Staff
  | "studio.checkin"
  | "studio.manage_waitlist"
  // Member (everyone who is authenticated)
  | "member.book_class"
  | "member.manage_bookings"
  | "member.send_message"
  | "member.view_profile";

// ---------------------------------------------------------------------------
// Role → permissions mapping
// ---------------------------------------------------------------------------
const PLATFORM_ADMIN_PERMISSIONS: Permission[] = [
  "platform.admin",
  "platform.manage_studios",
  "platform.manage_users",
  "platform.manage_billing",
  "platform.view_analytics",
  "platform.send_announcements",
];

const STUDIO_OWNER_PERMISSIONS: Permission[] = [
  "studio.manage_settings",
  "studio.manage_schedule",
  "studio.manage_members",
  "studio.manage_instructors",
  "studio.manage_billing",
  "studio.view_analytics",
  "studio.view_inbox",
  "studio.checkin",
  "studio.manage_waitlist",
];

const STUDIO_MANAGER_PERMISSIONS: Permission[] = [
  "studio.manage_schedule",
  "studio.manage_members",
  "studio.manage_instructors",
  "studio.view_analytics",
  "studio.view_inbox",
  "studio.checkin",
  "studio.manage_waitlist",
];

const STUDIO_FRONT_DESK_PERMISSIONS: Permission[] = [
  "studio.checkin",
  "studio.manage_waitlist",
  "studio.view_inbox",
];

const STUDIO_INSTRUCTOR_PERMISSIONS: Permission[] = [
  "studio.view_analytics", // own classes only
];

const MEMBER_PERMISSIONS: Permission[] = [
  "member.book_class",
  "member.manage_bookings",
  "member.send_message",
  "member.view_profile",
];

/** Get platform-level permissions from a user's profile role */
export function getPermissionsForUserRole(role: UserRole): Permission[] {
  switch (role) {
    case "platform_admin":
      return [...PLATFORM_ADMIN_PERMISSIONS, ...MEMBER_PERMISSIONS];
    case "studio_owner":
      return [...STUDIO_OWNER_PERMISSIONS, ...MEMBER_PERMISSIONS];
    case "studio_staff":
      return [...STUDIO_FRONT_DESK_PERMISSIONS, ...MEMBER_PERMISSIONS];
    case "instructor":
      return [...STUDIO_INSTRUCTOR_PERMISSIONS, ...MEMBER_PERMISSIONS];
    case "member":
    default:
      return [...MEMBER_PERMISSIONS];
  }
}

/** Get studio-level permissions from a studio_members role */
export function getPermissionsForStudioRole(role: StudioRole): Permission[] {
  switch (role) {
    case "owner":
      return STUDIO_OWNER_PERMISSIONS;
    case "manager":
      return STUDIO_MANAGER_PERMISSIONS;
    case "instructor":
      return STUDIO_INSTRUCTOR_PERMISSIONS;
    case "front_desk":
      return STUDIO_FRONT_DESK_PERMISSIONS;
  }
}

/** Check if a set of permissions includes a specific permission */
export function hasPermission(permissions: Permission[], permission: Permission): boolean {
  return permissions.includes(permission);
}

/** Route access configuration */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/admin": "platform.admin",
  "/admin/studios": "platform.manage_studios",
  "/admin/users": "platform.manage_users",
  "/admin/billing": "platform.manage_billing",
  "/admin/analytics": "platform.view_analytics",
  "/admin/announcements": "platform.send_announcements",
  "/manage": "studio.manage_settings",
  "/manage/schedule": "studio.manage_schedule",
  "/manage/members": "studio.manage_members",
  "/manage/instructors": "studio.manage_instructors",
  "/manage/billing": "studio.manage_billing",
  "/manage/analytics": "studio.view_analytics",
  "/manage/inbox": "studio.view_inbox",
  "/staff/checkin": "studio.checkin",
  "/staff/waitlist": "studio.manage_waitlist",
};
