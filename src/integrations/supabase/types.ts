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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          created_at: string | null
          created_by: string | null
          decided_by: string | null
          decision_date: string | null
          description: string | null
          id: string
          project_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          decided_by?: string | null
          decision_date?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          decided_by?: string | null
          decision_date?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          project_id: string | null
          recipient_email: string
          recipient_name: string | null
          sent_by: string | null
          status: string | null
          subject: string
          task_id: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          recipient_email: string
          recipient_name?: string | null
          sent_by?: string | null
          status?: string | null
          subject: string
          task_id?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sent_by?: string | null
          status?: string | null
          subject?: string
          task_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      email_replies: {
        Row: {
          created_at: string
          email_id: string
          id: string
          reply_text: string
          sent_at: string
          sent_by: string | null
        }
        Insert: {
          created_at?: string
          email_id: string
          id?: string
          reply_text: string
          sent_at?: string
          sent_by?: string | null
        }
        Update: {
          created_at?: string
          email_id?: string
          id?: string
          reply_text?: string
          sent_at?: string
          sent_by?: string | null
        }
        Relationships: []
      }
      emails: {
        Row: {
          attachment_urls: string[] | null
          body_html: string | null
          body_text: string | null
          created_at: string
          created_task_id: string | null
          external_id: string | null
          id: string
          is_read: boolean
          original_id: string | null
          received_at: string
          sender_address: string | null
          sender_name: string
          status: string
          subject: string
        }
        Insert: {
          attachment_urls?: string[] | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          created_task_id?: string | null
          external_id?: string | null
          id?: string
          is_read?: boolean
          original_id?: string | null
          received_at?: string
          sender_address?: string | null
          sender_name: string
          status?: string
          subject: string
        }
        Update: {
          attachment_urls?: string[] | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          created_task_id?: string | null
          external_id?: string | null
          id?: string
          is_read?: boolean
          original_id?: string | null
          received_at?: string
          sender_address?: string | null
          sender_name?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_created_task_id_fkey"
            columns: ["created_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_created_task_id_fkey"
            columns: ["created_task_id"]
            isOneToOne: false
            referencedRelation: "tasks_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          created_by: string | null
          department: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          is_system_user: boolean | null
          notes: string | null
          phone: string | null
          position: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          is_system_user?: boolean | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_system_user?: boolean | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incoming_emails: {
        Row: {
          content: string | null
          created_at: string
          created_task_id: string | null
          external_id: string | null
          id: string
          is_processed: boolean | null
          received_at: string
          sender_email: string | null
          sender_name: string
          sent_at: string
          subject: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_task_id?: string | null
          external_id?: string | null
          id?: string
          is_processed?: boolean | null
          received_at?: string
          sender_email?: string | null
          sender_name: string
          sent_at?: string
          subject: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_task_id?: string | null
          external_id?: string | null
          id?: string
          is_processed?: boolean | null
          received_at?: string
          sender_email?: string | null
          sender_name?: string
          sent_at?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "incoming_emails_created_task_id_fkey"
            columns: ["created_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incoming_emails_created_task_id_fkey"
            columns: ["created_task_id"]
            isOneToOne: false
            referencedRelation: "tasks_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          email_notifications: boolean | null
          full_name: string | null
          id: string
          language: string | null
          push_notifications: boolean | null
          role: string | null
          theme_preference: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          email_notifications?: boolean | null
          full_name?: string | null
          id: string
          language?: string | null
          push_notifications?: boolean | null
          role?: string | null
          theme_preference?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          language?: string | null
          push_notifications?: boolean | null
          role?: string | null
          theme_preference?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          added_at: string | null
          added_by: string | null
          employee_id: string
          id: string
          project_id: string
          role: string | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          employee_id: string
          id?: string
          project_id: string
          role?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          employee_id?: string
          id?: string
          project_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          order_index: number
          project_id: string
          status: Database["public"]["Enums"]["stage_status"] | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order_index: number
          project_id: string
          status?: Database["public"]["Enums"]["stage_status"] | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          project_id?: string
          status?: Database["public"]["Enums"]["stage_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          progress: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          target_date: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          progress?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          target_date?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          progress?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          target_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_approval_requests: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          message: string | null
          requested_by: string
          requested_to: string
          responded_at: string | null
          status: string | null
          task_id: string
          token: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          requested_by: string
          requested_to: string
          responded_at?: string | null
          status?: string | null
          task_id: string
          token?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          requested_by?: string
          requested_to?: string
          responded_at?: string | null
          status?: string | null
          task_id?: string
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_approval_requests_requested_to_fkey"
            columns: ["requested_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_approval_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_approval_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          employee_id: string
          id: string
          task_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          employee_id: string
          id?: string
          task_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          employee_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          task_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          task_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      task_stage_assignments: {
        Row: {
          assigned_at: string | null
          id: string
          stage_id: string
          task_id: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          stage_id: string
          task_id: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          stage_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_stage_assignments_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_stage_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_stage_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          deadline_reminder_sent: boolean | null
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          project_id: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          recurrence_alert_before: string | null
          recurrence_end_date: string | null
          recurrence_last_created: string | null
          recurrence_start_date: string | null
          recurrence_type: string | null
          source: string | null
          source_reference: string | null
          stage_id: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline_reminder_sent?: boolean | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          recurrence_alert_before?: string | null
          recurrence_end_date?: string | null
          recurrence_last_created?: string | null
          recurrence_start_date?: string | null
          recurrence_type?: string | null
          source?: string | null
          source_reference?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline_reminder_sent?: boolean | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          recurrence_alert_before?: string | null
          recurrence_end_date?: string | null
          recurrence_last_created?: string | null
          recurrence_start_date?: string | null
          recurrence_type?: string | null
          source?: string | null
          source_reference?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          granted: boolean | null
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          granted?: boolean | null
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          granted?: boolean | null
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dashboard_stats: {
        Row: {
          active_employees: number | null
          active_projects: number | null
          completed_this_week: number | null
          in_progress: number | null
          pending_approval: number | null
          stuck: number | null
          urgent: number | null
        }
        Relationships: []
      }
      projects_with_stats: {
        Row: {
          completed_at: string | null
          completed_tasks_count: number | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          description: string | null
          documents_count: number | null
          id: string | null
          members_count: number | null
          name: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          progress: number | null
          stages_count: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          target_date: string | null
          tasks_count: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks_with_details: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          assignees: Json | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          description: string | null
          due_date: string | null
          id: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          project_id: string | null
          project_name: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejected_by_name: string | null
          rejection_reason: string | null
          recurrence_alert_before: string | null
          recurrence_end_date: string | null
          recurrence_last_created: string | null
          recurrence_start_date: string | null
          recurrence_type: string | null
          source: string | null
          source_reference: string | null
          stage_id: string | null
          stage_name: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_project_progress: {
        Args: { p_project_id: string }
        Returns: number
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_editor_or_admin: { Args: { _user_id: string }; Returns: boolean }
      log_action: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type?: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected" | "request_sent"
      notification_type: "task_assigned" | "task_due" | "task_completed" | "general"
      project_status: "planning" | "active" | "on_hold" | "completed"
      stage_status: "pending" | "in_progress" | "completed"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "new"
        | "approved"
        | "in_progress"
        | "partial"
        | "completed"
        | "stuck"
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
      approval_status: ["pending", "approved", "rejected", "request_sent"],
      notification_type: ["task_assigned", "task_due", "task_completed", "general"],
      project_status: ["planning", "active", "on_hold", "completed"],
      stage_status: ["pending", "in_progress", "completed"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: [
        "new",
        "approved",
        "in_progress",
        "partial",
        "completed",
        "stuck",
      ],
    },
  },
} as const
