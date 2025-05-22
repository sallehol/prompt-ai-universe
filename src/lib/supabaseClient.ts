
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace these with your actual Supabase credentials
// For production, these should be environment variables
export const supabaseUrl = 'https://zxpywvtgpfqyazabsvlb.supabase.co'; // Export this
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4cHl3dnRncGZxeWF6YWJzdmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODk3NTYsImV4cCI6MjA2MzI2NTc1Nn0.0wzTaWhAhF-DHbuuMXhFoAulCEANGJt0G6pRm-sIXxA'; 

if (!supabaseUrl || !supabaseAnonKey) {
  // This check is less critical now with hardcoded values but good practice.
  throw new Error('Supabase URL and Anon Key must be defined.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

