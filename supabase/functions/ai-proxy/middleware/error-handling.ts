
// supabase/functions/ai-proxy/middleware/error-handling.ts
import { Middleware, MiddlewareContext } from './index.ts';
import { corsHeaders } from '../auth.ts';
import { ErrorType } from '../error-utils.ts'; // Assuming ErrorType enum is here

export interface StandardErrorPayload { // Renamed to avoid conflict with DOM Response
  error: {
    type: ErrorType;
    message: string;
    status: number; // HTTP status code
    details?: any;
    request_id?: string; // Ensure request_id is part of the error structure
  }
}

// Create a standardized error response
export function createStandardErrorResponse(
  type: ErrorType,
  message: string,
  status: number = 500,
  details?: any,
  requestId?: string
): Response {
  const errorBody: StandardErrorPayload = {
    error: {
      type,
      message,
      status, // HTTP status
      ...(details && { details }),
      ...(requestId && { request_id: requestId }),
    }
  };
  
  // console.error(`[${requestId || 'NO_ID'}] createStandardErrorResponse: ${status} ${type} - ${message}`, details ? JSON.stringify(details) : '');
  
  return new Response(
    JSON.stringify(errorBody),
    { 
      status, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        ...(requestId ? { 'X-Request-ID': requestId } : {})
      } 
    }
  );
}

// Middleware for consistent error handling
export class ErrorHandlingMiddleware implements Middleware {
  // 'before' hook is not strictly necessary for error handling of responses, but can be used for request validation if needed.
  // async before(req: Request, context: MiddlewareContext): Promise<void> {}
  
  async after(req: Request, res: Response, context: MiddlewareContext): Promise<Response | void> {
    const { requestId } = context;

    // Ensure X-Request-ID is on all responses passing through here, even non-errors
    if (!res.headers.has('X-Request-ID') && requestId) {
        const newHeaders = new Headers(res.headers);
        newHeaders.set('X-Request-ID', requestId);
        // Reconstruct response only if header was missing
        // Body handling is complex due to potential prior consumption.
        // If context.responseBody is set, use it. Otherwise, use original res.body.
        let finalBody: BodyInit | null = null;
        if (context.responseBody && (typeof context.responseBody === 'string' || typeof context.responseBody === 'object')) {
            finalBody = typeof context.responseBody === 'string' ? context.responseBody : JSON.stringify(context.responseBody);
        } else {
            finalBody = res.body;
        }
        return new Response(finalBody, {
            status: res.status,
            statusText: res.statusText,
            headers: newHeaders
        });
    }


    // If response is an error (4xx or 5xx)
    if (res.status >= 400) {
      // console.log(`[${requestId}] ErrorHandlingMiddleware.after: Processing error response with status ${res.status}`);
      
      try {
        let responseJson: any;
        // Try to get already parsed error details from context first
        if (context.errorDetails && typeof context.errorDetails === 'object') {
            responseJson = context.errorDetails;
        } else {
            // If not in context, try to parse from response (might have been parsed already)
            const clonedRes = res.clone();
            try {
                responseJson = await clonedRes.json();
            } catch (e) {
                // console.warn(`[${requestId}] ErrorHandlingMiddleware.after: Could not parse error response as JSON: ${e.message}`);
                const textClonedRes = res.clone(); // Clone again if json() failed
                const textBody = await textClonedRes.text();
                // Create a basic error structure if parsing failed
                responseJson = { message: textBody || res.statusText || "Unknown error" };
            }
        }
        
        // Standardize the error structure
        let standardizedError: StandardErrorPayload;
        if (responseJson.error && typeof responseJson.error.type === 'string' && typeof responseJson.error.message === 'string') {
            // Already somewhat standard, just ensure all fields
            standardizedError = {
                error: {
                    type: responseJson.error.type as ErrorType,
                    message: responseJson.error.message,
                    status: responseJson.error.status || res.status,
                    details: responseJson.error.details || responseJson.details, // Take details from error obj or root
                    request_id: responseJson.error.request_id || requestId,
                }
            };
        } else {
            // Not standard, create one
            standardizedError = {
                error: {
                    // Determine ErrorType based on status if possible, else default
                    type: (Object.values(ErrorType) as string[]).includes(res.status.toString()) ? res.status.toString() as ErrorType : ErrorType.SERVER,
                    message: responseJson.message || res.statusText || 'An unexpected error occurred.',
                    status: res.status,
                    details: responseJson.details || (typeof responseJson === 'object' && !responseJson.message ? responseJson : undefined),
                    request_id: requestId,
                }
            };
        }
         // Update context.errorDetails with the standardized version for logging
        context.errorDetails = standardizedError.error;

        const newHeaders = new Headers(res.headers);
        newHeaders.set('Content-Type', 'application/json'); // Ensure content type
        if (requestId) newHeaders.set('X-Request-ID', requestId);
        
        return new Response(JSON.stringify(standardizedError), {
          status: res.status, // Keep original status
          headers: newHeaders
        });
      } catch (error) {
        console.error(`[${requestId}] ErrorHandlingMiddleware.after critical error:`, error.message);
        // Fallback to a very basic error response if ErrorHandlingMiddleware itself fails
        return new Response(JSON.stringify({ error: { type: ErrorType.SERVER, message: "Critical error in error handling middleware.", status: 500, request_id: requestId } }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId || "unknown" }
        });
      }
    }
    
    // For non-error responses, just return (or the modified response if X-Request-ID was added)
    return;
  }
}
