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
      admin_actions: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_name: string
          id: string
          metadata: Json | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_name: string
          id?: string
          metadata?: Json | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_name?: string
          id?: string
          metadata?: Json | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          cta_text: string | null
          cta_url: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          link_url: string | null
          media_desktop_url: string
          media_mobile_url: string | null
          media_tablet_url: string | null
          order: number
          starts_at: string | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          media_desktop_url: string
          media_mobile_url?: string | null
          media_tablet_url?: string | null
          order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          media_desktop_url?: string
          media_mobile_url?: string | null
          media_tablet_url?: string | null
          order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          created_at: string
          id: string
          image_large: string | null
          image_ptbr: string | null
          image_small: string | null
          name: string
          number: string | null
          rarity: string | null
          set_id: string | null
          supertype: string | null
          types: string[] | null
        }
        Insert: {
          created_at?: string
          id: string
          image_large?: string | null
          image_ptbr?: string | null
          image_small?: string | null
          name: string
          number?: string | null
          rarity?: string | null
          set_id?: string | null
          supertype?: string | null
          types?: string[] | null
        }
        Update: {
          created_at?: string
          id?: string
          image_large?: string | null
          image_ptbr?: string | null
          image_small?: string | null
          name?: string
          number?: string | null
          rarity?: string | null
          set_id?: string | null
          supertype?: string | null
          types?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          category: string
          content: string | null
          created_at: string
          id: string
          slug: string
          thumbnail: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string
          id?: string
          slug: string
          thumbnail?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          id?: string
          slug?: string
          thumbnail?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          card_id: string
          city: string | null
          condition: string
          created_at: string
          entity_id: string | null
          entity_type: string
          finish: string
          id: string
          language: string
          price_cents: number
          quantity: number
          seller_id: string
          shipping_type: string
          state: string | null
          status: string
          updated_at: string
        }
        Insert: {
          card_id: string
          city?: string | null
          condition?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          finish?: string
          id?: string
          language?: string
          price_cents: number
          quantity?: number
          seller_id: string
          shipping_type?: string
          state?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          card_id?: string
          city?: string | null
          condition?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          finish?: string
          id?: string
          language?: string
          price_cents?: number
          quantity?: number
          seller_id?: string
          shipping_type?: string
          state?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_items: {
        Row: {
          brand: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          image: string | null
          name: string
        }
        Insert: {
          brand?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          name: string
        }
        Update: {
          brand?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          cpf: string | null
          created_at: string
          display_name: string
          id: string
          phone: string | null
          reputation_score: number | null
          state: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          display_name?: string
          id: string
          phone?: string | null
          reputation_score?: number | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          display_name?: string
          id?: string
          phone?: string | null
          reputation_score?: number | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sets: {
        Row: {
          created_at: string
          id: string
          logo: string | null
          name: string
          printed_total: number | null
          release_date: string | null
          series: string | null
          symbol: string | null
          total: number | null
        }
        Insert: {
          created_at?: string
          id: string
          logo?: string | null
          name: string
          printed_total?: number | null
          release_date?: string | null
          series?: string | null
          symbol?: string | null
          total?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          logo?: string | null
          name?: string
          printed_total?: number | null
          release_date?: string | null
          series?: string | null
          symbol?: string | null
          total?: number | null
        }
        Relationships: []
      }
      sync_status: {
        Row: {
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          started_at: string | null
          status: string
          synced_cards: number | null
          synced_sets: number | null
          total_cards: number | null
          total_sets: number | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          synced_cards?: number | null
          synced_sets?: number | null
          total_cards?: number | null
          total_sets?: number | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          synced_cards?: number | null
          synced_sets?: number | null
          total_cards?: number | null
          total_sets?: number | null
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          city: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          is_featured: boolean
          name: string
          state: string | null
          type: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          is_featured?: boolean
          name: string
          state?: string | null
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          name?: string
          state?: string | null
          type?: string
          updated_at?: string
          video_url?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      card_market_stats: {
        Row: {
          avg_price_cents: number | null
          card_id: string | null
          last_offer_at: string | null
          min_price_cents: number | null
          offers_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_list_listings: {
        Args: never
        Returns: {
          card_id: string
          city: string | null
          condition: string
          created_at: string
          entity_id: string | null
          entity_type: string
          finish: string
          id: string
          language: string
          price_cents: number
          quantity: number
          seller_id: string
          shipping_type: string
          state: string | null
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "listings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_list_profiles: {
        Args: never
        Returns: {
          avatar_url: string | null
          city: string | null
          cpf: string | null
          created_at: string
          display_name: string
          id: string
          phone: string | null
          reputation_score: number | null
          state: string | null
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      check_email_exists: { Args: { _email: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
