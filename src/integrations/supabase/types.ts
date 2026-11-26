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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      competencies: {
        Row: {
          area: string
          description: string
          id: string
          occupation: string
          sort: number
        }
        Insert: {
          area: string
          description: string
          id?: string
          occupation: string
          sort?: number
        }
        Update: {
          area?: string
          description?: string
          id?: string
          occupation?: string
          sort?: number
        }
        Relationships: []
      }
      courses: {
        Row: {
          competency_area: string | null
          cost_estimate: string
          country: string
          course_type: string
          delivery: string
          description: string
          duration_weeks: number
          id: string
          occupation: string
          provider: string
          title: string
        }
        Insert: {
          competency_area?: string | null
          cost_estimate: string
          country: string
          course_type: string
          delivery: string
          description: string
          duration_weeks: number
          id?: string
          occupation: string
          provider: string
          title: string
        }
        Update: {
          competency_area?: string | null
          cost_estimate?: string
          country?: string
          course_type?: string
          delivery?: string
          description?: string
          duration_weeks?: number
          id?: string
          occupation?: string
          provider?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          country_of_origin: string | null
          created_at: string
          current_country: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          profession: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          country_of_origin?: string | null
          created_at?: string
          current_country?: string | null
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          profession?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          country_of_origin?: string | null
          created_at?: string
          current_country?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          profession?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      qualification_documents: {
        Row: {
          created_at: string
          doc_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          qualification_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          qualification_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          qualification_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualification_documents_qualification_id_fkey"
            columns: ["qualification_id"]
            isOneToOne: false
            referencedRelation: "qualifications"
            referencedColumns: ["id"]
          },
        ]
      }
      qualifications: {
        Row: {
          country: string
          created_at: string
          field: string
          id: string
          institution: string
          level: string
          notes: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["qual_status"]
          target_country: string
          target_occupation: string
          title: string
          updated_at: string
          user_id: string
          year_completed: number | null
        }
        Insert: {
          country: string
          created_at?: string
          field?: string
          id?: string
          institution: string
          level?: string
          notes?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["qual_status"]
          target_country?: string
          target_occupation?: string
          title: string
          updated_at?: string
          user_id: string
          year_completed?: number | null
        }
        Update: {
          country?: string
          created_at?: string
          field?: string
          id?: string
          institution?: string
          level?: string
          notes?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["qual_status"]
          target_country?: string
          target_occupation?: string
          title?: string
          updated_at?: string
          user_id?: string
          year_completed?: number | null
        }
        Relationships: []
      }
      skill_assessments: {
        Row: {
          competency_id: string
          evidence: string | null
          id: string
          rating: number
          updated_at: string
          user_id: string
          years_experience: number
        }
        Insert: {
          competency_id: string
          evidence?: string | null
          id?: string
          rating: number
          updated_at?: string
          user_id: string
          years_experience?: number
        }
        Update: {
          competency_id?: string
          evidence?: string | null
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "skill_assessments_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
        ]
      }
      status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          qualification_id: string
          status: Database["public"]["Enums"]["qual_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          qualification_id: string
          status: Database["public"]["Enums"]["qual_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          qualification_id?: string
          status?: Database["public"]["Enums"]["qual_status"]
        }
        Relationships: [
          {
            foreignKeyName: "status_history_qualification_id_fkey"
            columns: ["qualification_id"]
            isOneToOne: false
            referencedRelation: "qualifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      qual_status:
        | "submitted"
        | "under_review"
        | "info_requested"
        | "review_complete"
        | "referred"
        | "withdrawn"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      qual_status: [
        "submitted",
        "under_review",
        "info_requested",
        "review_complete",
        "referred",
        "withdrawn",
      ],
    },
  },
} as const
