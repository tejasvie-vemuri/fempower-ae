export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      approval_actions: {
        Row: {
          action_type: string
          approved_at: string | null
          created_at: string
          id: string
          related_entity_id: string | null
          related_entity_type: string | null
          status: string
          summary: string
          user_id: string
        }
        Insert: {
          action_type: string
          approved_at?: string | null
          created_at?: string
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          summary: string
          user_id: string
        }
        Update: {
          action_type?: string
          approved_at?: string | null
          created_at?: string
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          summary?: string
          user_id?: string
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          created_at: string
          google_place_url: string | null
          id: string
          occasion_note: string | null
          party_size: number | null
          requested_at: string | null
          status: string
          user_id: string
          venue_id: string | null
          venue_name_freeform: string | null
        }
        Insert: {
          created_at?: string
          google_place_url?: string | null
          id?: string
          occasion_note?: string | null
          party_size?: number | null
          requested_at?: string | null
          status?: string
          user_id: string
          venue_id?: string | null
          venue_name_freeform?: string | null
        }
        Update: {
          created_at?: string
          google_place_url?: string | null
          id?: string
          occasion_note?: string | null
          party_size?: number | null
          requested_at?: string | null
          status?: string
          user_id?: string
          venue_id?: string | null
          venue_name_freeform?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "restaurant_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel: string
          content: string
          created_at: string
          id: string
          intent: string | null
          linked_entity_id: string | null
          linked_entity_type: string | null
          role: string
          user_id: string
        }
        Insert: {
          channel?: string
          content: string
          created_at?: string
          id?: string
          intent?: string | null
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          role: string
          user_id: string
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          id?: string
          intent?: string | null
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      circle_bans: {
        Row: {
          banned_by: string | null
          created_at: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          banned_by?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          banned_by?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      circle_posts: {
        Row: {
          body: string
          created_at: string
          flagged_keywords: string[]
          id: string
          is_anonymous: boolean
          published_at: string | null
          risk_level: string
          status: string
          topic_tag: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          flagged_keywords?: string[]
          id?: string
          is_anonymous?: boolean
          published_at?: string | null
          risk_level?: string
          status?: string
          topic_tag: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          flagged_keywords?: string[]
          id?: string
          is_anonymous?: boolean
          published_at?: string | null
          risk_level?: string
          status?: string
          topic_tag?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      circle_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      circle_replies: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "circle_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_reports: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "coach_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_profiles: {
        Row: {
          created_at: string
          email: string
          experience_level: string | null
          growth_area: string | null
          id: string
          name: string
          role_industry: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          experience_level?: string | null
          growth_area?: string | null
          id?: string
          name: string
          role_industry?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          experience_level?: string | null
          growth_area?: string | null
          id?: string
          name?: string
          role_industry?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      event_photos: {
        Row: {
          caption: string | null
          created_at: string
          event_id: string
          id: string
          sort_order: number
          storage_path: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          event_id: string
          id?: string
          sort_order?: number
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          event_id?: string
          id?: string
          sort_order?: number
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attendee_questions: Json
          capacity: number
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          ends_at: string | null
          id: string
          location: string | null
          price_cents: number
          slug: string
          starts_at: string
          status: string
          timezone: string
          title: string
          updated_at: string
          waitlist_enabled: boolean
        }
        Insert: {
          attendee_questions?: Json
          capacity?: number
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          price_cents?: number
          slug: string
          starts_at: string
          status?: string
          timezone?: string
          title: string
          updated_at?: string
          waitlist_enabled?: boolean
        }
        Update: {
          attendee_questions?: Json
          capacity?: number
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          price_cents?: number
          slug?: string
          starts_at?: string
          status?: string
          timezone?: string
          title?: string
          updated_at?: string
          waitlist_enabled?: boolean
        }
        Relationships: []
      }
      google_calendar_tokens: {
        Row: {
          access_token: string | null
          connected_at: string
          expires_at: string | null
          refresh_token: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string
          expires_at?: string | null
          refresh_token?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string
          expires_at?: string | null
          refresh_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      grocery_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_recurring: boolean
          item_name: string
          status: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_recurring?: boolean
          item_name: string
          status?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_recurring?: boolean
          item_name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      important_dates: {
        Row: {
          created_at: string
          date: string
          id: string
          label: string
          person_id: string
          recurrence: string
          reminder_lead_days: number[]
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          label: string
          person_id: string
          recurrence?: string
          reminder_lead_days?: number[]
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          label?: string
          person_id?: string
          recurrence?: string
          reminder_lead_days?: number[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "important_dates_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          entry_date: string
          free_text: string | null
          gratitude_text: string | null
          id: string
          learning_text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date?: string
          free_text?: string | null
          gratitude_text?: string | null
          id?: string
          learning_text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          free_text?: string | null
          gratitude_text?: string | null
          id?: string
          learning_text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      journal_nudge_settings: {
        Row: {
          consecutive_misses: number
          current_interval_days: number
          enabled: boolean
          last_entry_at: string | null
          last_nudge_sent_at: string | null
          preferred_time: string
          user_id: string
        }
        Insert: {
          consecutive_misses?: number
          current_interval_days?: number
          enabled?: boolean
          last_entry_at?: string | null
          last_nudge_sent_at?: string | null
          preferred_time?: string
          user_id: string
        }
        Update: {
          consecutive_misses?: number
          current_interval_days?: number
          enabled?: boolean
          last_entry_at?: string | null
          last_nudge_sent_at?: string | null
          preferred_time?: string
          user_id?: string
        }
        Relationships: []
      }
      learn_courses: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          emoji: string | null
          id: string
          published_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          emoji?: string | null
          id?: string
          published_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          emoji?: string | null
          id?: string
          published_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      learn_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learn_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_progress: {
        Row: {
          completed_at: string
          id: string
          user_id: string
          wing_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          user_id: string
          wing_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          user_id?: string
          wing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_progress_wing_id_fkey"
            columns: ["wing_id"]
            isOneToOne: false
            referencedRelation: "learn_wings"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_reflections: {
        Row: {
          content: string
          created_at: string
          id: string
          is_shared: boolean
          updated_at: string
          user_id: string
          wing_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_shared?: boolean
          updated_at?: string
          user_id: string
          wing_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_shared?: boolean
          updated_at?: string
          user_id?: string
          wing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_reflections_wing_id_fkey"
            columns: ["wing_id"]
            isOneToOne: false
            referencedRelation: "learn_wings"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_resources: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          title: string
          url: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          title: string
          url: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learn_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_wings: {
        Row: {
          context_content: string
          created_at: string
          display_order: number
          estimated_minutes: number | null
          extension_content: string
          featured_until: string | null
          id: string
          module_id: string
          reflection_prompt: string
          title: string
          updated_at: string
        }
        Insert: {
          context_content?: string
          created_at?: string
          display_order?: number
          estimated_minutes?: number | null
          extension_content?: string
          featured_until?: string | null
          id?: string
          module_id: string
          reflection_prompt?: string
          title: string
          updated_at?: string
        }
        Update: {
          context_content?: string
          created_at?: string
          display_order?: number
          estimated_minutes?: number | null
          extension_content?: string
          featured_until?: string | null
          id?: string
          module_id?: string
          reflection_prompt?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_wings_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learn_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lm_profile: {
        Row: {
          assistant_name: string
          city: string | null
          created_at: string
          last_digest_sent_date: string | null
          notification_prefs: Json
          plan_tier: string
          preferred_name: string | null
          trial_started_at: string
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          assistant_name?: string
          city?: string | null
          created_at?: string
          last_digest_sent_date?: string | null
          notification_prefs?: Json
          plan_tier?: string
          preferred_name?: string | null
          trial_started_at?: string
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          assistant_name?: string
          city?: string | null
          created_at?: string
          last_digest_sent_date?: string | null
          notification_prefs?: Json
          plan_tier?: string
          preferred_name?: string | null
          trial_started_at?: string
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      meetup_reports: {
        Row: {
          created_at: string
          id: string
          meetup_id: string
          notes: string | null
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          meetup_id: string
          notes?: string | null
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          meetup_id?: string
          notes?: string | null
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetup_reports_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "meetups"
            referencedColumns: ["id"]
          },
        ]
      }
      meetup_rsvps: {
        Row: {
          created_at: string
          id: string
          meetup_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meetup_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meetup_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetup_rsvps_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "meetups"
            referencedColumns: ["id"]
          },
        ]
      }
      meetups: {
        Row: {
          capacity: number | null
          created_at: string
          emirate: string | null
          host_id: string
          host_visibility: string
          id: string
          note: string | null
          place: string
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          emirate?: string | null
          host_id: string
          host_visibility?: string
          id?: string
          note?: string | null
          place: string
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          emirate?: string | null
          host_id?: string
          host_visibility?: string
          id?: string
          note?: string | null
          place?: string
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_milestones: {
        Row: {
          category: string
          circle_post_id: string | null
          created_at: string
          custom_text: string | null
          id: string
          milestone_key: string
          status: string
          user_id: string
        }
        Insert: {
          category: string
          circle_post_id?: string | null
          created_at?: string
          custom_text?: string | null
          id?: string
          milestone_key: string
          status?: string
          user_id: string
        }
        Update: {
          category?: string
          circle_post_id?: string | null
          created_at?: string
          custom_text?: string | null
          id?: string
          milestone_key?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_milestones_circle_post_id_fkey"
            columns: ["circle_post_id"]
            isOneToOne: false
            referencedRelation: "circle_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      member_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bio: string | null
          city: string | null
          company: string | null
          created_at: string
          expertise_tags: string[]
          id: string
          industry: string | null
          instagram_url: string | null
          interests: string[]
          is_trusted_poster: boolean
          linkedin_url: string | null
          looking_for: string[]
          name: string
          photo_url: string | null
          profile_completion_email_sent_at: string | null
          role: string | null
          search_tsv: unknown
          status: string
          updated_at: string
          user_id: string
          website_url: string | null
          why_here: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          expertise_tags?: string[]
          id?: string
          industry?: string | null
          instagram_url?: string | null
          interests?: string[]
          is_trusted_poster?: boolean
          linkedin_url?: string | null
          looking_for?: string[]
          name?: string
          photo_url?: string | null
          profile_completion_email_sent_at?: string | null
          role?: string | null
          search_tsv?: unknown
          status?: string
          updated_at?: string
          user_id: string
          website_url?: string | null
          why_here?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          expertise_tags?: string[]
          id?: string
          industry?: string | null
          instagram_url?: string | null
          interests?: string[]
          is_trusted_poster?: boolean
          linkedin_url?: string | null
          looking_for?: string[]
          name?: string
          photo_url?: string | null
          profile_completion_email_sent_at?: string | null
          role?: string | null
          search_tsv?: unknown
          status?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
          why_here?: string | null
        }
        Relationships: []
      }
      member_spotlights: {
        Row: {
          active_from: string
          active_until: string
          created_at: string
          id: string
          story: string
          user_id: string
        }
        Insert: {
          active_from?: string
          active_until: string
          created_at?: string
          id?: string
          story: string
          user_id: string
        }
        Update: {
          active_from?: string
          active_until?: string
          created_at?: string
          id?: string
          story?: string
          user_id?: string
        }
        Relationships: []
      }
      occasion_calendar: {
        Row: {
          created_at: string
          day: number | null
          id: string
          month: number
          name: string
          note: string | null
        }
        Insert: {
          created_at?: string
          day?: number | null
          id?: string
          month: number
          name: string
          note?: string | null
        }
        Update: {
          created_at?: string
          day?: number | null
          id?: string
          month?: number
          name?: string
          note?: string | null
        }
        Relationships: []
      }
      people: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          relationship: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          relationship?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      places_cache: {
        Row: {
          cached_at: string
          opening_hours: Json | null
          photos: Json | null
          place_id: string
          rating: number | null
          review_count: number | null
        }
        Insert: {
          cached_at?: string
          opening_hours?: Json | null
          photos?: Json | null
          place_id: string
          rating?: number | null
          review_count?: number | null
        }
        Update: {
          cached_at?: string
          opening_hours?: Json | null
          photos?: Json | null
          place_id?: string
          rating?: number | null
          review_count?: number | null
        }
        Relationships: []
      }
      plan_config: {
        Row: {
          id: number
          price_amount: number
          price_currency: string
          trial_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          price_amount?: number
          price_currency?: string
          trial_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          price_amount?: number
          price_currency?: string
          trial_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          phone: string | null
          updated_at: string
          user_id: string
          welcome_email_sent: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          welcome_email_sent?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          welcome_email_sent?: boolean
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          amount_paid_cents: number
          cancellation_reason: string | null
          cancellation_requested_at: string | null
          checked_in_at: string | null
          created_at: string
          currency: string
          event_id: string
          guests: Json
          id: string
          payment_checkout_url: string | null
          payment_intent_id: string | null
          payment_operation_id: string | null
          payment_provider: string | null
          quantity: number
          refund_id: string | null
          responses: Json
          status: string
          ticket_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid_cents?: number
          cancellation_reason?: string | null
          cancellation_requested_at?: string | null
          checked_in_at?: string | null
          created_at?: string
          currency?: string
          event_id: string
          guests?: Json
          id?: string
          payment_checkout_url?: string | null
          payment_intent_id?: string | null
          payment_operation_id?: string | null
          payment_provider?: string | null
          quantity?: number
          refund_id?: string | null
          responses?: Json
          status?: string
          ticket_code?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid_cents?: number
          cancellation_reason?: string | null
          cancellation_requested_at?: string | null
          checked_in_at?: string | null
          created_at?: string
          currency?: string
          event_id?: string
          guests?: Json
          id?: string
          payment_checkout_url?: string | null
          payment_intent_id?: string | null
          payment_operation_id?: string | null
          payment_provider?: string | null
          quantity?: number
          refund_id?: string | null
          responses?: Json
          status?: string
          ticket_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          person_id: string | null
          source: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          person_id?: string | null
          source?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          person_id?: string | null
          source?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_venues: {
        Row: {
          area: string | null
          created_at: string
          cuisine: string | null
          emirate: string | null
          google_place_id: string | null
          id: string
          name: string
          phone: string | null
          vibe_tags: string[]
          website: string | null
        }
        Insert: {
          area?: string | null
          created_at?: string
          cuisine?: string | null
          emirate?: string | null
          google_place_id?: string | null
          id?: string
          name: string
          phone?: string | null
          vibe_tags?: string[]
          website?: string | null
        }
        Update: {
          area?: string | null
          created_at?: string
          cuisine?: string | null
          emirate?: string | null
          google_place_id?: string | null
          id?: string
          name?: string
          phone?: string | null
          vibe_tags?: string[]
          website?: string | null
        }
        Relationships: []
      }
      site_images: {
        Row: {
          alt: string | null
          category: string
          created_at: string
          id: string
          image_path: string
          is_active: boolean
          link_url: string | null
          sort_order: number
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          alt?: string | null
          category: string
          created_at?: string
          id?: string
          image_path: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          alt?: string | null
          category?: string
          created_at?: string
          id?: string
          image_path?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          event_id: string
          id: string
          notified_at: string | null
          position: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          notified_at?: string | null
          position: number
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          notified_at?: string | null
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      circle_posts_public: {
        Row: {
          author_name: string | null
          author_photo_url: string | null
          body: string | null
          created_at: string | null
          id: string | null
          is_anonymous: boolean | null
          published_at: string | null
          status: string | null
          topic_tag: string | null
          user_id: string | null
        }
        Relationships: []
      }
      meetup_hosts_public: {
        Row: {
          display_name: string | null
          host_id: string | null
          meetup_id: string | null
          photo_url: string | null
        }
        Relationships: []
      }
      meetups_public: {
        Row: {
          capacity: number | null
          created_at: string | null
          emirate: string | null
          host_id: string | null
          host_visibility: string | null
          id: string | null
          note: string | null
          place: string | null
          starts_at: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      confirm_free_registration: {
        Args: {
          _event_id: string
          _guests?: Json
          _quantity?: number
          _responses?: Json
        }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      event_confirmed_count: { Args: { _event_id: string }; Returns: number }
      get_circle_posts_public: {
        Args: never
        Returns: {
          author_name: string
          author_photo_url: string
          body: string
          created_at: string
          id: string
          is_anonymous: boolean
          published_at: string
          status: string
          topic_tag: string
          user_id: string
        }[]
      }
      get_meetup_hosts_public: {
        Args: never
        Returns: {
          display_name: string
          host_id: string
          meetup_id: string
          photo_url: string
        }[]
      }
      get_meetups_public: {
        Args: never
        Returns: {
          capacity: number
          created_at: string
          emirate: string
          host_id: string
          host_visibility: string
          id: string
          note: string
          place: string
          starts_at: string
          status: string
          title: string
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved_member: { Args: { _user_id: string }; Returns: boolean }
      is_circle_banned: { Args: { _user_id: string }; Returns: boolean }
      is_circle_trusted: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      request_registration_cancellation: {
        Args: { _reason: string; _registration_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
