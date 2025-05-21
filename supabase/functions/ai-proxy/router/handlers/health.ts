
import { MiddlewareContext } from '../../middleware/index.ts';
import { corsHeaders } from '../../auth.ts';
import { ensureCacheTable } from '../../cache.ts';
import { ensureRateLimitTables } from '../../rate-limit.ts';
import { ensureUsageLogTable } from '../../monitoring.ts';

export async function handleHealthCheck(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId, supabaseClient, user } = context;
  console.log(`[${requestId}] Router.HealthHandler: Processing health check`);
  
  // Perform health checks (e.g., ensure tables exist)
  await Promise.all([
    ensureCacheTable(supabaseClient),
    ensureRateLimitTables(supabaseClient),
    ensureUsageLogTable(supabaseClient)
  ]);
  
  return new Response(
    JSON.stringify({ 
      status: 'ok', 
      user: { id: user?.id, email: user?.email }, // Include user info if available
      request_id: requestId // Include request ID in response
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId } }
  );
}
