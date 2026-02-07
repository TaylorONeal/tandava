/**
 * Supabase Database Types
 *
 * These types define the shape of every table in the Tandava database.
 * They are consumed by the Supabase client via `createClient<Database>()`
 * to provide end-to-end type safety on all queries.
 *
 * To regenerate after schema changes:
 *   npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
 *
 * The types below are hand-authored to match the migration in
 * supabase/migrations/001_initial_schema.sql and serve as the source of
 * truth until the project is connected to a live Supabase instance.
 */

export type UserRole = "member" | "instructor" | "studio_owner" | "studio_staff" | "platform_admin";

export type BookingStatus = "confirmed" | "cancelled" | "waitlisted" | "no_show" | "completed";

export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "trialing" | "paused";

export type MessageStatus = "unread" | "read" | "archived" | "replied";

export type FeedbackType = "class_feedback" | "studio_inquiry" | "platform_feedback" | "support_ticket";

export type EmailProvider = "resend" | "sendgrid" | "smtp" | "console";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          avatar_url: string | null;
          role: UserRole;
          phone: string | null;
          bio: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          marketing_consent: boolean;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          avatar_url?: string | null;
          role?: UserRole;
          phone?: string | null;
          bio?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          marketing_consent?: boolean;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };

      studios: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          address: string;
          city: string;
          state: string;
          zip: string;
          country: string;
          latitude: number | null;
          longitude: number | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          styles: string[];
          amenities: string[];
          cancellation_policy: string | null;
          stripe_account_id: string | null;
          stripe_onboarding_complete: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          address: string;
          city: string;
          state: string;
          zip: string;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          styles?: string[];
          amenities?: string[];
          cancellation_policy?: string | null;
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["studios"]["Insert"]>;
      };

      studio_members: {
        Row: {
          id: string;
          studio_id: string;
          user_id: string;
          role: "owner" | "manager" | "instructor" | "front_desk";
          created_at: string;
        };
        Insert: {
          id?: string;
          studio_id: string;
          user_id: string;
          role: "owner" | "manager" | "instructor" | "front_desk";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["studio_members"]["Insert"]>;
      };

      classes: {
        Row: {
          id: string;
          studio_id: string;
          instructor_id: string;
          title: string;
          description: string | null;
          style: string;
          level: "beginner" | "intermediate" | "advanced" | "all_levels";
          is_heated: boolean;
          duration_minutes: number;
          capacity: number;
          starts_at: string;
          ends_at: string;
          recurrence_rule: string | null;
          location_name: string | null;
          price_cents: number | null;
          drop_in_price_cents: number | null;
          is_cancelled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          studio_id: string;
          instructor_id: string;
          title: string;
          description?: string | null;
          style: string;
          level?: "beginner" | "intermediate" | "advanced" | "all_levels";
          is_heated?: boolean;
          duration_minutes: number;
          capacity: number;
          starts_at: string;
          ends_at: string;
          recurrence_rule?: string | null;
          location_name?: string | null;
          price_cents?: number | null;
          drop_in_price_cents?: number | null;
          is_cancelled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["classes"]["Insert"]>;
      };

      bookings: {
        Row: {
          id: string;
          class_id: string;
          user_id: string;
          studio_id: string;
          status: BookingStatus;
          checked_in_at: string | null;
          cancelled_at: string | null;
          waitlist_position: number | null;
          payment_intent_id: string | null;
          amount_paid_cents: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          user_id: string;
          studio_id: string;
          status?: BookingStatus;
          checked_in_at?: string | null;
          cancelled_at?: string | null;
          waitlist_position?: number | null;
          payment_intent_id?: string | null;
          amount_paid_cents?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };

      memberships: {
        Row: {
          id: string;
          user_id: string;
          studio_id: string;
          plan_name: string;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          status: SubscriptionStatus;
          current_period_start: string | null;
          current_period_end: string | null;
          classes_remaining: number | null;
          is_unlimited: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          studio_id: string;
          plan_name: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          classes_remaining?: number | null;
          is_unlimited?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["memberships"]["Insert"]>;
      };

      messages: {
        Row: {
          id: string;
          type: FeedbackType;
          studio_id: string | null;
          class_id: string | null;
          sender_id: string | null;
          sender_name: string | null;
          sender_email: string | null;
          subject: string;
          body: string;
          status: MessageStatus;
          ip_hash: string | null;
          honeypot: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: FeedbackType;
          studio_id?: string | null;
          class_id?: string | null;
          sender_id?: string | null;
          sender_name?: string | null;
          sender_email?: string | null;
          subject: string;
          body: string;
          status?: MessageStatus;
          ip_hash?: string | null;
          honeypot?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };

      email_log: {
        Row: {
          id: string;
          to_email: string;
          template: string;
          subject: string;
          provider: EmailProvider;
          provider_message_id: string | null;
          status: "sent" | "failed" | "bounced";
          error: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          to_email: string;
          template: string;
          subject: string;
          provider: EmailProvider;
          provider_message_id?: string | null;
          status?: "sent" | "failed" | "bounced";
          error?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_log"]["Insert"]>;
      };

      platform_announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          author_id: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          author_id: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["platform_announcements"]["Insert"]>;
      };
    };

    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      booking_status: BookingStatus;
      subscription_status: SubscriptionStatus;
      message_status: MessageStatus;
      feedback_type: FeedbackType;
    };
  };
}

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Studio = Database["public"]["Tables"]["studios"]["Row"];
export type StudioMember = Database["public"]["Tables"]["studio_members"]["Row"];
export type Class = Database["public"]["Tables"]["classes"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Membership = Database["public"]["Tables"]["memberships"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type EmailLogEntry = Database["public"]["Tables"]["email_log"]["Row"];
export type PlatformAnnouncement = Database["public"]["Tables"]["platform_announcements"]["Row"];
