
import { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyAuth } from '../auth.ts'
import { createErrorResponse, ErrorType } from '../error-utils.ts'
import { getProviderFromModel, ProviderName } from '../providers.ts'
import { MiddlewareContext } from '../middleware/index.ts';

export interface ValidatedRequestParams {
  user: User;
  supabaseClient: SupabaseClient;
  provider: ProviderName;
  model: string;
  // Contains specific params like prompt/messages and any other passthrough params
  // It will also include the 'stream' flag if present in the original request.
  allParamsFromRequest: Record<string, any>; 
  errorResponse?: Response;
}

export async function validateRequest(
  req: Request,
  requestType: 'text' | 'chat',
  context?: MiddlewareContext
): Promise<ValidatedRequestParams> {
  try {
    const authResult = context?.user && context?.supabaseClient 
      ? { user: context.user, supabaseClient: context.supabaseClient } 
      : await verifyAuth(req);
    
    const { user, supabaseClient } = authResult;
    
    const body = context?.requestParams || await req.json();
    const { model, provider: explicitProvider, ...paramsFromRequest } = body; 
    
    if (!model || typeof model !== 'string') {
      return { 
        // @ts-ignore: errorResponse makes other fields irrelevant
        errorResponse: createErrorResponse(ErrorType.VALIDATION, 'Model is required and must be a string.', 400) 
      };
    }
    
    let provider: ProviderName;
    try {
        provider = getProviderFromModel(model, explicitProvider as string | undefined);
    } catch (error) {
        return { 
          // @ts-ignore: errorResponse makes other fields irrelevant
          errorResponse: createErrorResponse(ErrorType.VALIDATION, `Provider detection failed: ${error.message}`, 400) 
        };
    }

    if (requestType === 'text') {
      const { prompt } = paramsFromRequest;
      if (!prompt || typeof prompt !== 'string') {
        return { 
          // @ts-ignore: errorResponse makes other fields irrelevant
          errorResponse: createErrorResponse(ErrorType.VALIDATION, 'Prompt is required for text completion and must be a string.', 400) 
        };
      }
    } else { // chat
      const { messages } = paramsFromRequest;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return { 
          // @ts-ignore: errorResponse makes other fields irrelevant
          errorResponse: createErrorResponse(ErrorType.VALIDATION, 'Messages are required for chat completion and must be a non-empty array.', 400) 
        };
      }
      for (const msg of messages) {
        if (typeof msg !== 'object' || !msg.role || !msg.content || typeof msg.role !== 'string' || typeof msg.content !== 'string') {
          return { 
            // @ts-ignore: errorResponse makes other fields irrelevant
            errorResponse: createErrorResponse(ErrorType.VALIDATION, 'Each message must be an object with "role" and "content" string properties.', 400) 
          };
        }
      }
    }
    
    return { user, supabaseClient, provider, model, allParamsFromRequest: paramsFromRequest };

  } catch (error) {
    // Handle errors from verifyAuth or req.json()
    if (error.message === 'Unauthorized' || error.status === 401) {
       return { 
         // @ts-ignore: errorResponse makes other fields irrelevant
         errorResponse: createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401) 
        };
    }
    return { 
      // @ts-ignore: errorResponse makes other fields irrelevant
      errorResponse: createErrorResponse(ErrorType.VALIDATION, `Invalid request: ${error.message}`, 400) 
    };
  }
}
