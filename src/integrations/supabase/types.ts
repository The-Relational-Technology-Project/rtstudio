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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_credentials: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_usage: {
        Row: {
          created_at: string
          id: string
          message_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      commitments: {
        Row: {
          commitment_text: string
          completed_at: string | null
          created_at: string | null
          id: string
          source_chat_context: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          commitment_text: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          source_chat_context?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          commitment_text?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          source_chat_context?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      connection_requests: {
        Row: {
          conversation_snippet: string | null
          created_at: string
          id: string
          item_id: string
          item_title: string
          item_type: string
          message: string
          requester_user_id: string | null
          status: string
        }
        Insert: {
          conversation_snippet?: string | null
          created_at?: string
          id?: string
          item_id: string
          item_title: string
          item_type: string
          message?: string
          requester_user_id?: string | null
          status?: string
        }
        Update: {
          conversation_snippet?: string | null
          created_at?: string
          id?: string
          item_id?: string
          item_title?: string
          item_type?: string
          message?: string
          requester_user_id?: string | null
          status?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          story_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          story_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          contributor_email: string
          contributor_name: string
          created_at: string
          description: string
          id: string
          image_paths: string[]
          links: string[]
          promoted_item_id: string | null
          promoted_item_type: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          contributor_email: string
          contributor_name: string
          created_at?: string
          description: string
          id?: string
          image_paths?: string[]
          links?: string[]
          promoted_item_id?: string | null
          promoted_item_type?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          contributor_email?: string
          contributor_name?: string
          created_at?: string
          description?: string
          id?: string
          image_paths?: string[]
          links?: string[]
          promoted_item_id?: string | null
          promoted_item_type?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      gift_build_requests: {
        Row: {
          builder_email: string | null
          builder_name: string
          conversation_context: string | null
          created_at: string
          id: string
          idea_summary: string
          idea_title: string
          neighborhood: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          builder_email?: string | null
          builder_name: string
          conversation_context?: string | null
          created_at?: string
          id?: string
          idea_summary: string
          idea_title: string
          neighborhood?: string | null
          source?: string
          user_id?: string | null
        }
        Update: {
          builder_email?: string | null
          builder_name?: string
          conversation_context?: string | null
          created_at?: string
          id?: string
          idea_summary?: string
          idea_title?: string
          neighborhood?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      library_bookmarks: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      library_embeddings: {
        Row: {
          content_hash: string
          created_at: string | null
          embedding: string
          id: string
          item_id: string
          item_type: string
        }
        Insert: {
          content_hash: string
          created_at?: string | null
          embedding: string
          id?: string
          item_id: string
          item_type: string
        }
        Update: {
          content_hash?: string
          created_at?: string | null
          embedding?: string
          id?: string
          item_id?: string
          item_type?: string
        }
        Relationships: []
      }
      library_studio_assignments: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          studio_slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          studio_slug: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          studio_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_studio_assignments_studio_slug_fkey"
            columns: ["studio_slug"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["slug"]
          },
        ]
      }
      magic_link_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      network_feed_cache: {
        Row: {
          fetched_at: string
          id: string
          items: Json
        }
        Insert: {
          fetched_at?: string
          id?: string
          items?: Json
        }
        Update: {
          fetched_at?: string
          id?: string
          items?: Json
        }
        Relationships: []
      }
      play_group_signups: {
        Row: {
          created_at: string
          id: string
          tool_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tool_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tool_name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_coding_experience: string | null
          created_at: string | null
          display_name: string | null
          dreams: string | null
          email: string | null
          full_name: string | null
          id: string
          local_tech_ecosystem: string | null
          neighborhood: string | null
          neighborhood_description: string | null
          profile_completed: boolean | null
          tech_familiarity: string | null
          updated_at: string | null
        }
        Insert: {
          ai_coding_experience?: string | null
          created_at?: string | null
          display_name?: string | null
          dreams?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          local_tech_ecosystem?: string | null
          neighborhood?: string | null
          neighborhood_description?: string | null
          profile_completed?: boolean | null
          tech_familiarity?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_coding_experience?: string | null
          created_at?: string | null
          display_name?: string | null
          dreams?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          local_tech_ecosystem?: string | null
          neighborhood?: string | null
          neighborhood_description?: string | null
          profile_completed?: boolean | null
          tech_familiarity?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prompts: {
        Row: {
          category: string
          created_at: string
          description: string | null
          example_prompt: string
          id: string
          organizer_consent_to_contact: boolean
          parent_tool_id: string | null
          sort_order: number
          tags: string[]
          title: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          example_prompt: string
          id?: string
          organizer_consent_to_contact?: boolean
          parent_tool_id?: string | null
          sort_order?: number
          tags?: string[]
          title: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          example_prompt?: string
          id?: string
          organizer_consent_to_contact?: boolean
          parent_tool_id?: string | null
          sort_order?: number
          tags?: string[]
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_parent_tool_id_fkey"
            columns: ["parent_tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      prototype_counter: {
        Row: {
          count: number
          id: string
          updated_at: string
        }
        Insert: {
          count?: number
          id?: string
          updated_at?: string
        }
        Update: {
          count?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      prototypes: {
        Row: {
          builder_id: string
          created_at: string
          generated_code: string
          id: string
          is_shared: boolean
          model: string
          prompt: string
          refinement_of: string | null
          share_id: string | null
          share_view_count: number
          tokens_used: number | null
          tool_name: string | null
        }
        Insert: {
          builder_id: string
          created_at?: string
          generated_code: string
          id?: string
          is_shared?: boolean
          model?: string
          prompt: string
          refinement_of?: string | null
          share_id?: string | null
          share_view_count?: number
          tokens_used?: number | null
          tool_name?: string | null
        }
        Update: {
          builder_id?: string
          created_at?: string
          generated_code?: string
          id?: string
          is_shared?: boolean
          model?: string
          prompt?: string
          refinement_of?: string | null
          share_id?: string | null
          share_view_count?: number
          tokens_used?: number | null
          tool_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prototypes_refinement_of_fkey"
            columns: ["refinement_of"]
            isOneToOne: false
            referencedRelation: "prototypes"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_attempts: {
        Row: {
          attempted_at: string
          endpoint: string
          id: string
          identifier: string
        }
        Insert: {
          attempted_at?: string
          endpoint: string
          id?: string
          identifier: string
        }
        Update: {
          attempted_at?: string
          endpoint?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      serviceberries: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          reason: string
          reference_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          reason: string
          reference_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          reason?: string
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          attribution: string
          created_at: string
          full_story_text: string | null
          id: string
          image_urls: string[] | null
          organizer_consent_to_contact: boolean
          sort_order: number
          story_text: string
          tags: string[]
          title: string | null
          user_id: string | null
        }
        Insert: {
          attribution: string
          created_at?: string
          full_story_text?: string | null
          id?: string
          image_urls?: string[] | null
          organizer_consent_to_contact?: boolean
          sort_order?: number
          story_text: string
          tags?: string[]
          title?: string | null
          user_id?: string | null
        }
        Update: {
          attribution?: string
          created_at?: string
          full_story_text?: string | null
          id?: string
          image_urls?: string[] | null
          organizer_consent_to_contact?: boolean
          sort_order?: number
          story_text?: string
          tags?: string[]
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      story_notes: {
        Row: {
          author_name: string
          created_at: string
          id: string
          note_text: string
          story_id: string
          user_id: string | null
        }
        Insert: {
          author_name: string
          created_at?: string
          id?: string
          note_text: string
          story_id: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          created_at?: string
          id?: string
          note_text?: string
          story_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_notes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_log: {
        Row: {
          created_at: string
          description: string
          id: string
          log_type: string
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          log_type?: string
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          log_type?: string
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      studio_tags: {
        Row: {
          color: string | null
          created_at: string
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      studios: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      tool_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          tool_name: string
          user_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          tool_name: string
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          tool_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tool_notes: {
        Row: {
          author_name: string
          created_at: string
          id: string
          note_text: string
          tool_id: string
          user_id: string | null
        }
        Insert: {
          author_name: string
          created_at?: string
          id?: string
          note_text: string
          tool_id: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          created_at?: string
          id?: string
          note_text?: string
          tool_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_notes_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          created_at: string
          description: string
          github_url: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_joinable: boolean
          lovable_url: string | null
          name: string
          organizer_consent_to_contact: boolean
          screenshot_urls: string[] | null
          sort_order: number
          summary: string | null
          tags: string[]
          tool_category: string
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          github_url?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_joinable?: boolean
          lovable_url?: string | null
          name: string
          organizer_consent_to_contact?: boolean
          screenshot_urls?: string[] | null
          sort_order?: number
          summary?: string | null
          tags?: string[]
          tool_category?: string
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          github_url?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_joinable?: boolean
          lovable_url?: string | null
          name?: string
          organizer_consent_to_contact?: boolean
          screenshot_urls?: string[] | null
          sort_order?: number
          summary?: string | null
          tags?: string[]
          tool_category?: string
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vision_board_pins: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          position_x: number | null
          position_y: number | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          position_x?: number | null
          position_y?: number | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          position_x?: number | null
          position_y?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_builders_overview: {
        Args: never
        Returns: {
          commitments_count: number
          created_at: string
          display_name: string
          email: string
          id: string
          last_active: string
          neighborhood: string
          prototypes_count: number
          serviceberries_total: number
        }[]
      }
      award_serviceberries: {
        Args: {
          p_amount: number
          p_reason: string
          p_reference_id?: string
          p_user_id: string
        }
        Returns: undefined
      }
      get_app_config: { Args: { _key: string }; Returns: string }
      increment_prototype_counter: { Args: never; Returns: undefined }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      match_library_items: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          item_id: string
          item_type: string
          similarity: number
        }[]
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
    Enums: {},
  },
} as const
