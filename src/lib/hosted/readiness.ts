export interface StudioReadiness {
  emailVerified: boolean;
  provisioning: 'requested' | 'provisioning' | 'ready' | 'failed';
  domainVerified: boolean;
  timezoneConfigured: boolean;
  hasBookableClass: boolean;
  hasPrice: boolean;
  chargesEnabled: boolean;
  notificationDeliveryVerified: boolean;
  bookingFlowVerified: boolean;
  hostingSubscription: 'none' | 'trialing' | 'active' | 'past_due' | 'canceled';
}

export type LaunchBlocker =
  | 'verify_email' | 'finish_provisioning' | 'verify_domain' | 'set_timezone'
  | 'create_class' | 'set_price' | 'enable_payments' | 'verify_notifications'
  | 'verify_booking_flow' | 'activate_hosting';

/** Evaluate trusted persisted facts, never client-supplied claims of readiness. */
export function getLaunchBlockers(state: StudioReadiness): LaunchBlocker[] {
  const blockers: LaunchBlocker[] = [];
  if (!state.emailVerified) blockers.push('verify_email');
  if (state.provisioning !== 'ready') blockers.push('finish_provisioning');
  if (!state.domainVerified) blockers.push('verify_domain');
  if (!state.timezoneConfigured) blockers.push('set_timezone');
  if (!state.hasBookableClass) blockers.push('create_class');
  if (!state.hasPrice) blockers.push('set_price');
  if (!state.chargesEnabled) blockers.push('enable_payments');
  if (!state.notificationDeliveryVerified) blockers.push('verify_notifications');
  if (!state.bookingFlowVerified) blockers.push('verify_booking_flow');
  // Initial policy: a private setup trial cannot publish paid public bookings.
  if (state.hostingSubscription !== 'active') blockers.push('activate_hosting');
  return blockers;
}

export type ProvisioningStatus = StudioReadiness['provisioning'];
const transitions: Record<ProvisioningStatus, readonly ProvisioningStatus[]> = {
  requested: ['provisioning'],
  provisioning: ['ready', 'failed'],
  failed: ['provisioning'],
  ready: [],
};

/** Persistence must compare-and-set the expected status transactionally. */
export function canTransitionProvisioning(from: ProvisioningStatus, to: ProvisioningStatus): boolean {
  return from === to || transitions[from].includes(to);
}
