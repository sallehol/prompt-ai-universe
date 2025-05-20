
// supabase/functions/ai-proxy/auth.ts
import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyAuthResult {
  user: User;
  supabaseClient: SupabaseClient;
}

// Middleware to verify authentication
export async function verifyAuth(req: Request): Promise<VerifyAuthResult> {
  // Create Supabase client
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
      auth: {
        persistSession: false, // Important for edge functions
        autoRefreshToken: false, // Important for edge functions
      }
    }
  )
  
  // Get the user from the JWT token
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser()
  
  if (error || !user) {
    console.error('Auth error:', error?.message);
    throw new Error('Unauthorized')
  }
  
  return { user, supabaseClient }
}

// Helper function to handle CORS preflight requests
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}

// Helper function to create error responses (simplified, as detailed one is in error-utils)
export function createBasicErrorResponse(message: string, status: number = 500): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Helper function to create success responses
export function createSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
