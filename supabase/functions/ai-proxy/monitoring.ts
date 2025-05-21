
// supabase/functions/ai-proxy/monitoring.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Usage log interface
export interface UsageLogger {
  logRequest(
    userId: string, 
    provider: string, 
    model: string, 
    endpoint: string, 
    params: any, 
    responseStatus: number, // Changed to responseStatus
    responsePayload?: any, // Full response payload for token extraction if needed
    errorDetails?: any // Error details if any
  ): Promise<void>;
  getUsageSummary(userId: string, period?: string): Promise<any>;
}

// Supabase Usage Logger
export class SupabaseUsageLogger implements UsageLogger {
  private supabaseClient: SupabaseClient;
  private tableName: string = 'ai_usage_logs';
  
  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }
  
  async logRequest(
    userId: string,
    provider: string,
    model: string,
    endpoint: string,
    params: any,
    responseStatus: number,
    responsePayload?: any,
    errorDetails?: any
  ): Promise<void> {
    try {
      let inputTokens = 0;
      let outputTokens = 0;
      let totalTokens = 0;
      
      // Try to extract token usage from responsePayload if it's a success
      if (responseStatus >= 200 && responseStatus < 300 && responsePayload && responsePayload.usage) {
        inputTokens = responsePayload.usage.prompt_tokens || responsePayload.usage.input_tokens || 0;
        outputTokens = responsePayload.usage.completion_tokens || responsePayload.usage.output_tokens || 0;
        totalTokens = responsePayload.usage.total_tokens || (inputTokens + outputTokens);
      }
      
      const sanitizedParams = { ...params };
      delete sanitizedParams.api_key;
      delete sanitizedParams.apiKey;
      delete sanitizedParams.Authorization;

      if (sanitizedParams.messages && Array.isArray(sanitizedParams.messages)) {
        sanitizedParams.messages = sanitizedParams.messages.map((msg: any) => ({
          role: msg.role,
          content_length: typeof msg.content === 'string' ? msg.content.length : 0,
          // Optionally log parts of content for very short debug, but be mindful of PII/size
        }));
      }
      if (sanitizedParams.prompt && typeof sanitizedParams.prompt === 'string') {
         sanitizedParams.prompt_length = sanitizedParams.prompt.length;
         // Avoid logging full prompt if too long or sensitive
         if (sanitizedParams.prompt.length > 100) {
            sanitizedParams.prompt = sanitizedParams.prompt.substring(0, 100) + "... (truncated)";
         }
      }
      
      const logEntry = {
        user_id: userId,
        provider,
        model,
        endpoint,
        params: sanitizedParams,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
        status: (responseStatus >= 200 && responseStatus < 300) ? 'success' : 'error',
        error_message: errorDetails ? (typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails)) : null,
        // created_at is defaulted by DB
      };
      
      const { error: logError } = await this.supabaseClient
        .from(this.tableName)
        .insert(logEntry);
      
      if (logError) {
        console.error('Usage log insert error:', logError);
      }
    } catch (error) {
      console.error('Usage log exception:', error);
    }
  }
  
  async getUsageSummary(userId: string, period: string = 'month'): Promise<any> {
    try {
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'day': startDate.setDate(now.getDate() - 1); break;
        case 'week': startDate.setDate(now.getDate() - 7); break;
        case 'month': startDate.setMonth(now.getMonth() - 1); break;
        case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
        default: startDate.setMonth(now.getMonth() - 1);
      }
      
      const { data, error } = await this.supabaseClient.rpc('get_usage_summary', {
        p_user_id: userId,
        p_start_date: startDate.toISOString(),
        p_end_date: now.toISOString()
      });
      
      if (error) {
        console.error('Usage summary RPC error:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Usage summary exception:', error);
      return null;
    }
  }
}

export async function ensureUsageLogTable(supabaseClient: SupabaseClient): Promise<void> {
  try {
    const { data, error } = await supabaseClient.rpc('check_table_exists', {
      p_table_name: 'ai_usage_logs'
    });
    
    if (error) {
      console.error('Error checking usage log table:', error);
      return;
    }
    
    if (!data) {
      console.log('ai_usage_logs table not found, attempting to create...');
      const { error: createError } = await supabaseClient.rpc('create_usage_log_table');
      if (createError) console.error('Error creating ai_usage_logs table:', createError);
      else console.log('ai_usage_logs table created or existed.');
    } else {
      console.log('ai_usage_logs table already exists.');
    }
  } catch (error) {
    console.error('Error ensuring usage log table:', error);
  }
}
