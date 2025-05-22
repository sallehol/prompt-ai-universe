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
      model_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          icon: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          name: string
          sort_order: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_api_keys: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          key_value: string
          last_used_at: string | null
          notes: string | null
          provider: string
          rate_limit: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_value: string
          last_used_at?: string | null
          notes?: string | null
          provider: string
          rate_limit?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_value?: string
          last_used_at?: string | null
          notes?: string | null
          provider?: string
          rate_limit?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      provider_models: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          model_id: string
          model_name: string
          model_type: string
          pricing_input: number | null
          pricing_output: number | null
          provider: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model_id: string
          model_name: string
          model_type: string
          pricing_input?: number | null
          pricing_output?: number | null
          provider: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model_id?: string
          model_name?: string
          model_type?: string
          pricing_input?: number | null
          pricing_output?: number | null
          provider?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      provider_rate_limits: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          provider: string
          requests_per_day: number
          requests_per_minute: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider: string
          requests_per_day: number
          requests_per_minute: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          requests_per_day?: number
          requests_per_minute?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          customer_id: string
          email: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          email?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          email?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          available_models: Json
          created_at: string | null
          description: string | null
          features: Json
          id: string
          limits: Json
          name: string
          price_monthly: number
          price_yearly: number
          stripe_monthly_price_id: string | null
          stripe_yearly_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          available_models: Json
          created_at?: string | null
          description?: string | null
          features: Json
          id: string
          limits: Json
          name: string
          price_monthly: number
          price_yearly: number
          stripe_monthly_price_id?: string | null
          stripe_yearly_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          available_models?: Json
          created_at?: string | null
          description?: string | null
          features?: Json
          id?: string
          limits?: Json
          name?: string
          price_monthly?: number
          price_yearly?: number
          stripe_monthly_price_id?: string | null
          stripe_yearly_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          payment_provider: string
          payment_provider_subscription_id: string | null
          plan_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          payment_provider: string
          payment_provider_subscription_id?: string | null
          plan_id: string
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          payment_provider?: string
          payment_provider_subscription_id?: string | null
          plan_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_records: {
        Row: {
          cost_usd: number | null
          id: string
          model: string
          provider: string
          request_timestamp: string | null
          request_type: string
          subscription_id: string
          tokens_input: number | null
          tokens_output: number | null
          user_id: string
        }
        Insert: {
          cost_usd?: number | null
          id?: string
          model: string
          provider: string
          request_timestamp?: string | null
          request_type: string
          subscription_id: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id: string
        }
        Update: {
          cost_usd?: number | null
          id?: string
          model?: string
          provider?: string
          request_timestamp?: string | null
          request_type?: string
          subscription_id?: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
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
