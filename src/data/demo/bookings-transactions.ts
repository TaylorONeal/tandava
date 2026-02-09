/**
 * OXATL YOGA - Demo Bookings & Transactions
 *
 * Historical demo data starting late January 2018.
 * Simulates realistic studio growth over time.
 *
 * TO REMOVE FOR PRODUCTION:
 * Delete the entire src/data/demo/ directory
 */

import type { BookingStatus, TransactionStatus, TransactionType } from '@/types/database';
import {
  OXATL_STUDIO,
  OXATL_MEMBERS,
  OXATL_TEACHERS,
  OXATL_SCHEDULE,
  OXATL_CLASS_TYPES,
  OXATL_LOCATIONS,
  OXATL_MEMBERSHIP_TYPES,
  OXATL_CLASS_PACK_TYPES,
  OXATL_WORKSHOP_TEMPLATES,
} from './oxatl-yoga';

// ============================================================================
// DEMO TIME RANGE
// ============================================================================

// Demo starts late January 2018
export const DEMO_START_DATE = new Date('2018-01-22');
export const DEMO_END_DATE = new Date('2018-12-31');

// Current "demo date" - end of the demo period
export const DEMO_CURRENT_DATE = DEMO_END_DATE;

// ============================================================================
// BOOKING TYPES
// ============================================================================

export interface DemoBooking {
  id: string;
  studio_id: string;
  profile_id: string;
  class_occurrence_id: string;
  class_type_id: string;
  teacher_id: string;
  location_id: string;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time: string; // HH:MM
  status: BookingStatus;
  booked_at: string;
  checked_in_at: string | null;
  cancelled_at: string | null;
  waitlist_position: number | null;
}

