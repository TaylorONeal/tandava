/**
 * Role & Permission System
 *
 * Three-tier admin model:
 *   1. Platform Admin  — deployed/manages the instance (/admin/...)
 *   2. Studio Owner    — manages their studio (/manage/...)
 *   3. Studio Staff    — front-desk / day-of operations (/staff/...)
 *
 * Students and teachers use the public app + their respective portals.
 */

import type { UserRole } from "./database";

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

const STUDIO_ADMIN_PERMISSIONS: Permission[] = [
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

const TEACHER_PERMISSIONS: Permission[] = [
  "studio.view_analytics", // own classes only
];

const MEMBER_PERMISSIONS: Permission[] = [
  "member.book_class",
  "member.manage_bookings",
  "member.send_message",
  "member.view_profile",
];

/** Get permissions from a user's role */
export function getPermissionsForUserRole(role: UserRole): Permission[] {
  switch (role) {
    case "platform_admin":
      return [...PLATFORM_ADMIN_PERMISSIONS, ...STUDIO_OWNER_PERMISSIONS, ...MEMBER_PERMISSIONS];
    case "owner":
      return [...STUDIO_OWNER_PERMISSIONS, ...MEMBER_PERMISSIONS];
    case "admin":
      return [...STUDIO_ADMIN_PERMISSIONS, ...MEMBER_PERMISSIONS];
    case "front_desk":
      return [...STUDIO_FRONT_DESK_PERMISSIONS, ...MEMBER_PERMISSIONS];
    case "teacher":
      return [...TEACHER_PERMISSIONS, ...MEMBER_PERMISSIONS];
    case "student":
    default:
      return [...MEMBER_PERMISSIONS];
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

/** Role hierarchy — higher index = less privilege */
const ROLE_HIERARCHY: UserRole[] = ["platform_admin", "owner", "admin", "teacher", "front_desk", "student"];

/** Check if a role has at least the access level of another role */
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) <= ROLE_HIERARCHY.indexOf(requiredRole);
}
