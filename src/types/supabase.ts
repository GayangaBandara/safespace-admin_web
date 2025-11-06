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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_suggestions: {
        Row: {
          created_at: string
          id: string
          suggestions: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          suggestions: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          suggestions?: Json
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          changes: Json | null
          created_at: string
          id: string
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          changes?: Json | null
          created_at?: string
          id?: string
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          changes?: Json | null
          created_at?: string
          id?: string
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      doctor_profiles: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          approved_at: string | null
          approved_by: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_approved: boolean | null
          license_document_url: string | null
          license_number: string
          phone_number: string | null
          postal_code: string | null
          qualification_document_url: string | null
          specialization: string
          state: string | null
          updated_at: string | null
          years_experience: number
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_approved?: boolean | null
          license_document_url?: string | null
          license_number: string
          phone_number?: string | null
          postal_code?: string | null
          qualification_document_url?: string | null
          specialization: string
          state?: string | null
          updated_at?: string | null
          years_experience: number
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_approved?: boolean | null
          license_document_url?: string | null
          license_number?: string
          phone_number?: string | null
          postal_code?: string | null
          qualification_document_url?: string | null
          specialization?: string
          state?: string | null
          updated_at?: string | null
          years_experience?: number
        }
        Relationships: []
      }
      doctor_registration_requests: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          country: string | null
          email: string
          full_name: string
          id: string
          license_document_url: string | null
          license_number: string
          password: string
          phone_number: string | null
          postal_code: string | null
          qualification_document_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specialization: string
          status: string | null
          submitted_at: string | null
          years_experience: number
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country?: string | null
          email: string
          full_name: string
          id?: string
          license_document_url?: string | null
          license_number: string
          password: string
          phone_number?: string | null
          postal_code?: string | null
          qualification_document_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialization: string
          status?: string | null
          submitted_at?: string | null
          years_experience: number
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country?: string | null
          email?: string
          full_name?: string
          id?: string
          license_document_url?: string | null
          license_number?: string
          password?: string
          phone_number?: string | null
          postal_code?: string | null
          qualification_document_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialization?: string
          status?: string | null
          submitted_at?: string | null
          years_experience?: number
        }
        Relationships: []
      }
      doctors: {
        Row: {
          category: string
          created_at: string | null
          dominant_state: string | null
          email: string
          id: number
          name: string
          phone: string
          profilepicture: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          dominant_state?: string | null
          email: string
          id?: number
          name: string
          phone: string
          profilepicture?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          dominant_state?: string | null
          email?: string
          id?: number
          name?: string
          phone?: string
          profilepicture?: string | null
        }
        Relationships: []
      }
      entertainments: {
        Row: {
          category: string
          cover_img_url: string | null
          created_at: string
          description: string | null
          dominant_state: string | null
          id: number
          media_file_url: string | null
          mood_states: string[]
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          category: string
          cover_img_url?: string | null
          created_at?: string
          description?: string | null
          dominant_state?: string | null
          id?: number
          media_file_url?: string | null
          mood_states?: string[]
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_img_url?: string | null
          created_at?: string
          description?: string | null
          dominant_state?: string | null
          id?: number
          media_file_url?: string | null
          mood_states?: string[]
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      mental_state_reports: {
        Row: {
          confidence: number
          created_at: string | null
          dominant_state: string
          id: string
          report: Json
          user_id: string
        }
        Insert: {
          confidence: number
          created_at?: string | null
          dominant_state: string
          id?: string
          report: Json
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string | null
          dominant_state?: string
          id?: string
          report?: Json
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          is_bot: boolean
          message: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_bot?: boolean
          message: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_bot?: boolean
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_appointments: {
        Row: {
          doctor_id: number
          id: string
          requested_at: string | null
          responded_at: string | null
          response_note: string | null
          status: string
          user_id: string
        }
        Insert: {
          doctor_id: number
          id?: string
          requested_at?: string | null
          responded_at?: string | null
          response_note?: string | null
          status?: string
          user_id: string
        }
        Update: {
          doctor_id?: number
          id?: string
          requested_at?: string | null
          responded_at?: string | null
          response_note?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      recommended_doctor: {
        Row: {
          created_at: string | null
          doctor_id: number
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          doctor_id: number
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          doctor_id?: number
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      recommended_entertainments: {
        Row: {
          entertainment_id: number
          id: string
          matched_state: string
          recommended_at: string | null
          user_id: string
        }
        Insert: {
          entertainment_id: number
          id?: string
          matched_state: string
          recommended_at?: string | null
          user_id: string
        }
        Update: {
          entertainment_id?: number
          id?: string
          matched_state?: string
          recommended_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_entertainment"
            columns: ["entertainment_id"]
            isOneToOne: false
            referencedRelation: "entertainments"
            referencedColumns: ["id"]
          },
        ]
      }
      recommended_suggestions: {
        Row: {
          created_at: string | null
          dominant_state: string
          id: string
          recommended_at: string | null
          suggestion_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dominant_state: string
          id?: string
          recommended_at?: string | null
          suggestion_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          dominant_state?: string
          id?: string
          recommended_at?: string | null
          suggestion_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommended_suggestions_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          category: string
          description: string
          id: number
          logo: string
          suggestion: string
        }
        Insert: {
          category: string
          description: string
          id?: number
          logo: string
          suggestion: string
        }
        Update: {
          category?: string
          description?: string
          id?: number
          logo?: string
          suggestion?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role_type"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string | null
          id: string
          phone_number: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name?: string | null
          id: string
          phone_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_table_permissions: {
        Row: {
          has_delete_policy: boolean | null
          has_insert_policy: boolean | null
          has_select_policy: boolean | null
          has_update_policy: boolean | null
          tablename: unknown
        }
        Relationships: []
      }
    }
    Functions: {
      create_admin: {
        Args: {
          admin_email: string
          admin_full_name: string
          admin_password: string
          admin_role?: string
        }
        Returns: string
      }
    }
    Enums: {
      entertainment_type: "Music Track" | "Meditation" | "Breathing Exercise"
      user_role_type: "patient" | "doctor" | "admin"
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
    ? DefaultSchema["CompositeTypes"][Extract<CompositeTypeName, keyof DefaultSchema["CompositeTypes"]>]
    : never

export const Constants = {
  public: {
    Enums: {
      entertainment_type: ["Music Track", "Meditation", "Breathing Exercise"],
      user_role_type: ["patient", "doctor", "admin"],
    },
  },
} as const

// Type aliases for easier access
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type UserRoleInsert = Database['public']['Tables']['user_roles']['Insert'];
export type UserRoleUpdate = Database['public']['Tables']['user_roles']['Update'];
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];