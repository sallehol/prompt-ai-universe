// supabase/functions/ai-proxy/cache.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2' // Use SupabaseClient type

// Cache interface
export interface CacheProvider {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

// Supabase Cache Provider
export class SupabaseCache implements CacheProvider {
  private supabaseClient: SupabaseClient; // Typed client
  private tableName: string = 'ai_request_cache';
  
  constructor(supabaseClient: SupabaseClient) { // Typed client
    this.supabaseClient = supabaseClient;
  }
  
  // Generate a cache key from request parameters
  static generateCacheKey(provider: string, endpoint: string, params: any): string {
    // Deep clone params to avoid modifying the original object.
    // This is crucial as 'params' might be used later in the request lifecycle.
    const paramsForCacheKey = JSON.parse(JSON.stringify(params));

    // Sanitize common sensitive or unstable top-level keys
    // These keys should not affect cache uniqueness if their values change.
    delete paramsForCacheKey.api_key;
    delete paramsForCacheKey.apiKey;
    delete paramsForCacheKey.Authorization;
    delete paramsForCacheKey.user; // Example: if 'user' or 'session_id' is passed
    delete paramsForCacheKey.session_id;
    delete paramsForCacheKey.request_id; // Example: a client-side request_id
    // Add any other top-level keys that are volatile and not relevant to the cacheable content.

    // Normalize 'messages' for chat completion if present
    if (Array.isArray(paramsForCacheKey.messages)) {
      paramsForCacheKey.messages = paramsForCacheKey.messages.map((msg: any) => {
        // Create a new message object containing only cache-relevant fields
        const normalizedMessage: { role: string; content: any; name?: string } = {
          role: msg.role,
          content: msg.content, // Assuming msg.content is typically a string or simple structure.
                                // If msg.content can be a complex array of blocks (e.g., for multimodal),
                                // further normalization of msg.content might be needed here to extract
                                // only the cacheable parts (e.g., text content from text blocks).
        };
        // Include 'name' if present, as it's used by some models (e.g., OpenAI for function/tool usage)
        if (msg.name !== undefined) {
          normalizedMessage.name = msg.name;
        }
        return normalizedMessage; // This strips other fields like id, timestamp, etc., from messages
      });
    }
    
    // Add some logging to inspect the params being used for key generation
    // console.log(`[Cache Key Gen] Provider: ${provider}, Endpoint: ${endpoint}`);
    // console.log(`[Cache Key Gen] Normalized params for key (before sort):`, JSON.stringify(paramsForCacheKey));

    // Sort keys of the processed parameters to ensure consistent cache keys
    const sortedParams = Object.keys(paramsForCacheKey)
      .sort()
      .reduce((obj: any, key) => {
        obj[key] = paramsForCacheKey[key];
        return obj;
      }, {});
    
    const paramsString = JSON.stringify(sortedParams);
    // console.log(`[Cache Key Gen] Final sorted params string for key: ${paramsString}`);
    
    const cacheKey = `${provider}:${endpoint}:${paramsString}`;
    // console.log(`[Cache Key Gen] Generated Cache Key: ${cacheKey}`);
    
    return cacheKey;
  }
  
  async get(key: string): Promise<any> {
    console.log(`SupabaseCache.get: Cache lookup for key: ${key}`);
    try {
      // Get the cache entry
      const { data, error } = await this.supabaseClient
        .from(this.tableName)
        .select('value, created_at, ttl') // Select ttl as well
        .eq('key', key)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116: Row not found, not an actual error for cache miss
          console.error('SupabaseCache.get: Error fetching from cache table:', error);
        } else {
          console.log(`SupabaseCache.get: Cache MISS (PGRST116) for key: ${key}`);
        }
        return null;
      }
      
      if (!data) {
        console.log(`SupabaseCache.get: Cache MISS (no data) for key: ${key}`);
        return null;
      }
      
      // Check if the cache entry has expired
      const createdAt = new Date(data.created_at);
      const now = new Date();
      const ttlInSeconds = data.ttl || 3600; // Default TTL is 1 hour (3600 seconds)
      
      if ((now.getTime() - createdAt.getTime()) / 1000 > ttlInSeconds) {
        console.log(`SupabaseCache.get: Cache EXPIRED for key: ${key}. Deleting.`);
        await this.delete(key);
        return null;
      }
      
      console.log(`SupabaseCache.get: Cache HIT for key: ${key}`);
      return data.value;
    } catch (error) {
      console.error('SupabaseCache.get: Exception during cache get:', error);
      return null;
    }
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    console.log(`SupabaseCache.set: Setting cache for key: ${key}, TTL: ${ttl}s`);
    try {
      // Set the cache entry
      const { error } = await this.supabaseClient
        .from(this.tableName)
        .upsert({
          key,
          value,
          ttl,
          created_at: new Date().toISOString() // Ensure created_at is set on upsert
        }, { onConflict: 'key' }); // Specify conflict target
      
      if (error) {
        console.error('SupabaseCache.set: Error setting cache:', error);
      } else {
        console.log(`SupabaseCache.set: Cache set successfully for key: ${key}`);
      }
    } catch (error) {
      console.error('SupabaseCache.set: Exception during cache set:', error);
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      // Delete the cache entry
      const { error } = await this.supabaseClient
        .from(this.tableName)
        .delete()
        .eq('key', key);
      
      if (error) {
        console.error('SupabaseCache.delete: Error deleting cache:', error);
      } else {
        console.log(`SupabaseCache.delete: Cache deleted for key: ${key}`);
      }
    } catch (error) {
      console.error('SupabaseCache.delete: Exception during cache delete:', error);
    }
  }
}

// Create the cache table if it doesn't exist (function call made in index.ts health check)
export async function ensureCacheTable(supabaseClient: SupabaseClient): Promise<void> { // Typed client
  try {
    // Check if the table exists
    const { data, error } = await supabaseClient.rpc('check_table_exists', {
      p_table_name: 'ai_request_cache'
    });
    
    if (error) {
      console.error('Error checking cache table:', error);
      return;
    }
    
    if (!data) {
      // Create the table
      console.log('Cache table not found, attempting to create...');
      const { error: createError } = await supabaseClient.rpc('create_cache_table');
      if (createError) {
        console.error('Error creating cache table:', createError);
      } else {
        console.log('Cache table created successfully or already existed.');
      }
    } else {
      console.log('Cache table already exists.');
    }
  } catch (error) {
    console.error('Error ensuring cache table:', error);
  }
}
