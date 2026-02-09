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
// STUDIO
// ============================================================================

export const OXATL_STUDIO: Studio = {
  id: 'demo-studio-oxatl-001',
  name: 'Oxatl Yoga',
  slug: 'oxatl-yoga',
  description: 'A sanctuary for movement, breath, and community. Offering yoga, pilates, and meditation in a welcoming space for all levels.',
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
  waitlist_limit: 5,
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

// Female teachers - Famous singers + Cute animals
const FEMALE_TEACHERS: Omit<DemoStaff, 'role' | 'pay_rate_cents' | 'pay_type'>[] = [
  {
    profile: makeTeacherProfile('Beyonce', 'Pangolin', 'beyonce.pangolin'),
    location_ids: ['loc-central', 'loc-east'],
    specialties: ['Vinyasa', 'Power Yoga'],
    bio: 'Fierce flows that build strength and confidence. 10+ years teaching experience.',
  },
  {
    profile: makeTeacherProfile('Adele', 'Capybara', 'adele.capybara'),
    location_ids: ['loc-central'],
    specialties: ['Yin', 'Restorative'],
    bio: 'Deep, soulful practices focused on release and restoration.',
  },
  {
    profile: makeTeacherProfile('Rihanna', 'Quokka', 'rihanna.quokka'),
    location_ids: ['loc-east', 'loc-north'],
    specialties: ['Vinyasa', 'Hatha'],
    bio: 'Creative sequences with an island vibe. All levels welcome.',
  },
  {
    profile: makeTeacherProfile('Taylor', 'Otter', 'taylor.otter'),
    location_ids: ['loc-north'],
    specialties: ['Hatha', 'Meditation'],
    bio: 'Thoughtful, alignment-focused classes with poetic cues.',
  },
  {
    profile: makeTeacherProfile('Ariana', 'Hedgehog', 'ariana.hedgehog'),
    location_ids: ['loc-central', 'loc-east'],
    specialties: ['Pilates', 'Vinyasa'],
    bio: 'High-energy classes that challenge and inspire.',
  },
  {
    profile: makeTeacherProfile('Dua', 'Axolotl', 'dua.axolotl'),
    location_ids: ['loc-east'],
    specialties: ['Vinyasa', 'Hatha'],
    bio: 'Dynamic flows with great music. Future nostalgia on the mat.',
  },
  {
    profile: makeTeacherProfile('Billie', 'Chinchilla', 'billie.chinchilla'),
    location_ids: ['loc-north'],
    specialties: ['Yin', 'Meditation'],
    bio: 'Quiet, introspective practices. Safe space for all bodies.',
  },
  {
    profile: makeTeacherProfile('Lizzo', 'Wombat', 'lizzo.wombat'),
    location_ids: ['loc-central'],
    specialties: ['Vinyasa', 'Power Yoga'],
    bio: '100% that teacher. Body-positive flows for every body.',
  },
  {
    profile: makeTeacherProfile('Shakira', 'Fennec', 'shakira.fennec'),
    location_ids: ['loc-east', 'loc-central'],
    specialties: ['Pilates', 'Hatha'],
    bio: 'Core-focused classes. Hips don\'t lie, neither does good alignment.',
  },
  {
    profile: makeTeacherProfile('Celine', 'Manatee', 'celine.manatee'),
    location_ids: ['loc-north'],
    specialties: ['Restorative', 'Yin'],
    bio: 'Heart-opening practices with powerful presence.',
  },
  {
    profile: makeTeacherProfile('Whitney', 'Puffin', 'whitney.puffin'),
    location_ids: ['loc-central'],
    specialties: ['Vinyasa', 'Meditation'],
    bio: 'Classes that lift you higher. Spiritual and grounding.',
  },
  {
    profile: makeTeacherProfile('Cher', 'Sloth', 'cher.sloth'),
    location_ids: ['loc-east'],
    specialties: ['Hatha', 'Yin'],
    bio: 'Timeless wisdom, slow and steady. Turn back time on stress.',
  },
  {
    profile: makeTeacherProfile('Madonna', 'Tapir', 'madonna.tapir'),
    location_ids: ['loc-central', 'loc-north'],
    specialties: ['Vinyasa', 'Power Yoga'],
    bio: 'Reinventing the flow every class. Material girl, spiritual practice.',
  },
  {
    profile: makeTeacherProfile('Gwen', 'Narwhal', 'gwen.narwhal'),
    location_ids: ['loc-east'],
    specialties: ['Pilates', 'Vinyasa'],
    bio: 'No doubt about it - strong, stylish sequences.',
  },
  {
    profile: makeTeacherProfile('Dolly', 'Alpaca', 'dolly.alpaca'),
    location_ids: ['loc-north'],
    specialties: ['Hatha', 'Meditation'],
    bio: 'Working 9 to 5? Wind down with gentle, joyful yoga.',
  },
];

// Male teachers
const MALE_TEACHERS: Omit<DemoStaff, 'role' | 'pay_rate_cents' | 'pay_type'>[] = [
  {
    profile: makeTeacherProfile('Travis', 'Jones', 'travis.jones'),
    location_ids: ['loc-central', 'loc-east'],
    specialties: ['Vinyasa', 'Power Yoga'],
    bio: 'Athletic flows with hip-hop energy. Former athlete turned yogi.',
  },
  {
    profile: makeTeacherProfile('Patrick', 'Jones', 'patrick.jones'),
    location_ids: ['loc-north'],
    specialties: ['Hatha', 'Meditation'],
    bio: 'Precise alignment and mindful movement. Yoga for all athletes.',
  },
  {
    profile: makeTeacherProfile('Chris', 'Mahomes', 'chris.mahomes'),
    location_ids: ['loc-central'],
    specialties: ['Pilates', 'Vinyasa'],
    bio: 'MVP of the mat. Strong, strategic sequences.',
  },
];

function makeTeacherProfile(firstName: string, lastName: string, emailPrefix: string): Profile {
  return {
    id: `teacher-${emailPrefix.replace('.', '-')}`,
    first_name: firstName,
    last_name: lastName,
    display_name: `${firstName} ${lastName}`,
    email: `${emailPrefix}@oxatlyoga.com`,
    phone: `+1 (512) 555-${String(Math.floor(1000 + Math.random() * 9000))}`,
    avatar_url: null,
    date_of_birth: randomDateOfBirth(1980, 1998),
    pronouns: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    bio: '',
    specialties: [],
    certifications: ['RYT-200'],
    instagram_handle: `@${emailPrefix.replace('.', '_')}`,
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
    last_name: 'Trench',
    display_name: 'Mariana Trench',
    email: 'mariana@oxatlyoga.com',
    phone: '+1 (512) 555-0100',
    avatar_url: null,
    date_of_birth: '1985-06-15',
    pronouns: 'she/her',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    bio: 'Founder of Oxatl Yoga. 15+ years practicing, 10 years teaching. E-RYT 500, YACEP.',
    specialties: ['Vinyasa', 'Yin', 'Meditation', 'Teacher Training'],
    certifications: ['E-RYT 500', 'YACEP'],
    instagram_handle: '@mariana.trench.yoga',
    website: 'https://oxatlyoga.com',
    created_at: '2022-03-15T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  role: 'owner',
  location_ids: ['loc-central', 'loc-east', 'loc-north'],
  specialties: ['Vinyasa', 'Yin', 'Meditation', 'Teacher Training'],
  pay_rate_cents: 0,
  pay_type: 'salary',
  bio: 'Founder of Oxatl Yoga. 15+ years practicing, 10 years teaching.',
};

export const OXATL_FRONT_DESK: DemoStaff = {
  profile: {
    id: 'staff-frontdesk-cassia',
    first_name: 'Cassia',
    last_name: 'Ray',
    display_name: 'Cassia Ray',
    email: 'cassia@oxatlyoga.com',
    phone: '+1 (512) 555-0101',
    avatar_url: null,
    date_of_birth: '1995-09-22',
    pronouns: 'she/her',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    bio: 'Keeping Oxatl running smoothly. Yoga teacher in training!',
    specialties: [],
    certifications: [],
    instagram_handle: '@cassia.ray',
    website: null,
    created_at: '2023-06-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  role: 'front_desk',
  location_ids: ['loc-central'],
  specialties: [],
  pay_rate_cents: 1800, // $18/hour
  pay_type: 'hourly',
  bio: 'Keeping Oxatl running smoothly. Yoga teacher in training!',
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
    description: 'A dynamic practice linking breath with movement. Build heat, strength, and flexibility through creative sequences.',
    duration_minutes: 60,
    default_capacity: 30,
    color: '#E57373',
    category: 'yoga',
  },
  {
    id: 'class-yin',
    studio_id: OXATL_STUDIO.id,
    name: 'Yin Yoga',
    description: 'Slow, meditative practice holding poses for 3-5 minutes. Targets deep connective tissues and promotes relaxation.',
    duration_minutes: 75,
    default_capacity: 25,
    color: '#64B5F6',
    category: 'yoga',
  },
  {
    id: 'class-hatha',
    studio_id: OXATL_STUDIO.id,
    name: 'Hatha Yoga',
    description: 'Classic yoga practice with longer holds and focus on alignment. Perfect for all levels.',
    duration_minutes: 60,
    default_capacity: 28,
    color: '#81C784',
    category: 'yoga',
  },
  {
    id: 'class-pilates',
    studio_id: OXATL_STUDIO.id,
    name: 'Pilates',
    description: 'Core-strengthening practice improving posture, flexibility, and body awareness.',
    duration_minutes: 55,
    default_capacity: 20,
    color: '#FFB74D',
    category: 'movement',
  },
  {
    id: 'class-meditation',
    studio_id: OXATL_STUDIO.id,
    name: 'Meditation',
    description: 'Guided meditation practice. Cultivate stillness, clarity, and inner peace.',
    duration_minutes: 45,
    default_capacity: 20,
    color: '#9575CD',
    category: 'mindfulness',
  },
  {
    id: 'class-power',
    studio_id: OXATL_STUDIO.id,
    name: 'Power Yoga',
    description: 'Vigorous, fitness-based vinyasa. Expect to sweat, strengthen, and transform.',
    duration_minutes: 60,
    default_capacity: 25,
    color: '#F06292',
    category: 'yoga',
  },
  {
    id: 'class-restorative',
    studio_id: OXATL_STUDIO.id,
    name: 'Restorative',
    description: 'Deeply relaxing practice using props. Perfect for stress relief and recovery.',
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
    description: 'Learn self-massage techniques using balls and rollers to release tension and improve mobility. Take home practical tools for daily practice.',
    duration_hours: 2,
    price_cents: 4500,
    category: 'workshop',
    teacher_id: 'teacher-shakira-fennec',
  },
  {
    name: 'Breathwork Journey',
    description: 'Explore transformative breathing techniques from various traditions. Includes pranayama, holotropic breathwork, and integration practices.',
    duration_hours: 2.5,
    price_cents: 5500,
    category: 'workshop',
    teacher_id: 'teacher-billie-chinchilla',
  },
  {
    name: 'Mantra & Movement',
    description: 'Combine the power of sacred sound with gentle movement. No singing experience needed - just an open heart.',
    duration_hours: 2,
    price_cents: 4000,
    category: 'workshop',
    teacher_id: 'teacher-whitney-puffin',
  },
  {
    name: 'Glow Yoga',
    description: 'Vinyasa flow under black lights with glow-in-the-dark body paint. A unique, playful experience that brings out your inner light.',
    duration_hours: 1.5,
    price_cents: 3500,
    category: 'special',
    teacher_id: 'teacher-lizzo-wombat',
  },
  {
    name: 'Yin & Live Music',
    description: 'Deep yin practice accompanied by live acoustic music. Let sound carry you deeper into stillness.',
    duration_hours: 2,
    price_cents: 4500,
    category: 'workshop',
    teacher_id: 'teacher-adele-capybara',
  },
  {
    name: 'Sound Bath',
    description: 'Immerse yourself in healing vibrations of crystal bowls, gongs, and chimes. Simply lie back and receive.',
    duration_hours: 1.5,
    price_cents: 3500,
    category: 'wellness',
    teacher_id: 'teacher-celine-manatee',
  },
  {
    name: 'Full Moon Ceremony',
    description: 'Monthly gathering to honor the full moon cycle. Includes gentle movement, meditation, journaling, and community connection.',
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
    description: 'Best value - 2 months free with annual commitment',
    price_cents: 179000,
    billing_cycle: 'annual',
    classes_per_period: null,
    features: ['Unlimited classes', 'All 3 locations', '15% retail discount', 'Priority workshop booking', 'Guest passes (4/month)', 'Free mat storage'],
  },
  {
    id: 'mem-8-monthly',
    studio_id: OXATL_STUDIO.id,
    name: '8 Classes/Month',
    description: 'Perfect for 2x/week practice',
    price_cents: 12900,
    billing_cycle: 'monthly',
    classes_per_period: 8,
    features: ['8 classes per month', 'All 3 locations', 'Rollover up to 4 classes'],
  },
  {
    id: 'mem-4-monthly',
    studio_id: OXATL_STUDIO.id,
    name: '4 Classes/Month',
    description: 'Great for weekly practice',
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
    description: 'Flexible pack for drop-in practice',
    price_cents: 18000,
    class_count: 10,
    validity_days: 90,
  },
  {
    id: 'pack-20',
    studio_id: OXATL_STUDIO.id,
    name: '20-Class Pack',
    description: 'Better value for regular practice',
    price_cents: 32000,
    class_count: 20,
    validity_days: 180,
  },
  {
    id: 'pack-5',
    studio_id: OXATL_STUDIO.id,
    name: '5-Class Pack',
    description: 'Try us out',
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

const FIRST_NAMES = [
  'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn',
  'Abigail', 'Emily', 'Elizabeth', 'Sofia', 'Avery', 'Ella', 'Scarlett', 'Grace', 'Chloe', 'Victoria',
  'Riley', 'Aria', 'Lily', 'Aurora', 'Zoey', 'Penelope', 'Luna', 'Camila', 'Layla', 'Mila',
  'James', 'Liam', 'Noah', 'Oliver', 'Elijah', 'Lucas', 'Mason', 'Ethan', 'Alexander', 'Henry',
  'Sebastian', 'Jack', 'Aiden', 'Owen', 'Samuel', 'Ryan', 'Nathan', 'Leo', 'Daniel', 'Matthew',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
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
  const year = minYear + Math.floor(Math.random() * (maxYear - minYear));
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function randomPastDate(daysBack: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date.toISOString();
}

function generateMembers(count: number): DemoMember[] {
  const members: DemoMember[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;

    // Membership distribution (Austin/Seattle boutique studio estimate)
    // ~30% unlimited monthly, ~10% unlimited annual, ~15% 8/month, ~10% 4/month
    // ~20% class packs, ~15% intro/trial
    const rand = Math.random();
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
    } else if (rand < 0.85) {
      classPackTypeId = Math.random() < 0.6 ? 'pack-10' : 'pack-20';
      classesRemaining = Math.floor(Math.random() * (classPackTypeId === 'pack-10' ? 10 : 20));
    } else {
      classPackTypeId = 'pack-intro';
      classesRemaining = Math.floor(Math.random() * 15);
    }

    // Some members are expired, paused, or past due
    if (membershipTypeId && Math.random() < 0.1) {
      membershipStatus = Math.random() < 0.5 ? 'expired' : (Math.random() < 0.5 ? 'paused' : 'past_due');
    }

    // Visit patterns
    const joinedDaysAgo = Math.floor(Math.random() * 730) + 30; // 1 month to 2 years
    const totalVisits = Math.floor(Math.random() * 200) + 5;
    const lastVisitDaysAgo = membershipStatus === 'active'
      ? Math.floor(Math.random() * 30)
      : Math.floor(Math.random() * 90) + 30;

    // Tags
    const tags: string[] = [];
    if (Math.random() < 0.2) tags.push('vip');
    if (Math.random() < 0.15) tags.push('yoga-lover');
    if (Math.random() < 0.1) tags.push('pilates-enthusiast');
    if (lastVisitDaysAgo > 14 && membershipStatus === 'active') tags.push('at-risk');
    if (joinedDaysAgo < 30) tags.push('new-member');

    members.push({
      profile: {
        id: `member-${i.toString().padStart(4, '0')}`,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        email,
        phone: `+1 (512) 555-${String(Math.floor(1000 + Math.random() * 9000))}`,
        avatar_url: null,
        date_of_birth: randomDateOfBirth(1965, 2005),
        pronouns: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        bio: null,
        specialties: [],
        certifications: [],
        instagram_handle: null,
        website: null,
        created_at: randomPastDate(joinedDaysAgo),
        updated_at: randomPastDate(lastVisitDaysAgo),
      },
      membership_type_id: membershipTypeId,
      membership_status: membershipStatus,
      class_pack_type_id: classPackTypeId,
      classes_remaining: classesRemaining,
      joined_at: randomPastDate(joinedDaysAgo),
      last_visit_at: randomPastDate(lastVisitDaysAgo),
      total_visits: totalVisits,
      lifetime_value_cents: totalVisits * 1800 + (membershipTypeId ? 17900 * Math.floor(joinedDaysAgo / 30) : 0),
      tags,
    });
  }

  return members;
}

// Generate 500 members (Austin/Seattle boutique studio size)
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
