/**
 * Generated from the live Supabase schema (project dxfjstgnokncqabnumkr) via the Supabase MCP.
 * Re-generate with `mcp__supabase__generate_typescript_types` after a migration. Do not edit by hand.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          question_id: string
          response: string | null
          user_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          question_id: string
          response?: string | null
          user_id: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          question_id?: string
          response?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          created_at: string
          deadline: string | null
          id: string
          intake: string | null
          notes: string | null
          program: string
          sort_index: number
          stage: string
          university: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          id?: string
          intake?: string | null
          notes?: string | null
          program: string
          sort_index?: number
          stage?: string
          university: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          id?: string
          intake?: string | null
          notes?: string | null
          program?: string
          sort_index?: number
          stage?: string
          university?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          detail: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          detail?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          detail?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      deadlines: {
        Row: {
          application_id: string | null
          category: string | null
          created_at: string
          done: boolean
          due_date: string
          id: string
          note: string | null
          title: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          category?: string | null
          created_at?: string
          done?: boolean
          due_date: string
          id?: string
          note?: string | null
          title: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          category?: string | null
          created_at?: string
          done?: boolean
          due_date?: string
          id?: string
          note?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: Json | null
          id: string
          item_key: string | null
          kind: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json | null
          id?: string
          item_key?: string | null
          kind: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json | null
          id?: string
          item_key?: string | null
          kind?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          exam_id: string
          form_id: string | null
          id: string
          rubric: Json | null
          score: Json | null
          started_at: string
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          exam_id: string
          form_id?: string | null
          id?: string
          rubric?: Json | null
          score?: Json | null
          started_at?: string
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          exam_id?: string
          form_id?: string | null
          id?: string
          rubric?: Json | null
          score?: Json | null
          started_at?: string
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "exam_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_forms: {
        Row: {
          created_at: string
          exam_id: string
          form: Json
          id: string
          is_seed: boolean
          mode: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          form: Json
          id?: string
          is_seed?: boolean
          mode?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          form?: Json
          id?: string
          is_seed?: boolean
          mode?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          current_degree: string | null
          current_grade: string | null
          display_name: string | null
          german_level: string | null
          home_country: string | null
          id: string
          target_field: string | null
          target_intake: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_degree?: string | null
          current_grade?: string | null
          display_name?: string | null
          german_level?: string | null
          home_country?: string | null
          id: string
          target_field?: string | null
          target_intake?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_degree?: string | null
          current_grade?: string | null
          display_name?: string | null
          german_level?: string | null
          home_country?: string | null
          id?: string
          target_field?: string | null
          target_intake?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      roadmap_items: {
        Row: {
          id: string
          status: string
          step_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          status?: string
          step_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          status?: string
          step_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seen_topics: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          topic: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      srs_cards: {
        Row: {
          back: string
          deck: string
          due_at: string
          easiness: number
          front: string
          hint: string | null
          id: string
          interval_days: number
          repetition: number
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          deck?: string
          due_at?: string
          easiness?: number
          front: string
          hint?: string | null
          id?: string
          interval_days?: number
          repetition?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          deck?: string
          due_at?: string
          easiness?: number
          front?: string
          hint?: string | null
          id?: string
          interval_days?: number
          repetition?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
