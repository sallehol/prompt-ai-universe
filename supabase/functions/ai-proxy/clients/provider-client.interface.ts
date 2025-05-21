
// supabase/functions/ai-proxy/clients/provider-client.interface.ts

// Base interface for all provider clients
export interface ProviderClient {
  makeTextRequest(params: any): Promise<any>; // Can return Response object or JSON data
  makeChatRequest(params: any): Promise<any>; // Can return Response object or JSON data
}