export interface DemoTransaction {
  id: string;
  studio_id: string;
  profile_id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount_cents: number;
  description: string;
  membership_type_id: string | null;
  class_pack_type_id: string | null;
  event_id: string | null;
  payment_method: string;
  stripe_payment_intent_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface DemoClassOccurrence {
  id: string;
  schedule_slot_index: number;
  date: string;
  start_time: string;
  end_time: string;
  class_type_id: string;
  teacher_id: string;
  location_id: string;
  capacity: number;
  booked_count: number;
  checked_in_count: number;
  is_cancelled: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function randomId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateTime(date: Date): string {
  return date.toISOString();
}

function getDayOfWeek(date: Date): number {
  return date.getDay(); // 0 = Sunday, 1 = Monday, etc.
}

const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

// ============================================================================
// GENERATE CLASS OCCURRENCES
// ============================================================================

function generateClassOccurrences(): DemoClassOccurrence[] {
  const occurrences: DemoClassOccurrence[] = [];
  let currentDate = new Date(DEMO_START_DATE);

  while (currentDate <= DEMO_END_DATE) {
    const dayOfWeek = getDayOfWeek(currentDate);
    const dateStr = formatDate(currentDate);

    // Find all schedule slots for this day
    OXATL_SCHEDULE.forEach((slot, index) => {
      if (DAY_MAP[slot.day] === dayOfWeek) {
        const classType = OXATL_CLASS_TYPES.find(c => c.id === slot.class_type_id);
        const location = OXATL_LOCATIONS.find(l => l.id === slot.location_id);

        // Calculate end time (add duration)
        const [startHour, startMin] = slot.time.split(':').map(Number);
        const duration = classType?.duration_minutes ?? 60;
        const endHour = Math.floor((startHour * 60 + startMin + duration) / 60);
        const endMin = (startHour * 60 + startMin + duration) % 60;
        const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

        // ~5% chance class is cancelled
        const isCancelled = Math.random() < 0.05;

        occurrences.push({
          id: `occ-${dateStr}-${index}`,
          schedule_slot_index: index,
          date: dateStr,
          start_time: slot.time,
          end_time: endTime,
          class_type_id: slot.class_type_id,
          teacher_id: slot.teacher_id,
          location_id: slot.location_id,
          capacity: classType?.default_capacity ?? 25,
          booked_count: 0, // Will be updated when generating bookings
          checked_in_count: 0,
          is_cancelled: isCancelled,
        });
      }
    });

    currentDate = addDays(currentDate, 1);
  }

  return occurrences;
}

// ============================================================================
// GENERATE BOOKINGS
// ============================================================================

function generateBookings(occurrences: DemoClassOccurrence[]): DemoBooking[] {
  const bookings: DemoBooking[] = [];

  // Get active members (those with memberships or class packs)
  const activeMembers = OXATL_MEMBERS.filter(
    m => m.membership_type_id || m.class_pack_type_id
  );

  occurrences.forEach(occ => {
    if (occ.is_cancelled) return;

    // Simulate realistic class fill rates
    // Early 2018: lower attendance (studio is newer)
    // Later in year: higher attendance as studio grows
    const occDate = new Date(occ.date);
    const monthsFromStart = (occDate.getTime() - DEMO_START_DATE.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const growthFactor = Math.min(1, 0.4 + (monthsFromStart * 0.06)); // 40% -> 100% over year

    // Base fill rate varies by class type and time
    let baseFillRate = 0.6;
    if (occ.start_time === '07:00') baseFillRate = 0.5; // Early morning less full
    if (occ.start_time === '18:00') baseFillRate = 0.8; // Evening popular
    if (occ.start_time === '09:00' && getDayOfWeek(occDate) === 6) baseFillRate = 0.85; // Saturday morning

    const fillRate = baseFillRate * growthFactor;
    const targetBookings = Math.floor(occ.capacity * fillRate * (0.8 + Math.random() * 0.4));

    // Shuffle members and pick some for this class
    const shuffledMembers = [...activeMembers].sort(() => Math.random() - 0.5);
    const classMembers = shuffledMembers.slice(0, Math.min(targetBookings, occ.capacity));

    classMembers.forEach((member, idx) => {
      const bookedAt = new Date(occDate);
      bookedAt.setDate(bookedAt.getDate() - randomInt(0, 7)); // Booked 0-7 days before
      bookedAt.setHours(randomInt(6, 22), randomInt(0, 59));

      // Determine status
      let status: BookingStatus = 'confirmed';
      let checkedInAt: string | null = null;
      let cancelledAt: string | null = null;
      let waitlistPosition: number | null = null;

      const isInPast = occDate < DEMO_CURRENT_DATE;

      if (isInPast) {
        const rand = Math.random();
        const [startH, startM] = occ.start_time.split(':').map(Number);
        if (rand < 0.75) {
          // 75% checked in
          status = 'checked_in';
          const checkIn = new Date(occDate);
          checkIn.setHours(startH, startM - randomInt(0, 15)); // Check in 0-15 min before
          checkedInAt = formatDateTime(checkIn);
        } else if (rand < 0.85) {
          // 10% cancelled
          status = 'cancelled';
          const cancel = new Date(bookedAt);
          cancel.setDate(cancel.getDate() + randomInt(0, 3));
          cancelledAt = formatDateTime(cancel);
        } else if (rand < 0.92) {
          // 7% late cancel
          status = 'late_cancel';
          const cancel = new Date(occDate);
          cancel.setHours(startH - randomInt(1, 6), randomInt(0, 59));
          cancelledAt = formatDateTime(cancel);
        } else {
          // 8% no show
          status = 'no_show';
        }
      } else {
        // Future bookings
        if (idx >= occ.capacity) {
          status = 'waitlisted';
          waitlistPosition = idx - occ.capacity + 1;
        }
      }

      bookings.push({
        id: `booking-${occ.id}-${idx}`,
        studio_id: OXATL_STUDIO.id,
        profile_id: member.profile.id,
        class_occurrence_id: occ.id,
        class_type_id: occ.class_type_id,
        teacher_id: occ.teacher_id,
        location_id: occ.location_id,
        scheduled_date: occ.date,
        scheduled_time: occ.start_time,
        status,
        booked_at: formatDateTime(bookedAt),
        checked_in_at: checkedInAt,
        cancelled_at: cancelledAt,
        waitlist_position: waitlistPosition,
      });

      // Update occurrence counts
      if (status === 'checked_in') {
        occ.checked_in_count++;
        occ.booked_count++;
      } else if (status === 'confirmed' || status === 'no_show' || status === 'late_cancel') {
        occ.booked_count++;
      }
    });
  });

  return bookings;
}

// ============================================================================
// GENERATE TRANSACTIONS
// ============================================================================

function generateTransactions(): DemoTransaction[] {
  const transactions: DemoTransaction[] = [];

  // Generate transactions for each member based on their membership/pack
  OXATL_MEMBERS.forEach((member, memberIdx) => {
    const joinDate = new Date(member.joined_at);

    // Skip if joined before demo period
    if (joinDate < DEMO_START_DATE) {
      // Adjust join date to be within demo period
      const adjustedJoin = new Date(DEMO_START_DATE);
      adjustedJoin.setDate(adjustedJoin.getDate() + randomInt(0, 300));
      if (adjustedJoin > DEMO_END_DATE) return;
      member.joined_at = formatDateTime(adjustedJoin);
    }

    const txDate = new Date(member.joined_at);

    if (member.membership_type_id) {
      const memType = OXATL_MEMBERSHIP_TYPES.find(m => m.id === member.membership_type_id);
      if (!memType) return;

      // Initial membership purchase
      transactions.push({
        id: `tx-mem-${memberIdx}-0`,
        studio_id: OXATL_STUDIO.id,
        profile_id: member.profile.id,
        type: 'membership_purchase',
        status: 'completed',
        amount_cents: memType.price_cents,
        description: `${memType.name} membership`,
        membership_type_id: memType.id,
        class_pack_type_id: null,
        event_id: null,
        payment_method: randomChoice(['card', 'card', 'card', 'apple_pay']),
        stripe_payment_intent_id: `pi_demo_${randomId()}`,
        created_at: formatDateTime(txDate),
        completed_at: formatDateTime(txDate),
      });

      // Generate renewals for monthly memberships
      if (memType.billing_cycle === 'monthly') {
        let renewalDate = new Date(txDate);
        let renewalIdx = 1;

        while (true) {
          renewalDate = addDays(renewalDate, 30);
          if (renewalDate > DEMO_END_DATE) break;
          if (member.membership_status !== 'active' && renewalIdx > 2) break;

          const isFailed = member.membership_status === 'past_due' && renewalIdx === 2;

          transactions.push({
            id: `tx-mem-${memberIdx}-${renewalIdx}`,
            studio_id: OXATL_STUDIO.id,
            profile_id: member.profile.id,
            type: 'membership_renewal',
            status: isFailed ? 'failed' : 'completed',
            amount_cents: memType.price_cents,
            description: `${memType.name} renewal`,
            membership_type_id: memType.id,
            class_pack_type_id: null,
            event_id: null,
            payment_method: 'card',
            stripe_payment_intent_id: isFailed ? null : `pi_demo_${randomId()}`,
            created_at: formatDateTime(renewalDate),
            completed_at: isFailed ? null : formatDateTime(renewalDate),
          });

          renewalIdx++;
        }
      }
    } else if (member.class_pack_type_id) {
      const packType = OXATL_CLASS_PACK_TYPES.find(p => p.id === member.class_pack_type_id);
      if (!packType) return;

      transactions.push({
        id: `tx-pack-${memberIdx}`,
        studio_id: OXATL_STUDIO.id,
        profile_id: member.profile.id,
        type: 'class_pack_purchase',
        status: 'completed',
        amount_cents: packType.price_cents,
        description: packType.name,
        membership_type_id: null,
        class_pack_type_id: packType.id,
        event_id: null,
        payment_method: randomChoice(['card', 'card', 'apple_pay', 'google_pay']),
        stripe_payment_intent_id: `pi_demo_${randomId()}`,
        created_at: formatDateTime(txDate),
        completed_at: formatDateTime(txDate),
      });
    }
  });

  // Add some drop-in transactions
  const dropInMembers = OXATL_MEMBERS.filter(m => !m.membership_type_id && !m.class_pack_type_id);
  dropInMembers.slice(0, 50).forEach((member, idx) => {
    const dropInDate = new Date(DEMO_START_DATE);
    dropInDate.setDate(dropInDate.getDate() + randomInt(0, 300));

    transactions.push({
      id: `tx-dropin-${idx}`,
      studio_id: OXATL_STUDIO.id,
      profile_id: member.profile.id,
      type: 'drop_in',
      status: 'completed',
      amount_cents: 2500, // $25 drop-in
      description: 'Drop-in class',
      membership_type_id: null,
      class_pack_type_id: null,
      event_id: null,
      payment_method: 'card',
      stripe_payment_intent_id: `pi_demo_${randomId()}`,
      created_at: formatDateTime(dropInDate),
      completed_at: formatDateTime(dropInDate),
    });
  });

  // Add workshop transactions
  OXATL_WORKSHOP_TEMPLATES.forEach((workshop, wIdx) => {
    // 2 instances per workshop type over the year
    [0, 1].forEach(instance => {
      const workshopDate = new Date(DEMO_START_DATE);
      workshopDate.setDate(workshopDate.getDate() + randomInt(30, 300) + instance * 60);

      if (workshopDate > DEMO_END_DATE) return;

      // 8-20 attendees per workshop
      const attendeeCount = randomInt(8, 20);
      const attendees = [...OXATL_MEMBERS]
        .sort(() => Math.random() - 0.5)
        .slice(0, attendeeCount);

      attendees.forEach((member, mIdx) => {
        const bookDate = new Date(workshopDate);
        bookDate.setDate(bookDate.getDate() - randomInt(3, 21));

        transactions.push({
          id: `tx-workshop-${wIdx}-${instance}-${mIdx}`,
          studio_id: OXATL_STUDIO.id,
          profile_id: member.profile.id,
          type: 'workshop',
          status: 'completed',
          amount_cents: workshop.price_cents,
          description: workshop.name,
          membership_type_id: null,
          class_pack_type_id: null,
          event_id: `event-${wIdx}-${instance}`,
          payment_method: randomChoice(['card', 'card', 'apple_pay']),
          stripe_payment_intent_id: `pi_demo_${randomId()}`,
          created_at: formatDateTime(bookDate),
          completed_at: formatDateTime(bookDate),
        });
      });
    });
  });

  // Add some late cancel fees
  const lateCancelFees = transactions.length * 0.02; // ~2% result in fees
  for (let i = 0; i < lateCancelFees; i++) {
    const feeDate = new Date(DEMO_START_DATE);
    feeDate.setDate(feeDate.getDate() + randomInt(30, 300));

    const member = randomChoice(OXATL_MEMBERS);

    transactions.push({
      id: `tx-fee-${i}`,
      studio_id: OXATL_STUDIO.id,
      profile_id: member.profile.id,
      type: 'late_cancel_fee',
      status: 'completed',
      amount_cents: OXATL_STUDIO.late_cancel_fee_cents,
      description: 'Late cancellation fee',
      membership_type_id: null,
      class_pack_type_id: null,
      event_id: null,
      payment_method: 'card',
      stripe_payment_intent_id: `pi_demo_${randomId()}`,
      created_at: formatDateTime(feeDate),
      completed_at: formatDateTime(feeDate),
    });
  }

  // Add a few refunds
  const refundCount = Math.floor(transactions.length * 0.01); // ~1% refunds
  for (let i = 0; i < refundCount; i++) {
    const refundDate = new Date(DEMO_START_DATE);
    refundDate.setDate(refundDate.getDate() + randomInt(30, 300));

    const member = randomChoice(OXATL_MEMBERS);

    transactions.push({
      id: `tx-refund-${i}`,
      studio_id: OXATL_STUDIO.id,
      profile_id: member.profile.id,
      type: 'refund',
      status: 'completed',
      amount_cents: -randomChoice([2500, 4900, 7900, 12900]), // Negative for refund
      description: 'Refund',
      membership_type_id: null,
      class_pack_type_id: null,
      event_id: null,
      payment_method: 'card',
      stripe_payment_intent_id: `pi_demo_${randomId()}`,
      created_at: formatDateTime(refundDate),
      completed_at: formatDateTime(refundDate),
    });
  }

  // Sort by date
  transactions.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return transactions;
}

// ============================================================================
// GENERATE AND EXPORT
// ============================================================================

// Generate all demo data
const classOccurrences = generateClassOccurrences();
const bookings = generateBookings(classOccurrences);
const transactions = generateTransactions();

export const OXATL_CLASS_OCCURRENCES = classOccurrences;
export const OXATL_BOOKINGS = bookings;
export const OXATL_TRANSACTIONS = transactions;

// ============================================================================
// STATISTICS
// ============================================================================

export const OXATL_BOOKING_STATS = {
  totalOccurrences: classOccurrences.length,
  cancelledClasses: classOccurrences.filter(o => o.is_cancelled).length,
  totalBookings: bookings.length,
  checkedIn: bookings.filter(b => b.status === 'checked_in').length,
  cancelled: bookings.filter(b => b.status === 'cancelled').length,
  lateCancel: bookings.filter(b => b.status === 'late_cancel').length,
  noShow: bookings.filter(b => b.status === 'no_show').length,
  waitlisted: bookings.filter(b => b.status === 'waitlisted').length,
};

export const OXATL_TRANSACTION_STATS = {
  totalTransactions: transactions.length,
  totalRevenueCents: transactions
    .filter(t => t.status === 'completed' && t.amount_cents > 0)
    .reduce((sum, t) => sum + t.amount_cents, 0),
  membershipPurchases: transactions.filter(t => t.type === 'membership_purchase').length,
  membershipRenewals: transactions.filter(t => t.type === 'membership_renewal').length,
  classPackPurchases: transactions.filter(t => t.type === 'class_pack_purchase').length,
  dropIns: transactions.filter(t => t.type === 'drop_in').length,
  workshops: transactions.filter(t => t.type === 'workshop').length,
  refunds: transactions.filter(t => t.type === 'refund').length,
  failedPayments: transactions.filter(t => t.status === 'failed').length,
};

// ============================================================================
// ACCESSOR HELPERS
// ============================================================================

/**
 * Get bookings for a specific member
 */
export function getBookingsForMember(profileId: string): DemoBooking[] {
  return OXATL_BOOKINGS.filter(b => b.profile_id === profileId);
}

/**
 * Get bookings for a specific class occurrence
 */
export function getBookingsForOccurrence(occurrenceId: string): DemoBooking[] {
  return OXATL_BOOKINGS.filter(b => b.class_occurrence_id === occurrenceId);
}

/**
 * Get bookings for a specific teacher
 */
export function getBookingsForTeacher(teacherId: string): DemoBooking[] {
  return OXATL_BOOKINGS.filter(b => b.teacher_id === teacherId);
}

/**
 * Get bookings for a date range
 */
export function getBookingsInRange(startDate: string, endDate: string): DemoBooking[] {
  return OXATL_BOOKINGS.filter(
    b => b.scheduled_date >= startDate && b.scheduled_date <= endDate
  );
}

/**
 * Get transactions for a specific member
 */
export function getTransactionsForMember(profileId: string): DemoTransaction[] {
  return OXATL_TRANSACTIONS.filter(t => t.profile_id === profileId);
}

/**
 * Get transactions for a date range
 */
export function getTransactionsInRange(startDate: string, endDate: string): DemoTransaction[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return OXATL_TRANSACTIONS.filter(t => {
    const txDate = new Date(t.created_at).getTime();
    return txDate >= start && txDate <= end;
  });
}

/**
 * Get class occurrences for a date
 */
export function getOccurrencesForDate(date: string): DemoClassOccurrence[] {
  return OXATL_CLASS_OCCURRENCES.filter(o => o.date === date);
}

/**
 * Get class occurrences for a teacher
 */
export function getOccurrencesForTeacher(teacherId: string): DemoClassOccurrence[] {
  return OXATL_CLASS_OCCURRENCES.filter(o => o.teacher_id === teacherId);
}
