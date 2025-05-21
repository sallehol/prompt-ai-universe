
import { MiddlewareContext } from '../../middleware/index.ts';
import { createErrorResponse, ErrorType } from '../../error-utils.ts';
import { SupabaseUsageLogger } from '../../monitoring.ts';
import { corsHeaders } from '../../auth.ts'; // For success response

export async function handleUsageSummary(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId, supabaseClient, user } = context;
  console.log(`[${requestId}] Router.UsageHandler: Handling usage summary request`);

  if (req.method !== 'GET') {
      return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected GET for usage summary.', 405);
  }

  // context.requestPath should be ['api', 'usage', 'summary']
  // The original code checked context.requestPath[2] which would be 'summary'
  // This validation is now implicitly handled by the route pattern.

  const url = new URL(req.url);
  const period = url.searchParams.get('period') || 'month'; // Default to month
  
  if (!user || !user.id) {
    // This should ideally be caught by auth middleware, but double check
    console.warn(`[${requestId}] Router.UsageHandler: User not available in context for usage summary.`);
    return createErrorResponse(ErrorType.AUTHENTICATION, 'User authentication required for usage summary.', 401);
  }

  const usageLogger = new SupabaseUsageLogger(supabaseClient);
  const summary = await usageLogger.getUsageSummary(user.id, period);
  
  if (summary === null) {
      return createErrorResponse(ErrorType.SERVER, 'Failed to retrieve usage summary.', 500);
  }
  
  return new Response(
    JSON.stringify({ summary, request_id: requestId }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId } }
  );
}
