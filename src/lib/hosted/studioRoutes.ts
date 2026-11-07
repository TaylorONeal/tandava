import { hasPermission, type Permission } from '@/types/roles';

// Only screens with a real data/action contract belong in the hosted workspace.
// Demo screens remain available through the explicit demo experience.
const liveStudioRoutes: Record<string, Permission | null> = {
  '/manage': 'studio.manage_schedule',
  '/manage/schedule': 'studio.manage_schedule',
  '/manage/offerings': 'studio.manage_schedule',
  '/manage/onboarding': null,
  '/manage/settings': 'studio.manage_settings',
  '/manage/import': 'studio.manage_settings',
  '/manage/share': 'studio.manage_settings',
  '/manage/embed': 'studio.manage_settings',
  '/manage/automations': 'studio.manage_members',
  '/manage/analytics/sources': 'studio.manage_members',
};

export function isLiveStudioRoute(path: string): boolean {
  return Object.prototype.hasOwnProperty.call(liveStudioRoutes, path.replace(/\/+$/, '') || '/');
}

export function canOpenLiveStudioRoute(path: string, permissions: Permission[]): boolean {
  const route = path.replace(/\/+$/, '') || '/';
  if (!isLiveStudioRoute(route)) return false;
  const permission = liveStudioRoutes[route];
  return permission === null || hasPermission(permissions, permission);
}
