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
      budget_items: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          description: string
          id: string
          insert_id: string | null
          issue_id: string
          lineup_item_id: string | null
          notes: string | null
          page_count: number | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by: string
          description: string
          id?: string
          insert_id?: string | null
          issue_id: string
          lineup_item_id?: string | null
          notes?: string | null
          page_count?: number | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          insert_id?: string | null
          issue_id?: string
          lineup_item_id?: string | null
          notes?: string | null
          page_count?: number | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_insert_id_fkey"
            columns: ["insert_id"]
            isOneToOne: false
            referencedRelation: "inserts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_lineup_item_id_fkey"
            columns: ["lineup_item_id"]
            isOneToOne: false
            referencedRelation: "lineup_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      editor_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          recipient_id: string | null
          sender_id: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id?: string | null
          sender_id: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id?: string | null
          sender_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "editor_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insert_suppliers: {
        Row: {
          created_at: string
          id: string
          insert_id: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          insert_id: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          id?: string
          insert_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insert_suppliers_insert_id_fkey"
            columns: ["insert_id"]
            isOneToOne: false
            referencedRelation: "inserts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insert_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inserts: {
        Row: {
          assignment_sent: boolean | null
          assignment_sent_by: string | null
          assignment_sent_date: string | null
          content_type: string | null
          created_at: string
          description: string | null
          designer_notes: string | null
          files_ready: boolean
          id: string
          is_designed: boolean
          issue_id: string
          name: string
          notes: string | null
          responsible_editor_id: string | null
          supplier_id: string | null
          text_ready: boolean
          updated_at: string
        }
        Insert: {
          assignment_sent?: boolean | null
          assignment_sent_by?: string | null
          assignment_sent_date?: string | null
          content_type?: string | null
          created_at?: string
          description?: string | null
          designer_notes?: string | null
          files_ready?: boolean
          id?: string
          is_designed?: boolean
          issue_id: string
          name: string
          notes?: string | null
          responsible_editor_id?: string | null
          supplier_id?: string | null
          text_ready?: boolean
          updated_at?: string
        }
        Update: {
          assignment_sent?: boolean | null
          assignment_sent_by?: string | null
          assignment_sent_date?: string | null
          content_type?: string | null
          created_at?: string
          description?: string | null
          designer_notes?: string | null
          files_ready?: boolean
          id?: string
          is_designed?: boolean
          issue_id?: string
          name?: string
          notes?: string | null
          responsible_editor_id?: string | null
          supplier_id?: string | null
          text_ready?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inserts_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inserts_responsible_editor_id_fkey"
            columns: ["responsible_editor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inserts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_editors: {
        Row: {
          created_at: string
          editor_id: string
          id: string
          issue_id: string
        }
        Insert: {
          created_at?: string
          editor_id: string
          id?: string
          issue_id: string
        }
        Update: {
          created_at?: string
          editor_id?: string
          id?: string
          issue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_editors_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_editors_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          created_at: string
          created_by: string
          design_start_date: string
          distribution_month: string
          hebrew_month: string | null
          id: string
          issue_number: number
          magazine_id: string
          print_date: string
          sketch_close_date: string
          status: string
          template_pages: number
          theme: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          design_start_date: string
          distribution_month: string
          hebrew_month?: string | null
          id?: string
          issue_number: number
          magazine_id: string
          print_date: string
          sketch_close_date: string
          status?: string
          template_pages: number
          theme: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          design_start_date?: string
          distribution_month?: string
          hebrew_month?: string | null
          id?: string
          issue_number?: number
          magazine_id?: string
          print_date?: string
          sketch_close_date?: string
          status?: string
          template_pages?: number
          theme?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_magazine_id_fkey"
            columns: ["magazine_id"]
            isOneToOne: false
            referencedRelation: "magazines"
            referencedColumns: ["id"]
          },
        ]
      }
      lineup_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          lineup_item_id: string
          updated_at: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          lineup_item_id: string
          updated_at?: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          lineup_item_id?: string
          updated_at?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lineup_comments_lineup_item_id_fkey"
            columns: ["lineup_item_id"]
            isOneToOne: false
            referencedRelation: "lineup_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineup_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lineup_item_suppliers: {
        Row: {
          created_at: string
          id: string
          lineup_item_id: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lineup_item_id: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lineup_item_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lineup_item_suppliers_lineup_item_id_fkey"
            columns: ["lineup_item_id"]
            isOneToOne: false
            referencedRelation: "lineup_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineup_item_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      lineup_items: {
        Row: {
          assignment_sent: boolean | null
          assignment_sent_by: string | null
          assignment_sent_date: string | null
          content: string
          content_type: string | null
          created_at: string
          designer_notes: string | null
          files_ready: boolean
          id: string
          is_designed: boolean
          issue_id: string
          notes: string | null
          page_end: number
          page_start: number
          responsible_editor_id: string | null
          source: string | null
          supplier_id: string | null
          text_ready: boolean
          updated_at: string
        }
        Insert: {
          assignment_sent?: boolean | null
          assignment_sent_by?: string | null
          assignment_sent_date?: string | null
          content: string
          content_type?: string | null
          created_at?: string
          designer_notes?: string | null
          files_ready?: boolean
          id?: string
          is_designed?: boolean
          issue_id: string
          notes?: string | null
          page_end: number
          page_start: number
          responsible_editor_id?: string | null
          source?: string | null
          supplier_id?: string | null
          text_ready?: boolean
          updated_at?: string
        }
        Update: {
          assignment_sent?: boolean | null
          assignment_sent_by?: string | null
          assignment_sent_date?: string | null
          content?: string
          content_type?: string | null
          created_at?: string
          designer_notes?: string | null
          files_ready?: boolean
          id?: string
          is_designed?: boolean
          issue_id?: string
          notes?: string | null
          page_end?: number
          page_start?: number
          responsible_editor_id?: string | null
          source?: string | null
          supplier_id?: string | null
          text_ready?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lineup_items_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineup_items_responsible_editor_id_fkey"
            columns: ["responsible_editor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineup_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      magazines: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      magic_link_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          full_name: string | null
          id: string
          invited_by: string | null
          invited_by_name: string | null
          role: string
          token: string
          used: boolean | null
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          invited_by_name?: string | null
          role: string
          token: string
          used?: boolean | null
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          invited_by_name?: string | null
          role?: string
          token?: string
          used?: boolean | null
          used_at?: string | null
        }
        Relationships: []
      }
      page_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          page_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          page_count: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          page_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminder_settings: {
        Row: {
          created_at: string
          editor_reminder_2days: boolean
          editor_reminder_overdue: boolean
          id: string
          supplier_reminder_2days: boolean
          supplier_reminder_urgent: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          editor_reminder_2days?: boolean
          editor_reminder_overdue?: boolean
          id?: string
          supplier_reminder_2days?: boolean
          supplier_reminder_urgent?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          editor_reminder_2days?: boolean
          editor_reminder_overdue?: boolean
          id?: string
          supplier_reminder_2days?: boolean
          supplier_reminder_urgent?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          content_received: boolean | null
          content_received_date: string | null
          created_at: string
          created_by: string
          id: string
          insert_id: string | null
          issue_id: string
          lineup_item_id: string | null
          message: string
          reminder_count: number | null
          scheduled_for: string
          sent_at: string | null
          sent_by: string | null
          status: string
          supplier_id: string | null
          type: string
        }
        Insert: {
          content_received?: boolean | null
          content_received_date?: string | null
          created_at?: string
          created_by: string
          id?: string
          insert_id?: string | null
          issue_id: string
          lineup_item_id?: string | null
          message: string
          reminder_count?: number | null
          scheduled_for: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          supplier_id?: string | null
          type: string
        }
        Update: {
          content_received?: boolean | null
          content_received_date?: string | null
          created_at?: string
          created_by?: string
          id?: string
          insert_id?: string | null
          issue_id?: string
          lineup_item_id?: string | null
          message?: string
          reminder_count?: number | null
          scheduled_for?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          supplier_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_insert_id_fkey"
            columns: ["insert_id"]
            isOneToOne: false
            referencedRelation: "inserts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_lineup_item_id_fkey"
            columns: ["lineup_item_id"]
            isOneToOne: false
            referencedRelation: "lineup_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          is_allowed: boolean
          permission_key: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_allowed?: boolean
          permission_key: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_allowed?: boolean
          permission_key?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          business_type: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          supplier_type: string | null
          updated_at: string
        }
        Insert: {
          business_type?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          supplier_type?: string | null
          updated_at?: string
        }
        Update: {
          business_type?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          supplier_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_notifications: {
        Row: {
          created_at: string
          id: string
          insert_id: string | null
          is_read: boolean
          issue_id: string | null
          lineup_item_id: string | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          insert_id?: string | null
          is_read?: boolean
          issue_id?: string | null
          lineup_item_id?: string | null
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          insert_id?: string | null
          is_read?: boolean
          issue_id?: string | null
          lineup_item_id?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_notifications_insert_id_fkey"
            columns: ["insert_id"]
            isOneToOne: false
            referencedRelation: "inserts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_notifications_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_notifications_lineup_item_id_fkey"
            columns: ["lineup_item_id"]
            isOneToOne: false
            referencedRelation: "lineup_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          full_name: string | null
          id: string
          invited_by: string
          role: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by: string
          role: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by?: string
          role?: string
          status?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          browser_notifications: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          remember_me: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          browser_notifications?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          remember_me?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          browser_notifications?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          remember_me?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "designer" | "editor" | "publisher" | "social"
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
      app_role: ["admin", "designer", "editor", "publisher", "social"],
    },
  },
} as const
