export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Functions: {
      approve_admin: {
        Args: {
          admin_id: string;
          approve: boolean;
          approver_id: string;
        };
        Returns: {
          success: boolean;
          message: string;
        };
      };
    };
    Tables: {
      admins: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'superadmin' | 'moderator' | 'pending'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'superadmin' | 'moderator' | 'pending'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'superadmin' | 'moderator' | 'pending'
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          date_of_birth: string | null
          phone_number: string | null
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          date_of_birth?: string | null
          phone_number?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          date_of_birth?: string | null
          phone_number?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
      }
      doctors: {
        Row: {
          id: string
          email: string
          full_name: string
          specialization: string | null
          license_number: string | null
          years_of_experience: number | null
          status: 'pending' | 'approved' | 'suspended' | 'rejected'
          verification_documents: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          specialization?: string | null
          license_number?: string | null
          years_of_experience?: number | null
          status?: 'pending' | 'approved' | 'suspended' | 'rejected'
          verification_documents?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          specialization?: string | null
          license_number?: string | null
          years_of_experience?: number | null
          status?: 'pending' | 'approved' | 'suspended' | 'rejected'
          verification_documents?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          user_id: string
          doctor_id: string
          status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
          start_time: string
          end_time: string
          meeting_link: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          doctor_id: string
          status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
          start_time: string
          end_time: string
          meeting_link?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          doctor_id?: string
          status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
          start_time?: string
          end_time?: string
          meeting_link?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          type: 'user_feedback' | 'session_report' | 'incident_report'
          content: Json
          submitted_by: string
          status: 'pending' | 'reviewed' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'user_feedback' | 'session_report' | 'incident_report'
          content: Json
          submitted_by: string
          status?: 'pending' | 'reviewed' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'user_feedback' | 'session_report' | 'incident_report'
          content?: Json
          submitted_by?: string
          status?: 'pending' | 'reviewed' | 'archived'
          created_at?: string
          updated_at?: string
        }
      },
      email_templates: {
        Row: {
          id: string;
          name: string;
          subject: string;
          body: string;
          variables: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subject: string;
          body: string;
          variables?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subject?: string;
          body?: string;
          variables?: Json;
          created_at?: string;
          updated_at?: string;
        };
      },
      audit_logs: {
        Row: {
          id: string;
          admin_id: string | null;
          action: string;
          table_name: string;
          record_id: string;
          changes: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          action: string;
          table_name: string;
          record_id: string;
          changes: Json;
          created_at?: string;
        };
        Update: {
          admin_id?: string | null;
          action?: string;
          table_name?: string;
          record_id?: string;
          changes?: Json;
          created_at?: string;
        };
      }
    }
  }
}