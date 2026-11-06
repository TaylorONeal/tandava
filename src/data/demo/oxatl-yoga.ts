/**
 * OXATL YOGA - Demo Studio Data
 *
 * This file contains mock data for the demo studio "Oxatl Yoga".
 * It's designed to showcase Tandava's features with realistic data.
 *
 * TO REMOVE FOR PRODUCTION:
 * 1. Delete the entire src/data/demo/ directory
 * 2. Remove demo data imports from components that use them
 * 3. Set VITE_DEMO_MODE=false in your .env
 */

import type {
  Studio,
  Profile,
  UserRole,
  MembershipStatus,
  BookingStatus,
} from '@/types/database';

// ============================================================================
// SEEDED RANDOM
// ============================================================================

// Seeded PRNG (mulberry32) so the demo roster, phones and member mix are the
// same on every load. Dates stay relative to today, so they are stable per day.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20220315);

// Fictional numbers in the reserved 555-0100 to 555-0199 range, Austin area codes.
function randomPhone(): string {
  const area = rng() < 0.7 ? '512' : '737';
  return `+1 (${area}) 555-01${String(Math.floor(rng() * 100)).padStart(2, '0')}`;
}

// ============================================================================
// STUDIO
// ============================================================================

export const OXATL_STUDIO: Studio = {
  id: 'demo-studio-oxatl-001',
  name: 'Oxatl Yoga',
  slug: 'oxatl-yoga',
  description: 'Yoga, pilates and meditation on East 6th, South Congress and North Lamar. Around 80 classes a week, 7 am to 7 pm. New students get 30 days unlimited for $49.',
  logo_url: null,
  cover_image_url: null,
  website: 'https://oxatlyoga.com',
  email: 'hello@oxatlyoga.com',
  phone: '+1 (512) 555-0123',
  timezone: 'America/Chicago',
  currency: 'USD',
  stripe_account_id: null,
  stripe_onboarding_complete: false,
  discoverable: true,
  brand_primary_color: '#8B5A2B',
  brand_secondary_color: '#D4A574',
  brand_font: 'DM Sans',
  default_cancellation_minutes: 720, // 12 hours
  late_cancel_fee_cents: 1500,
  no_show_fee_cents: 2000,
  waitlist_enabled: true,
  max_waitlist_size: 5,
  created_at: '2022-03-15T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

// ============================================================================
// LOCATIONS
// ============================================================================

export interface DemoLocation {
  id: string;
  studio_id: string;
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  rooms: DemoRoom[];
  capacity: number;
}

export interface DemoRoom {
  id: string;
  name: string;
  capacity: number;
}

export const OXATL_LOCATIONS: DemoLocation[] = [
  {
    id: 'loc-east',
    studio_id: OXATL_STUDIO.id,
    name: 'Oxatl East',
    address_line1: '2401 E 6th St',
    address_line2: 'Suite 100',
    city: 'Austin',
    state: 'TX',
    postal_code: '78702',
    country: 'US',
    lat: 30.2612,
    lng: -97.7183,
    phone: '+1 (512) 555-0124',
    email: 'east@oxatlyoga.com',
    rooms: [
      { id: 'room-east-main', name: 'Main Studio', capacity: 30 },
      { id: 'room-east-small', name: 'Meditation Room', capacity: 12 },
    ],
    capacity: 42,
  },
  {
    id: 'loc-central',
    studio_id: OXATL_STUDIO.id,
    name: 'Oxatl Central',
    address_line1: '1000 S Congress Ave',
    address_line2: null,
    city: 'Austin',
    state: 'TX',
    postal_code: '78704',
    country: 'US',
    lat: 30.2500,
    lng: -97.7494,
    phone: '+1 (512) 555-0125',
    email: 'central@oxatlyoga.com',
    rooms: [
      { id: 'room-central-main', name: 'Flow Room', capacity: 35 },
      { id: 'room-central-hot', name: 'Hot Room', capacity: 25 },
    ],
    capacity: 60,
  },
  {
    id: 'loc-north',
    studio_id: OXATL_STUDIO.id,
    name: 'Oxatl North',
    address_line1: '5501 N Lamar Blvd',
    address_line2: 'Suite 200',
    city: 'Austin',
    state: 'TX',
    postal_code: '78751',
    country: 'US',
    lat: 30.3217,
    lng: -97.7269,
    phone: '+1 (512) 555-0126',
    email: 'north@oxatlyoga.com',
    rooms: [
      { id: 'room-north-main', name: 'Shala', capacity: 28 },
    ],
    capacity: 28,
  },
];

// ============================================================================
// STAFF & TEACHERS
// ============================================================================

export interface DemoStaff {
  profile: Profile;
  role: UserRole;
  location_ids: string[];
  specialties: string[];
  pay_rate_cents: number;
  pay_type: 'per_class' | 'hourly' | 'salary';
  bio: string;
}

// Teachers. Ids are stable keys used by the schedule and workshops; names are display only.
type DemoTeacherSeed = Omit<DemoStaff, 'role' | 'pay_rate_cents' | 'pay_type'>;

const FEMALE_TEACHERS: DemoTeacherSeed[] = [
  {
    profile: makeTeacherProfile('teacher-beyonce-pangolin', 'Maren', 'Holloway', 'maren'),
    location_ids: ['loc-central', 'loc-east'],
    specialties: ['Vinyasa', 'Power Yoga'],
    bio: 'Teaching since 2013. Strong, steady flows with one peak pose per class and plenty of options to scale it.',
  },
  {
    profile: makeTeacherProfile('teacher-adele-capybara', 'Noor', 'Haddad', 'noor'),
    location_ids: ['loc-central'],
    specialties: ['Yin', 'Restorative'],
    bio: 'Long holds, lots of props and a quiet room. Good for tight hips and busy weeks.',
  },
  {
    profile: makeTeacherProfile('teacher-rihanna-quokka', 'Camila', 'Reyes', 'camila'),
    location_ids: ['loc-east', 'loc-north'],
    specialties: ['Vinyasa', 'Hatha'],
    bio: 'Bilingual classes in English and Spanish. Moderate pace, clear cues, all levels.',
  },
  {
    profile: makeTeacherProfile('teacher-taylor-otter', 'Hannah', 'Lindqvist', 'hannah'),
    location_ids: ['loc-north'],
    specialties: ['Hatha', 'Meditation'],
    bio: 'Alignment-based hatha with a short sit at the end. Former physical therapy aide.',
  },
  {
    profile: makeTeacherProfile('teacher-ariana-hedgehog', 'Jasmine', 'Okafor', 'jasmine'),
    location_ids: ['loc-central', 'loc-east'],
    specialties: ['Pilates', 'Vinyasa'],
    bio: 'Mat pilates and vinyasa. Expect core work, small equipment and an upbeat playlist.',
  },
  {
    profile: makeTeacherProfile('teacher-dua-axolotl', 'Leah', 'Kaplan', 'leah'),
    location_ids: ['loc-east'],
    specialties: ['Vinyasa', 'Hatha'],
    bio: 'Creative sequencing that changes every week. Mornings at East.',
  },
  {
    profile: makeTeacherProfile('teacher-billie-chinchilla', 'Mei', 'Tanaka', 'mei'),
    location_ids: ['loc-north'],
    specialties: ['Yin', 'Meditation'],
    bio: 'Yin, meditation and breathwork. Trained in mindfulness-based stress reduction.',
  },
  {
    profile: makeTeacherProfile('teacher-lizzo-wombat', 'Tasha', 'Greene', 'tasha'),
    location_ids: ['loc-central'],
    specialties: ['Vinyasa', 'Power Yoga'],
    bio: 'Power classes that work for every body. Modifications are offered first, not as an afterthought.',
  },
  {
    profile: makeTeacherProfile('teacher-shakira-fennec', 'Valeria', 'Ortiz', 'valeria'),
    location_ids: ['loc-east', 'loc-central'],
    specialties: ['Pilates', 'Hatha'],
    bio: 'Pilates instructor and licensed massage therapist. Runs the myofascial release workshop.',
  },
  {
    profile: makeTeacherProfile('teacher-celine-manatee', 'Anika', 'Desai', 'anika'),
    location_ids: ['loc-north'],
    specialties: ['Restorative', 'Yin'],
    bio: 'Restorative and yin, plus the monthly sound bath at North.',
  },
  {
    profile: makeTeacherProfile('teacher-whitney-puffin', 'Erin', 'Gallagher', 'erin'),
    location_ids: ['loc-central'],
    specialties: ['Vinyasa', 'Meditation'],
    bio: 'Evening flows that finish with ten minutes of guided meditation.',
  },
  {
    profile: makeTeacherProfile('teacher-cher-sloth', 'Rosa', 'Delgado', 'rosa'),
    location_ids: ['loc-east'],
    specialties: ['Hatha', 'Yin'],
    bio: 'Slow hatha and yin. Has taught at East since the studio opened.',
  },
  {
    profile: makeTeacherProfile('teacher-madonna-tapir', 'Brooke', 'Sandoval', 'brooke'),
    location_ids: ['loc-central', 'loc-north'],
    specialties: ['Vinyasa', 'Power Yoga'],
    bio: 'Fast-paced vinyasa with arm balances and inversions. Beginners welcome to take it slower.',
  },
  {
    profile: makeTeacherProfile('teacher-gwen-narwhal', 'Sofia', 'Marchetti', 'sofia'),
    location_ids: ['loc-east'],
    specialties: ['Pilates', 'Vinyasa'],
    bio: 'Former dancer. Precise pilates and flowing vinyasa, often in the same class.',
  },
  {
    profile: makeTeacherProfile('teacher-dolly-alpaca', 'Dana', 'Whitaker', 'dana'),
    location_ids: ['loc-north'],
    specialties: ['Hatha', 'Meditation'],
    bio: 'Gentle hatha for new students and anyone coming back from a break.',
  },
];

const MALE_TEACHERS: DemoTeacherSeed[] = [
  {
    profile: makeTeacherProfile('teacher-travis-jones', 'Marcus', 'Bell', 'marcus'),
    location_ids: ['loc-central', 'loc-east'],
    specialties: ['Vinyasa', 'Power Yoga'],
    bio: 'Played college football before yoga. Power classes with a focus on mobility and recovery.',
  },
  {
    profile: makeTeacherProfile('teacher-patrick-jones', 'Daniel', 'Nguyen', 'daniel'),
    location_ids: ['loc-north'],
    specialties: ['Hatha', 'Meditation'],
    bio: 'Precise alignment and plenty of hands-on adjustments, with consent cards at every mat.',
  },
  {
    profile: makeTeacherProfile('teacher-chris-mahomes', 'Andre', 'Castillo', 'andre'),
    location_ids: ['loc-central'],
    specialties: ['Pilates', 'Vinyasa'],
    bio: 'Strength-focused pilates and vinyasa. Weekend classes at Central.',
  },
];

function makeTeacherProfile(id: string, firstName: string, lastName: string, emailPrefix: string): Profile {
  return {
    id,
    first_name: firstName,
    last_name: lastName,
    display_name: `${firstName} ${lastName}`,
    email: `${emailPrefix}@oxatlyoga.com`,
    phone: randomPhone(),
    avatar_url: null,
    date_of_birth: randomDateOfBirth(1980, 1998),
    pronouns: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    bio: '',
    specialties: [],
    certifications: ['RYT-200'],
    instagram_handle: `@${firstName.toLowerCase()}${lastName.toLowerCase()}.yoga`,
    website: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };
}

export const OXATL_TEACHERS: DemoStaff[] = [
  ...FEMALE_TEACHERS.map((t, i) => ({
    ...t,
    role: 'teacher' as UserRole,
    pay_rate_cents: 4500 + (i % 5) * 500, // $45-$65 per class
    pay_type: 'per_class' as const,
  })),
  ...MALE_TEACHERS.map((t, i) => ({
    ...t,
    role: 'teacher' as UserRole,
    pay_rate_cents: 5000 + (i % 3) * 500,
    pay_type: 'per_class' as const,
  })),
];

// Owner & Front Desk
export const OXATL_OWNER: DemoStaff = {
  profile: {
    id: 'staff-owner-mariana',
    first_name: 'Mariana',
    last_name: 'Ochoa',
    display_name: 'Mariana Ochoa',
    email: 'mariana@oxatlyoga.com',
    phone: '+1 (512) 555-0100',
    avatar_url: null,
    date_of_birth: '1985-06-15',
    pronouns: 'she/her',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    bio: 'Opened Oxatl Yoga on East 6th in 2022 after ten years teaching around Austin. E-RYT 500, YACEP. Leads the 200-hour teacher training.',
    specialties: ['Vinyasa', 'Yin', 'Meditation', 'Teacher Training'],
    certifications: ['E-RYT 500', 'YACEP'],
    instagram_handle: '@mariana.ochoa.yoga',
    website: 'https://oxatlyoga.com',
    created_at: '2022-03-15T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  role: 'owner',
  location_ids: ['loc-central', 'loc-east', 'loc-north'],
  specialties: ['Vinyasa', 'Yin', 'Meditation', 'Teacher Training'],
  pay_rate_cents: 0,
  pay_type: 'salary',
  bio: 'Opened Oxatl Yoga in 2022 after ten years teaching around Austin. Leads the 200-hour teacher training.',
};

export const OXATL_FRONT_DESK: DemoStaff = {
  profile: {
    id: 'staff-frontdesk-cassia',
    first_name: 'Cassia',
    last_name: 'Moreno',
    display_name: 'Cassia Moreno',
    email: 'cassia@oxatlyoga.com',
    phone: '+1 (512) 555-0101',
    avatar_url: null,
    date_of_birth: '1995-09-22',
    pronouns: 'she/her',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    bio: 'Front desk lead at Oxatl Central. Currently in the spring 200-hour teacher training.',
    specialties: [],
    certifications: [],
    instagram_handle: '@cassiamoreno',
    website: null,
    created_at: '2023-06-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  role: 'front_desk',
  location_ids: ['loc-central'],
  specialties: [],
  pay_rate_cents: 1800, // $18/hour
  pay_type: 'hourly',
  bio: 'Front desk lead at Oxatl Central. Currently in the spring 200-hour teacher training.',
};

// ============================================================================
// CLASS TYPES
// ============================================================================

export interface DemoClassType {
  id: string;
  studio_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  default_capacity: number;
  color: string;
  category: string;
}

export const OXATL_CLASS_TYPES: DemoClassType[] = [
  {
    id: 'class-vinyasa',
    studio_id: OXATL_STUDIO.id,
    name: 'Vinyasa Flow',
    description: 'A dynamic practice linking breath with movement. Builds heat, strength and flexibility. Some yoga experience helps.',
    duration_minutes: 60,
    default_capacity: 30,
    color: '#E57373',
    category: 'yoga',
  },
  {
    id: 'class-yin',
    studio_id: OXATL_STUDIO.id,
    name: 'Yin Yoga',
    description: 'Seated and reclined poses held for 3 to 5 minutes. Works the hips, spine and connective tissue. No experience needed.',
    duration_minutes: 75,
    default_capacity: 25,
    color: '#64B5F6',
    category: 'yoga',
  },
  {
    id: 'class-hatha',
    studio_id: OXATL_STUDIO.id,
    name: 'Hatha Yoga',
    description: 'Standing and seated poses with longer holds and clear alignment cues. A good first class.',
    duration_minutes: 60,
    default_capacity: 28,
    color: '#81C784',
    category: 'yoga',
  },
  {
    id: 'class-pilates',
    studio_id: OXATL_STUDIO.id,
    name: 'Pilates',
    description: 'Mat pilates with small balls and bands. Core, glutes and posture work. Low impact.',
    duration_minutes: 55,
    default_capacity: 20,
    color: '#FFB74D',
    category: 'movement',
  },
  {
    id: 'class-meditation',
    studio_id: OXATL_STUDIO.id,
    name: 'Meditation',
    description: 'Guided seated meditation with short breathing exercises. Chairs and cushions provided.',
    duration_minutes: 45,
    default_capacity: 20,
    color: '#9575CD',
    category: 'mindfulness',
  },
  {
    id: 'class-power',
    studio_id: OXATL_STUDIO.id,
    name: 'Power Yoga',
    description: 'Faster vinyasa with strength holds, arm balances and inversions. Bring water and a towel.',
    duration_minutes: 60,
    default_capacity: 25,
    color: '#F06292',
    category: 'yoga',
  },
  {
    id: 'class-restorative',
    studio_id: OXATL_STUDIO.id,
    name: 'Restorative',
    description: 'Five or six fully supported poses with bolsters and blankets. Good after a hard week or an injury.',
    duration_minutes: 75,
    default_capacity: 20,
    color: '#4DB6AC',
    category: 'yoga',
  },
];

// ============================================================================
// SCHEDULE TEMPLATES
// ============================================================================

export interface DemoScheduleSlot {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  time: string; // HH:MM format
  class_type_id: string;
  location_id: string;
  teacher_id: string;
  room_id?: string;
}

// Weekday schedule: 7am, 10:30am, 12pm, 4pm or 6pm
// Saturday: 9am, 12pm, 3pm
// Sunday: 10:30am, 12pm, 4pm
export const OXATL_SCHEDULE: DemoScheduleSlot[] = [
  // MONDAY
  { day: 'monday', time: '07:00', class_type_id: 'class-vinyasa', location_id: 'loc-central', teacher_id: 'teacher-beyonce-pangolin' },
  { day: 'monday', time: '10:30', class_type_id: 'class-hatha', location_id: 'loc-central', teacher_id: 'teacher-adele-capybara' },
  { day: 'monday', time: '12:00', class_type_id: 'class-pilates', location_id: 'loc-central', teacher_id: 'teacher-ariana-hedgehog' },
  { day: 'monday', time: '18:00', class_type_id: 'class-yin', location_id: 'loc-central', teacher_id: 'teacher-billie-chinchilla' },

  { day: 'monday', time: '07:00', class_type_id: 'class-hatha', location_id: 'loc-east', teacher_id: 'teacher-rihanna-quokka' },
  { day: 'monday', time: '10:30', class_type_id: 'class-vinyasa', location_id: 'loc-east', teacher_id: 'teacher-dua-axolotl' },
  { day: 'monday', time: '12:00', class_type_id: 'class-power', location_id: 'loc-east', teacher_id: 'teacher-travis-jones' },
  { day: 'monday', time: '16:00', class_type_id: 'class-yin', location_id: 'loc-east', teacher_id: 'teacher-cher-sloth' },

  { day: 'monday', time: '07:00', class_type_id: 'class-vinyasa', location_id: 'loc-north', teacher_id: 'teacher-taylor-otter' },
  { day: 'monday', time: '10:30', class_type_id: 'class-pilates', location_id: 'loc-north', teacher_id: 'teacher-patrick-jones' },
  { day: 'monday', time: '12:00', class_type_id: 'class-hatha', location_id: 'loc-north', teacher_id: 'teacher-dolly-alpaca' },
  { day: 'monday', time: '18:00', class_type_id: 'class-restorative', location_id: 'loc-north', teacher_id: 'teacher-celine-manatee' },

  // TUESDAY
  { day: 'tuesday', time: '07:00', class_type_id: 'class-power', location_id: 'loc-central', teacher_id: 'teacher-lizzo-wombat' },
  { day: 'tuesday', time: '10:30', class_type_id: 'class-vinyasa', location_id: 'loc-central', teacher_id: 'teacher-madonna-tapir' },
  { day: 'tuesday', time: '12:00', class_type_id: 'class-hatha', location_id: 'loc-central', teacher_id: 'teacher-chris-mahomes' },
  { day: 'tuesday', time: '18:00', class_type_id: 'class-vinyasa', location_id: 'loc-central', teacher_id: 'teacher-whitney-puffin' },

  { day: 'tuesday', time: '07:00', class_type_id: 'class-vinyasa', location_id: 'loc-east', teacher_id: 'teacher-shakira-fennec' },
  { day: 'tuesday', time: '10:30', class_type_id: 'class-yin', location_id: 'loc-east', teacher_id: 'teacher-adele-capybara' },
  { day: 'tuesday', time: '12:00', class_type_id: 'class-pilates', location_id: 'loc-east', teacher_id: 'teacher-gwen-narwhal' },
  { day: 'tuesday', time: '16:00', class_type_id: 'class-hatha', location_id: 'loc-east', teacher_id: 'teacher-dua-axolotl' },

  { day: 'tuesday', time: '07:00', class_type_id: 'class-hatha', location_id: 'loc-north', teacher_id: 'teacher-dolly-alpaca' },
  { day: 'tuesday', time: '10:30', class_type_id: 'class-vinyasa', location_id: 'loc-north', teacher_id: 'teacher-rihanna-quokka' },
  { day: 'tuesday', time: '12:00', class_type_id: 'class-yin', location_id: 'loc-north', teacher_id: 'teacher-billie-chinchilla' },
  { day: 'tuesday', time: '18:00', class_type_id: 'class-power', location_id: 'loc-north', teacher_id: 'teacher-madonna-tapir' },

  // WEDNESDAY
  { day: 'wednesday', time: '07:00', class_type_id: 'class-vinyasa', location_id: 'loc-central', teacher_id: 'teacher-beyonce-pangolin' },
  { day: 'wednesday', time: '10:30', class_type_id: 'class-pilates', location_id: 'loc-central', teacher_id: 'teacher-ariana-hedgehog' },
  { day: 'wednesday', time: '12:00', class_type_id: 'class-yin', location_id: 'loc-central', teacher_id: 'teacher-adele-capybara' },
  { day: 'wednesday', time: '18:00', class_type_id: 'class-hatha', location_id: 'loc-central', teacher_id: 'teacher-whitney-puffin' },

  { day: 'wednesday', time: '07:00', class_type_id: 'class-power', location_id: 'loc-east', teacher_id: 'teacher-travis-jones' },
  { day: 'wednesday', time: '10:30', class_type_id: 'class-hatha', location_id: 'loc-east', teacher_id: 'teacher-cher-sloth' },
  { day: 'wednesday', time: '12:00', class_type_id: 'class-vinyasa', location_id: 'loc-east', teacher_id: 'teacher-rihanna-quokka' },
  { day: 'wednesday', time: '16:00', class_type_id: 'class-pilates', location_id: 'loc-east', teacher_id: 'teacher-shakira-fennec' },

  { day: 'wednesday', time: '07:00', class_type_id: 'class-hatha', location_id: 'loc-north', teacher_id: 'teacher-taylor-otter' },
  { day: 'wednesday', time: '10:30', class_type_id: 'class-yin', location_id: 'loc-north', teacher_id: 'teacher-celine-manatee' },
  { day: 'wednesday', time: '12:00', class_type_id: 'class-vinyasa', location_id: 'loc-north', teacher_id: 'teacher-patrick-jones' },
  { day: 'wednesday', time: '18:00', class_type_id: 'class-restorative', location_id: 'loc-north', teacher_id: 'teacher-billie-chinchilla' },

  // THURSDAY
  { day: 'thursday', time: '07:00', class_type_id: 'class-power', location_id: 'loc-central', teacher_id: 'teacher-lizzo-wombat' },
  { day: 'thursday', time: '10:30', class_type_id: 'class-vinyasa', location_id: 'loc-central', teacher_id: 'teacher-chris-mahomes' },
  { day: 'thursday', time: '12:00', class_type_id: 'class-pilates', location_id: 'loc-central', teacher_id: 'teacher-ariana-hedgehog' },
  { day: 'thursday', time: '18:00', class_type_id: 'class-yin', location_id: 'loc-central', teacher_id: 'teacher-adele-capybara' },

  { day: 'thursday', time: '07:00', class_type_id: 'class-vinyasa', location_id: 'loc-east', teacher_id: 'teacher-beyonce-pangolin' },
  { day: 'thursday', time: '10:30', class_type_id: 'class-hatha', location_id: 'loc-east', teacher_id: 'teacher-dua-axolotl' },
  { day: 'thursday', time: '12:00', class_type_id: 'class-power', location_id: 'loc-east', teacher_id: 'teacher-travis-jones' },
  { day: 'thursday', time: '16:00', class_type_id: 'class-restorative', location_id: 'loc-east', teacher_id: 'teacher-cher-sloth' },

  { day: 'thursday', time: '07:00', class_type_id: 'class-vinyasa', location_id: 'loc-north', teacher_id: 'teacher-madonna-tapir' },
  { day: 'thursday', time: '10:30', class_type_id: 'class-pilates', location_id: 'loc-north', teacher_id: 'teacher-gwen-narwhal' },
  { day: 'thursday', time: '12:00', class_type_id: 'class-hatha', location_id: 'loc-north', teacher_id: 'teacher-dolly-alpaca' },
  { day: 'thursday', time: '18:00', class_type_id: 'class-yin', location_id: 'loc-north', teacher_id: 'teacher-celine-manatee' },

  // FRIDAY
  { day: 'friday', time: '07:00', class_type_id: 'class-vinyasa', location_id: 'loc-central', teacher_id: 'teacher-whitney-puffin' },
  { day: 'friday', time: '10:30', class_type_id: 'class-hatha', location_id: 'loc-central', teacher_id: 'teacher-madonna-tapir' },
  { day: 'friday', time: '12:00', class_type_id: 'class-yin', location_id: 'loc-central', teacher_id: 'teacher-billie-chinchilla' },
  { day: 'friday', time: '16:00', class_type_id: 'class-restorative', location_id: 'loc-central', teacher_id: 'teacher-adele-capybara' },

  { day: 'friday', time: '07:00', class_type_id: 'class-pilates', location_id: 'loc-east', teacher_id: 'teacher-shakira-fennec' },
  { day: 'friday', time: '10:30', class_type_id: 'class-vinyasa', location_id: 'loc-east', teacher_id: 'teacher-rihanna-quokka' },
  { day: 'friday', time: '12:00', class_type_id: 'class-hatha', location_id: 'loc-east', teacher_id: 'teacher-dua-axolotl' },
  { day: 'friday', time: '16:00', class_type_id: 'class-yin', location_id: 'loc-east', teacher_id: 'teacher-cher-sloth' },

  { day: 'friday', time: '07:00', class_type_id: 'class-hatha', location_id: 'loc-north', teacher_id: 'teacher-taylor-otter' },
  { day: 'friday', time: '10:30', class_type_id: 'class-power', location_id: 'loc-north', teacher_id: 'teacher-patrick-jones' },
  { day: 'friday', time: '12:00', class_type_id: 'class-vinyasa', location_id: 'loc-north', teacher_id: 'teacher-dolly-alpaca' },
  { day: 'friday', time: '16:00', class_type_id: 'class-restorative', location_id: 'loc-north', teacher_id: 'teacher-celine-manatee' },

  // SATURDAY - 9am, 12pm, 3pm + Meditation
  { day: 'saturday', time: '09:00', class_type_id: 'class-vinyasa', location_id: 'loc-central', teacher_id: 'teacher-beyonce-pangolin' },
  { day: 'saturday', time: '12:00', class_type_id: 'class-power', location_id: 'loc-central', teacher_id: 'teacher-lizzo-wombat' },
  { day: 'saturday', time: '15:00', class_type_id: 'class-yin', location_id: 'loc-central', teacher_id: 'teacher-adele-capybara' },
  { day: 'saturday', time: '16:30', class_type_id: 'class-meditation', location_id: 'loc-central', teacher_id: 'teacher-billie-chinchilla' },

  { day: 'saturday', time: '09:00', class_type_id: 'class-hatha', location_id: 'loc-east', teacher_id: 'teacher-rihanna-quokka' },
  { day: 'saturday', time: '12:00', class_type_id: 'class-vinyasa', location_id: 'loc-east', teacher_id: 'teacher-travis-jones' },
  { day: 'saturday', time: '15:00', class_type_id: 'class-restorative', location_id: 'loc-east', teacher_id: 'teacher-cher-sloth' },

  { day: 'saturday', time: '09:00', class_type_id: 'class-vinyasa', location_id: 'loc-north', teacher_id: 'teacher-madonna-tapir' },
  { day: 'saturday', time: '12:00', class_type_id: 'class-hatha', location_id: 'loc-north', teacher_id: 'teacher-taylor-otter' },
  { day: 'saturday', time: '15:00', class_type_id: 'class-meditation', location_id: 'loc-north', teacher_id: 'teacher-dolly-alpaca' },

  // SUNDAY - 10:30am, 12pm, 4pm
  { day: 'sunday', time: '10:30', class_type_id: 'class-hatha', location_id: 'loc-central', teacher_id: 'teacher-whitney-puffin' },
  { day: 'sunday', time: '12:00', class_type_id: 'class-vinyasa', location_id: 'loc-central', teacher_id: 'teacher-chris-mahomes' },
  { day: 'sunday', time: '16:00', class_type_id: 'class-restorative', location_id: 'loc-central', teacher_id: 'teacher-adele-capybara' },

  { day: 'sunday', time: '10:30', class_type_id: 'class-vinyasa', location_id: 'loc-east', teacher_id: 'teacher-dua-axolotl' },
  { day: 'sunday', time: '12:00', class_type_id: 'class-yin', location_id: 'loc-east', teacher_id: 'teacher-cher-sloth' },
  { day: 'sunday', time: '16:00', class_type_id: 'class-hatha', location_id: 'loc-east', teacher_id: 'teacher-gwen-narwhal' },

  { day: 'sunday', time: '10:30', class_type_id: 'class-yin', location_id: 'loc-north', teacher_id: 'teacher-celine-manatee' },
  { day: 'sunday', time: '12:00', class_type_id: 'class-vinyasa', location_id: 'loc-north', teacher_id: 'teacher-patrick-jones' },
  { day: 'sunday', time: '16:00', class_type_id: 'class-restorative', location_id: 'loc-north', teacher_id: 'teacher-billie-chinchilla' },
];

// ============================================================================
// WORKSHOPS & EVENTS
// ============================================================================

export interface DemoEvent {
  id: string;
  studio_id: string;
  name: string;
  description: string;
  location_id: string;
  teacher_id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  price_cents: number;
  category: string;
}

// Rotating workshops - 2 per month
export const OXATL_WORKSHOP_TEMPLATES = [
  {
    name: 'Myofascial Release Workshop',
    description: 'Self-massage with balls and foam rollers for neck, shoulders, hips and feet. You keep the two massage balls.',
    duration_hours: 2,
    price_cents: 4500,
    category: 'workshop',
    teacher_id: 'teacher-shakira-fennec',
  },
  {
    name: 'Breathwork Workshop',
    description: 'Pranayama basics: three-part breath, alternate nostril breathing and box breathing, with time to practice each one.',
    duration_hours: 2.5,
    price_cents: 5500,
    category: 'workshop',
    teacher_id: 'teacher-billie-chinchilla',
  },
  {
    name: 'Mantra & Movement',
    description: 'Gentle movement paired with call-and-response chanting. Lyric sheets provided. No singing experience needed.',
    duration_hours: 2,
    price_cents: 4000,
    category: 'workshop',
    teacher_id: 'teacher-whitney-puffin',
  },
  {
    name: 'Glow Yoga',
    description: 'Vinyasa under black lights with glow paint. Wear white or light colors.',
    duration_hours: 1.5,
    price_cents: 3500,
    category: 'special',
    teacher_id: 'teacher-lizzo-wombat',
  },
  {
    name: 'Yin & Live Music',
    description: 'Yin class with a local guitarist and cellist playing live. Mats and bolsters set up before you arrive.',
    duration_hours: 2,
    price_cents: 4500,
    category: 'workshop',
    teacher_id: 'teacher-adele-capybara',
  },
  {
    name: 'Sound Bath',
    description: 'Crystal bowls, gong and chimes while you lie on a mat with blankets and an eye pillow.',
    duration_hours: 1.5,
    price_cents: 3500,
    category: 'wellness',
    teacher_id: 'teacher-celine-manatee',
  },
  {
    name: 'Full Moon Ceremony',
    description: 'Held on the Friday closest to the full moon. Gentle movement, a short meditation and journaling, then tea.',
    duration_hours: 2,
    price_cents: 3000,
    category: 'ceremony',
    teacher_id: 'teacher-taylor-otter',
  },
];

// ============================================================================
// MEMBERSHIP TYPES
// ============================================================================

export interface DemoMembershipType {
  id: string;
  studio_id: string;
  name: string;
  description: string;
  price_cents: number;
  billing_cycle: 'monthly' | 'annual';
  classes_per_period: number | null; // null = unlimited
  features: string[];
}

export const OXATL_MEMBERSHIP_TYPES: DemoMembershipType[] = [
  {
    id: 'mem-unlimited-monthly',
    studio_id: OXATL_STUDIO.id,
    name: 'Unlimited Monthly',
    description: 'Unlimited classes at all locations, plus member perks',
    price_cents: 17900,
    billing_cycle: 'monthly',
    classes_per_period: null,
    features: ['Unlimited classes', 'All 3 locations', '10% retail discount', 'Early workshop access', 'Guest passes (2/month)'],
  },
  {
    id: 'mem-unlimited-annual',
    studio_id: OXATL_STUDIO.id,
    name: 'Unlimited Annual',
    description: 'Unlimited classes, paid once a year. About two months free compared with monthly.',
    price_cents: 179000,
    billing_cycle: 'annual',
    classes_per_period: null,
    features: ['Unlimited classes', 'All 3 locations', '15% retail discount', 'Priority workshop booking', 'Guest passes (4/month)', 'Free mat storage'],
  },
  {
    id: 'mem-8-monthly',
    studio_id: OXATL_STUDIO.id,
    name: '8 Classes/Month',
    description: 'For practicing about twice a week',
    price_cents: 12900,
    billing_cycle: 'monthly',
    classes_per_period: 8,
    features: ['8 classes per month', 'All 3 locations', 'Rollover up to 4 classes'],
  },
  {
    id: 'mem-4-monthly',
    studio_id: OXATL_STUDIO.id,
    name: '4 Classes/Month',
    description: 'For practicing once a week',
    price_cents: 7900,
    billing_cycle: 'monthly',
    classes_per_period: 4,
    features: ['4 classes per month', 'All 3 locations', 'Rollover up to 2 classes'],
  },
];

// ============================================================================
// CLASS PACKS
// ============================================================================

export interface DemoClassPackType {
  id: string;
  studio_id: string;
  name: string;
  description: string;
  price_cents: number;
  class_count: number;
  validity_days: number;
}

export const OXATL_CLASS_PACK_TYPES: DemoClassPackType[] = [
  {
    id: 'pack-10',
    studio_id: OXATL_STUDIO.id,
    name: '10-Class Pack',
    description: 'Ten classes, good for 90 days',
    price_cents: 18000,
    class_count: 10,
    validity_days: 90,
  },
  {
    id: 'pack-20',
    studio_id: OXATL_STUDIO.id,
    name: '20-Class Pack',
    description: 'Twenty classes, good for 180 days',
    price_cents: 32000,
    class_count: 20,
    validity_days: 180,
  },
  {
    id: 'pack-5',
    studio_id: OXATL_STUDIO.id,
    name: '5-Class Pack',
    description: 'Five classes, good for 60 days',
    price_cents: 9500,
    class_count: 5,
    validity_days: 60,
  },
  {
    id: 'pack-intro',
    studio_id: OXATL_STUDIO.id,
    name: 'New Student Special',
    description: '30 days unlimited for new students',
    price_cents: 4900,
    class_count: 999, // effectively unlimited
    validity_days: 30,
  },
];

// ============================================================================
// MEMBERS (Generated)
// ============================================================================

// Name pools for a mixed Austin membership. ASCII only so generated emails stay valid.
const FIRST_NAMES = [
  'Ines', 'Ximena', 'Marisol', 'Daniela', 'Paloma', 'Renee', 'Keisha', 'Imani', 'Ingrid', 'Freya',
  'Anjali', 'Divya', 'Farah', 'Yasmin', 'Leila', 'Jiwoo', 'Linh', 'Kiara', 'Meredith', 'Colleen',
  'Joanna', 'Nadia', 'Talia', 'Josie', 'Wren', 'Margot', 'Rhea', 'Simone', 'Tess', 'Bea',
  'Hollis', 'Adaeze', 'Sakura', 'Gabriela', 'Shannon', 'Kristen', 'Alana', 'Monique', 'Esther', 'Dani',
  'Mateo', 'Diego', 'Rafael', 'Tomas', 'Omar', 'Karim', 'Ravi', 'Arjun', 'Kenji', 'Minh',
  'Tobias', 'Graham', 'Wes', 'Caleb', 'Desmond', 'Jamal', 'Elliot', 'Nate', 'Hector', 'Felix',
];

const LAST_NAMES = [
  'Alvarez', 'Brennan', 'Dominguez', 'Ellison', 'Fitzgerald', 'Gutierrez', 'Hartley', 'Ibarra', 'Jaramillo', 'Kowalski',
  'Lindgren', 'Mendoza', 'Nakamura', 'Okonkwo', 'Pham', 'Quintero', 'Ramaswamy', 'Salazar', 'Tran', 'Villarreal',
  'Washington', 'Yilmaz', 'Zamora', 'Abbott', 'Becker', 'Chavez', 'Esposito', 'Farouk', 'Hsu', 'Iyer',
  'Jensen', 'Khalil', 'Lozano', 'Moss', 'Novak', 'Ortega', 'Petrov', 'Rocha', 'Sato', 'Thibodeaux',
  'Whitmore', 'Adeyemi', 'Bui', 'Cardenas', 'Delacroix', 'Gallo', 'Mbeki', 'Oyelaran', 'Sorensen', 'Kim',
];

export interface DemoMember {
  profile: Profile;
  membership_type_id: string | null;
  membership_status: MembershipStatus;
  class_pack_type_id: string | null;
  classes_remaining: number;
  joined_at: string;
  last_visit_at: string | null;
  total_visits: number;
  lifetime_value_cents: number;
  tags: string[];
}

function randomDateOfBirth(minYear: number, maxYear: number): string {
  const year = minYear + Math.floor(rng() * (maxYear - minYear));
  const month = String(Math.floor(rng() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(rng() * 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function memberEmail(firstName: string, lastName: string, used: Set<string>): string {
  const f = firstName.toLowerCase();
  const l = lastName.toLowerCase();
  const style = rng();
  let local = style < 0.5 ? `${f}.${l}` : style < 0.75 ? `${f}${l}` : style < 0.9 ? `${f[0]}${l}` : `${f}.${l[0]}`;
  if (used.has(local)) local = `${local}${Math.floor(rng() * 90) + 10}`;
  used.add(local);
  return `${local}@example.com`;
}

function generateMembers(count: number): DemoMember[] {
  const members: DemoMember[] = [];
  const usedEmails = new Set<string>();
  const firstPool = shuffle(FIRST_NAMES);
  const lastPool = shuffle(LAST_NAMES);

  for (let i = 0; i < count; i++) {
    // Member 0 is the student persona in the demo, so keep it fixed and active.
    const pinned = i === 0;
    // Walk shuffled pools so neighbours in a list rarely share a name and no
    // first + last pair repeats across the 500 members.
    const firstName = pinned ? 'Lucia' : firstPool[i % firstPool.length];
    const lastName = pinned
      ? 'Alvarez'
      : lastPool[(i + Math.floor(i / firstPool.length) * 3) % lastPool.length];
    const email = memberEmail(firstName, lastName, usedEmails);

    // Membership distribution (Austin boutique studio estimate)
    // ~30% unlimited monthly, ~10% unlimited annual, ~15% 8/month, ~10% 4/month
    // ~29% class packs, ~6% intro/trial
    const rand = pinned ? 0 : rng();
    let membershipTypeId: string | null = null;
    let membershipStatus: MembershipStatus = 'active';
    let classPackTypeId: string | null = null;
    let classesRemaining = 0;

    if (rand < 0.30) {
      membershipTypeId = 'mem-unlimited-monthly';
    } else if (rand < 0.40) {
      membershipTypeId = 'mem-unlimited-annual';
    } else if (rand < 0.55) {
      membershipTypeId = 'mem-8-monthly';
    } else if (rand < 0.65) {
      membershipTypeId = 'mem-4-monthly';
    } else if (rand < 0.94) {
      classPackTypeId = rng() < 0.6 ? 'pack-10' : 'pack-20';
      classesRemaining = Math.floor(rng() * (classPackTypeId === 'pack-10' ? 10 : 20));
    } else {
      classPackTypeId = 'pack-intro';
      classesRemaining = Math.floor(rng() * 15);
    }

    // Some members are expired, paused, or past due
    if (!pinned && membershipTypeId && rng() < 0.1) {
      membershipStatus = rng() < 0.5 ? 'expired' : (rng() < 0.5 ? 'paused' : 'past_due');
    }

    // Visit patterns
    // Intro students joined in the last month; everyone else up to 2 years ago.
    const isIntro = classPackTypeId === 'pack-intro';
    const joinedDaysAgo = pinned
      ? 412
      : isIntro
        ? Math.floor(rng() * 28) + 3
        : Math.floor(rng() * 700) + 30;
    // Visits scale with tenure: 0.5 to 3.5 classes a week.
    const perWeek = 0.5 + rng() * 3;
    const totalVisits = pinned ? 87 : Math.max(1, Math.round((joinedDaysAgo / 7) * perWeek));
    const rawLastVisit = pinned
      ? 2
      : membershipStatus === 'active'
        ? (rng() < 0.85 ? Math.floor(rng() * 11) : Math.floor(rng() * 30) + 11)
        : Math.floor(rng() * 90) + 30;
    const lastVisitDaysAgo = Math.min(rawLastVisit, joinedDaysAgo);

    // Tags
    const tags: string[] = [];
    if (!pinned) {
      if (rng() < 0.06) tags.push('vip');
      if (rng() < 0.15) tags.push('yoga-lover');
      if (rng() < 0.1) tags.push('pilates-enthusiast');
      if (lastVisitDaysAgo > 14 && membershipStatus === 'active') tags.push('at-risk');
      if (joinedDaysAgo < 30) tags.push('new-member');
    }

    const memType = OXATL_MEMBERSHIP_TYPES.find(m => m.id === membershipTypeId);
    const monthsJoined = Math.floor(joinedDaysAgo / 30);
    const membershipSpend = memType
      ? memType.billing_cycle === 'annual'
        ? memType.price_cents * Math.ceil(monthsJoined / 12 || 1)
        : memType.price_cents * monthsJoined
      : 0;
    const visitSpend = memType ? 0 : isIntro ? 4900 : totalVisits * 1800;
    const retailSpend = Math.floor(rng() * 40) * 100 + (rng() < 0.5 ? 0 : 50);

    members.push({
      profile: {
        id: `member-${i.toString().padStart(4, '0')}`,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        email,
        phone: randomPhone(),
        avatar_url: null,
        date_of_birth: pinned ? '1991-04-18' : randomDateOfBirth(1965, 2005),
        pronouns: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        bio: null,
        specialties: [],
        certifications: [],
        instagram_handle: null,
        website: null,
        created_at: daysAgo(joinedDaysAgo),
        updated_at: daysAgo(lastVisitDaysAgo),
      },
      membership_type_id: membershipTypeId,
      membership_status: membershipStatus,
      class_pack_type_id: classPackTypeId,
      classes_remaining: classesRemaining,
      joined_at: daysAgo(joinedDaysAgo),
      last_visit_at: daysAgo(lastVisitDaysAgo),
      total_visits: totalVisits,
      lifetime_value_cents: membershipSpend + visitSpend + retailSpend,
      tags,
    });
  }

  return members;
}

// Generate 500 members (Austin boutique studio size)
export const OXATL_MEMBERS = generateMembers(500);

// ============================================================================
// SUMMARY STATS (for quick reference)
// ============================================================================

export const OXATL_STATS = {
  totalMembers: OXATL_MEMBERS.length,
  activeMembers: OXATL_MEMBERS.filter(m => m.membership_status === 'active').length,
  atRiskMembers: OXATL_MEMBERS.filter(m => m.tags.includes('at-risk')).length,
  newMembers: OXATL_MEMBERS.filter(m => m.tags.includes('new-member')).length,
  vipMembers: OXATL_MEMBERS.filter(m => m.tags.includes('vip')).length,
  totalTeachers: OXATL_TEACHERS.length,
  totalLocations: OXATL_LOCATIONS.length,
  classesPerWeek: OXATL_SCHEDULE.length,
  avgClassPrice: 1800, // $18 average
};
