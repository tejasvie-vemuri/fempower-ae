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
          {
            foreignKeyName: "circle_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "circle_posts_public"
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
          quantity: number
          responses: Json
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
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
          quantity?: number
          responses?: Json
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
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
          quantity?: number
          responses?: Json
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
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
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      event_confirmed_count: { Args: { _event_id: string }; Returns: number }
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
