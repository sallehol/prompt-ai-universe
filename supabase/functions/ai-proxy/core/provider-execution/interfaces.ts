
// supabase/functions/ai-proxy/core/provider-execution/interfaces.ts
export interface ProviderExecutionResult {
  resultFromClient: any;
  finalParamsForProvider: Record<string, any>;
  errorResponse?: Response;
}
