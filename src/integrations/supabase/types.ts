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
          linkedin_url: string | null
          looking_for: string[]
          name: string
          photo_url: string | null
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
          linkedin_url?: string | null
          looking_for?: string[]
          name?: string
          photo_url?: string | null
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
          linkedin_url?: string | null
          looking_for?: string[]
          name?: string
          photo_url?: string | null
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
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
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
      [_ in never]: never
    }
    Functions: {
      event_confirmed_count: { Args: { _event_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved_member: { Args: { _user_id: string }; Returns: boolean }
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
