
// supabase/functions/ai-proxy/rate-limit.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Rate limiter interface
export interface RateLimiter {
  checkLimit(userId: string, provider: string): Promise<{ allowed: boolean, remaining: number, reset: number, limit: number }>;
  incrementUsage(userId: string, provider: string, amount?: number): Promise<void>;
}

// Supabase Rate Limiter
export class SupabaseRateLimiter implements RateLimiter {
  private supabaseClient: SupabaseClient;
  private tableName: string = 'ai_rate_limits';
  private configTableName: string = 'ai_rate_limit_config';
  
  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }
  
  private async getLimitConfig(provider: string): Promise<{ limit: number, window: number }> {
    const defaultLimits: { limit: number, window: number } = { limit: 100, window: 3600 }; // Default: 100 req/hr
    
    try {
      const { data, error } = await this.supabaseClient
        .from(this.configTableName)
        .select('"limit", "window"') // Ensure "limit" and "window" are quoted
        .eq('provider', provider)
        .single();
      
      if (error || !data) {
        if (error && error.code !== 'PGRST116') console.warn(`Error getting rate limit config for ${provider}:`, error.message);
        
        const { data: defaultConfig, error: defaultError } = await this.supabaseClient
            .from(this.configTableName)
            .select('"limit", "window"')
            .eq('provider', 'default')
            .single();
        if (defaultError || !defaultConfig) {
            if(defaultError && defaultError.code !== 'PGRST116') console.error('Error getting default rate limit config:', defaultError.message);
            return defaultLimits;
        }
        return { limit: defaultConfig.limit, window: defaultConfig.window };
      }
      return { limit: data.limit, window: data.window };
    } catch (error) {
      console.error('Exception getting rate limit config:', error);
      return defaultLimits;
    }
  }
  
  async checkLimit(userId: string, provider: string): Promise<{ allowed: boolean, remaining: number, reset: number, limit: number }> {
    const config = await this.getLimitConfig(provider);
    const now = Math.floor(Date.now() / 1000); // Current time in seconds

    try {
      const { data, error } = await this.supabaseClient
        .from(this.tableName)
        .select('usage, last_reset')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no row was found
        console.error('Rate limit check error:', error);
        return { allowed: true, remaining: config.limit, reset: now + config.window, limit: config.limit }; // Fail open
      }

      if (!data) { // No record, first request for this user/provider
        // Optionally, create the record here or let incrementUsage handle it.
        // For now, assume allowed and incrementUsage will create it.
        return { allowed: true, remaining: config.limit, reset: now + config.window, limit: config.limit };
      }

      if (now >= data.last_reset + config.window) { // Window has passed
        // Usage is reset, this request is allowed.
        // The actual reset of 'usage' and 'last_reset' in DB will happen in incrementUsage.
        return { allowed: true, remaining: config.limit, reset: now + config.window, limit: config.limit };
      }

      // Window is active, check usage
      const remaining = config.limit - data.usage;
      const allowed = remaining > 0;
      
      return { allowed, remaining, reset: data.last_reset + config.window, limit: config.limit };

    } catch (error) {
      console.error('Exception during rate limit check:', error);
      return { allowed: true, remaining: config.limit, reset: now + config.window, limit: config.limit }; // Fail open
    }
  }
  
  async incrementUsage(userId: string, provider: string, amount: number = 1): Promise<void> {
    try {
      const { error } = await this.supabaseClient.rpc('increment_rate_limit_usage', {
        p_user_id: userId,
        p_provider: provider,
        p_amount: amount
      });
      
      if (error) {
        console.error('Rate limit increment RPC error:', error);
      }
    } catch (error) {
      console.error('Exception incrementing rate limit usage:', error);
    }
  }
}

export async function ensureRateLimitTables(supabaseClient: SupabaseClient): Promise<void> {
  try {
    const { data: tableExists, error: tableError } = await supabaseClient.rpc('check_table_exists', {
      p_table_name: 'ai_rate_limits'
    });
    const { data: configExists, error: configError } = await supabaseClient.rpc('check_table_exists', {
      p_table_name: 'ai_rate_limit_config'
    });
    
    if (tableError || configError) {
      console.error('Error checking rate limit tables:', tableError || configError);
      return;
    }
    
    if (!tableExists) {
      console.log('ai_rate_limits table not found, attempting to create...');
      const { error: createTableError } = await supabaseClient.rpc('create_rate_limit_table');
      if (createTableError) console.error('Error creating ai_rate_limits table:', createTableError);
      else console.log('ai_rate_limits table created or existed.');
    } else {
      console.log('ai_rate_limits table already exists.');
    }
    
    if (!configExists) {
      console.log('ai_rate_limit_config table not found, attempting to create...');
      const { error: createConfigError } = await supabaseClient.rpc('create_rate_limit_config_table');
      if (createConfigError) console.error('Error creating ai_rate_limit_config table:', createConfigError);
      else console.log('ai_rate_limit_config table created or existed.');
    } else {
      console.log('ai_rate_limit_config table already exists.');
    }
  } catch (error) {
    console.error('Error ensuring rate limit tables:', error);
  }
}
