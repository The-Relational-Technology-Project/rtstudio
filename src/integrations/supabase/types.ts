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
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          example_prompt: string
          id?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          example_prompt?: string
          id?: string
          title?: string
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
          story_text: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          attribution: string
          created_at?: string
          full_story_text?: string | null
          id?: string
          image_urls?: string[] | null
          story_text: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          attribution?: string
          created_at?: string
          full_story_text?: string | null
          id?: string
          image_urls?: string[] | null
          story_text?: string
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
          id: string
          name: string
          url: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          name: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          url?: string
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
      award_serviceberries: {
        Args: {
          p_amount: number
          p_reason: string
          p_reference_id?: string
          p_user_id: string
        }
        Returns: undefined
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
