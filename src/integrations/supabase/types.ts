export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_rate_limit_config: {
        Row: {
          created_at: string
          id: string
          provider: string
          rate_limit: number
          updated_at: string
          window: number
        }
        Insert: {
          created_at?: string
          id?: string
          provider: string
          rate_limit: number
          updated_at?: string
          window: number
        }
        Update: {
          created_at?: string
          id?: string
          provider?: string
          rate_limit?: number
          updated_at?: string
          window?: number
        }
        Relationships: []
      }
      ai_rate_limits: {
        Row: {
          created_at: string
          id: string
          last_reset: number
          provider: string
          usage: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_reset: number
          provider: string
          usage?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_reset?: number
          provider?: string
          usage?: number
          user_id?: string
        }
        Relationships: []
      }
      ai_request_cache: {
        Row: {
          created_at: string
          key: string
          ttl: number
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          ttl?: number
          value: Json
        }
        Update: {
          created_at?: string
          key?: string
          ttl?: number
          value?: Json
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          params: Json | null
          provider: string
          status: string
          total_tokens: number
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          input_tokens?: number
          model: string
          output_tokens?: number
          params?: Json | null
          provider: string
          status: string
          total_tokens?: number
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          input_tokens?: number
          model?: string
          output_tokens?: number
          params?: Json | null
          provider?: string
          status?: string
          total_tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          encrypted_key: string
          id: string
          provider: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_key: string
          id?: string
          provider: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_key?: string
          id?: string
          provider?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_table_exists: {
        Args: { p_table_name: string }
        Returns: boolean
      }
      create_cache_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_rate_limit_config_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_rate_limit_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_usage_log_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      decrypt_api_key: {
        Args: { p_encrypted_key: string }
        Returns: string
      }
      delete_api_key: {
        Args: { p_user_id: string; p_provider: string }
        Returns: boolean
      }
      encrypt_api_key: {
        Args: { p_api_key: string }
        Returns: string
      }
      get_api_key: {
        Args: { p_user_id: string; p_provider: string }
        Returns: string
      }
      get_usage_summary: {
        Args: { p_user_id: string; p_start_date: string; p_end_date: string }
        Returns: {
          provider: string
          model: string
          request_count: number
          success_count: number
          error_count: number
          total_tokens_sum: number
          input_tokens_sum: number
          output_tokens_sum: number
        }[]
      }
      increment_rate_limit_usage: {
        Args: { p_user_id: string; p_provider: string; p_amount: number }
        Returns: undefined
      }
      list_api_keys: {
        Args: { p_user_id: string }
        Returns: {
          provider: string
        }[]
      }
      store_api_key: {
        Args: { p_user_id: string; p_provider: string; p_api_key: string }
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
