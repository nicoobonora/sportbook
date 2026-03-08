/**
 * Tipi TypeScript per il database Supabase.
 * Formato compatibile con @supabase/supabase-js v2.
 * Verranno eventualmente sostituiti dai tipi generati automaticamente.
 */

export type Database = {
  public: {
    Tables: {
      clubs: {
        Row: {
          id: string
          slug: string
          name: string
          tagline: string | null
          about_text: string | null
          about_image_url: string | null
          logo_url: string | null
          cover_image_url: string | null
          primary_color: string
          accent_color: string
          address: string | null
          city: string | null
          postal_code: string | null
          region: string | null
          country: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          email: string | null
          whatsapp: string | null
          instagram_url: string | null
          facebook_url: string | null
          sports: string[]
          is_active: boolean
          is_published: boolean
          claim_status: "unclaimed" | "pending" | "claimed"
          google_place_id: string | null
          google_maps_url: string | null
          website_url: string | null
          google_rating: number | null
          google_total_ratings: number | null
          business_status: string | null
          province: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          tagline?: string | null
          about_text?: string | null
          about_image_url?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          primary_color?: string
          accent_color?: string
          address?: string | null
          city?: string | null
          postal_code?: string | null
          region?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          email?: string | null
          whatsapp?: string | null
          instagram_url?: string | null
          facebook_url?: string | null
          sports?: string[]
          is_active?: boolean
          is_published?: boolean
          claim_status?: "unclaimed" | "pending" | "claimed"
          google_place_id?: string | null
          google_maps_url?: string | null
          website_url?: string | null
          google_rating?: number | null
          google_total_ratings?: number | null
          business_status?: string | null
          province?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          tagline?: string | null
          about_text?: string | null
          about_image_url?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          primary_color?: string
          accent_color?: string
          address?: string | null
          city?: string | null
          postal_code?: string | null
          region?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          email?: string | null
          whatsapp?: string | null
          instagram_url?: string | null
          facebook_url?: string | null
          sports?: string[]
          is_active?: boolean
          is_published?: boolean
          claim_status?: "unclaimed" | "pending" | "claimed"
          google_place_id?: string | null
          google_maps_url?: string | null
          website_url?: string | null
          google_rating?: number | null
          google_total_ratings?: number | null
          business_status?: string | null
          province?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      club_admins: {
        Row: {
          id: string
          club_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      fields: {
        Row: {
          id: string
          club_id: string
          name: string
          sport: string
          description: string | null
          capacity: number
          image_url: string | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          name: string
          sport: string
          description?: string | null
          capacity?: number
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          name?: string
          sport?: string
          description?: string | null
          capacity?: number
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      slot_templates: {
        Row: {
          id: string
          club_id: string
          field_id: string
          day_of_week: number
          start_time: string
          end_time: string
          price_cents: number
          max_bookings: number
          is_active: boolean
        }
        Insert: {
          id?: string
          club_id: string
          field_id: string
          day_of_week: number
          start_time: string
          end_time: string
          price_cents?: number
          max_bookings?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          club_id?: string
          field_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          price_cents?: number
          max_bookings?: number
          is_active?: boolean
        }
        Relationships: []
      }
      slots: {
        Row: {
          id: string
          club_id: string
          field_id: string
          date: string
          start_time: string
          end_time: string
          price_cents: number
          max_bookings: number
          current_bookings: number
          is_blocked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          field_id: string
          date: string
          start_time: string
          end_time: string
          price_cents?: number
          max_bookings?: number
          current_bookings?: number
          is_blocked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          field_id?: string
          date?: string
          start_time?: string
          end_time?: string
          price_cents?: number
          max_bookings?: number
          current_bookings?: number
          is_blocked?: boolean
          created_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          club_id: string
          slot_id: string | null
          field_id: string
          date: string | null
          start_time: string | null
          end_time: string | null
          price_cents: number
          user_name: string
          user_email: string
          user_phone: string
          notes: string | null
          status: string
          confirmed_at: string | null
          rejected_at: string | null
          rejection_reason: string | null
          email_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          club_id: string
          slot_id?: string | null
          field_id: string
          date?: string | null
          start_time?: string | null
          end_time?: string | null
          price_cents?: number
          user_name: string
          user_email: string
          user_phone: string
          notes?: string | null
          status?: string
          confirmed_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          email_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          slot_id?: string | null
          field_id?: string
          date?: string | null
          start_time?: string | null
          end_time?: string | null
          price_cents?: number
          user_name?: string
          user_email?: string
          user_phone?: string
          notes?: string | null
          status?: string
          confirmed_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          email_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          club_id: string
          title: string
          body: string
          image_url: string | null
          is_pinned: boolean
          published_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          club_id: string
          title: string
          body: string
          image_url?: string | null
          is_pinned?: boolean
          published_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          title?: string
          body?: string
          image_url?: string | null
          is_pinned?: boolean
          published_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      slot_blocks: {
        Row: {
          id: string
          club_id: string
          field_id: string
          block_type: "single_date" | "recurring"
          block_date: string | null
          day_of_week: number | null
          start_time: string | null
          end_time: string | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          field_id: string
          block_type: "single_date" | "recurring"
          block_date?: string | null
          day_of_week?: number | null
          start_time?: string | null
          end_time?: string | null
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          field_id?: string
          block_type?: "single_date" | "recurring"
          block_date?: string | null
          day_of_week?: number | null
          start_time?: string | null
          end_time?: string | null
          reason?: string | null
          created_at?: string
        }
        Relationships: []
      }
      opening_hours: {
        Row: {
          id: string
          club_id: string
          field_id: string
          day_of_week: number
          start_time: string
          end_time: string
          price_per_hour_cents: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          field_id: string
          day_of_week: number
          start_time: string
          end_time: string
          price_per_hour_cents?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          field_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          price_per_hour_cents?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      claim_requests: {
        Row: {
          id: string
          club_id: string
          contact_name: string
          contact_email: string
          contact_phone: string
          role: string
          message: string | null
          status: "pending" | "approved" | "rejected"
          reviewed_at: string | null
          review_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          club_id: string
          contact_name: string
          contact_email: string
          contact_phone: string
          role?: string
          message?: string | null
          status?: "pending" | "approved" | "rejected"
          reviewed_at?: string | null
          review_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          contact_name?: string
          contact_email?: string
          contact_phone?: string
          role?: string
          message?: string | null
          status?: "pending" | "approved" | "rejected"
          reviewed_at?: string | null
          review_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cookie_configs: {
        Row: {
          id: string
          club_id: string
          analytics_enabled: boolean
          marketing_enabled: boolean
          privacy_policy_url: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          club_id: string
          analytics_enabled?: boolean
          marketing_enabled?: boolean
          privacy_policy_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          analytics_enabled?: boolean
          marketing_enabled?: boolean
          privacy_policy_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_club_admin: {
        Args: { p_club_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      confirm_booking: {
        Args: { p_booking_id: string }
        Returns: boolean
      }
      reject_booking: {
        Args: { p_booking_id: string; p_reason?: string }
        Returns: boolean
      }
      generate_slots_from_templates: {
        Args: { p_club_id: string; p_weeks?: number }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ── Tipi di convenienza derivati dalle tabelle ──
export type Club = Database["public"]["Tables"]["clubs"]["Row"]
export type ClubInsert = Database["public"]["Tables"]["clubs"]["Insert"]
export type ClubUpdate = Database["public"]["Tables"]["clubs"]["Update"]

export type ClubAdmin = Database["public"]["Tables"]["club_admins"]["Row"]
export type ClubAdminInsert = Database["public"]["Tables"]["club_admins"]["Insert"]

export type Field = Database["public"]["Tables"]["fields"]["Row"]
export type FieldInsert = Database["public"]["Tables"]["fields"]["Insert"]

export type SlotTemplate = Database["public"]["Tables"]["slot_templates"]["Row"]
export type SlotTemplateInsert = Database["public"]["Tables"]["slot_templates"]["Insert"]

export type Slot = Database["public"]["Tables"]["slots"]["Row"]
export type SlotInsert = Database["public"]["Tables"]["slots"]["Insert"]

export type Booking = Database["public"]["Tables"]["bookings"]["Row"]
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"]
export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled"

export type Announcement = Database["public"]["Tables"]["announcements"]["Row"]
export type AnnouncementInsert = Database["public"]["Tables"]["announcements"]["Insert"]

export type SlotBlock = Database["public"]["Tables"]["slot_blocks"]["Row"]
export type SlotBlockInsert = Database["public"]["Tables"]["slot_blocks"]["Insert"]

export type ClaimRequest = Database["public"]["Tables"]["claim_requests"]["Row"]
export type ClaimRequestInsert = Database["public"]["Tables"]["claim_requests"]["Insert"]

export type CookieConfig = Database["public"]["Tables"]["cookie_configs"]["Row"]
export type CookieConfigInsert = Database["public"]["Tables"]["cookie_configs"]["Insert"]

export type OpeningHours = Database["public"]["Tables"]["opening_hours"]["Row"]
export type OpeningHoursInsert = Database["public"]["Tables"]["opening_hours"]["Insert"]
