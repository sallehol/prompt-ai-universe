
import { MiddlewareContext } from '../middleware/index.ts';
import { createErrorResponse, ErrorType } from '../error-utils.ts';
// corsHeaders is not directly used here but might be useful for default responses if any
// import { corsHeaders } from '../auth.ts'; 
import { routes } from './routes.ts';

export interface RouteHandler {
  (req: Request, context: MiddlewareContext): Promise<Response>;
}

export interface Route {
  pattern: string[];  // URL pattern segments, e.g., ['api', 'health']
  methods: string[];  // Allowed HTTP methods, e.g., ['GET']
  handler: RouteHandler;
}

export class Router {
  private routes: Route[] = [];
  
  constructor(routesConfig: Route[]) {
    this.routes = routesConfig;
  }
  
  // Add a route programmatically (not used in this setup but good for extensibility)
  addRoute(route: Route): Router {
    this.routes.push(route);
    return this;
  }
  
  async handleRequest(req: Request, context: MiddlewareContext): Promise<Response> {
    const { requestId } = context;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    console.log(`[${requestId}] Router: Processing ${req.method} request to ${url.pathname}`);
    
    const functionNameIndex = pathParts.findIndex(p => p === 'ai-proxy');
    if (functionNameIndex === -1 || pathParts[functionNameIndex + 1] !== 'api') {
      console.warn(`[${requestId}] Router: Invalid API path structure: ${url.pathname}`);
      return createErrorResponse(ErrorType.VALIDATION, 'Invalid API path. Must include /ai-proxy/api/', 400);
    }
    
    const apiPath = pathParts.slice(functionNameIndex + 1); // e.g. ['api', 'health'] or ['api', 'models', 'text', 'completion']

    if (apiPath.length < 1) {
      console.warn(`[${requestId}] Router: API path segment not found after /ai-proxy/`);
      return createErrorResponse(ErrorType.VALIDATION, 'API path segment not found after /ai-proxy/', 400);
    }
    
    context.requestPath = apiPath; // Store for handlers to use
    
    for (const route of this.routes) {
      if (this.matchRoute(apiPath, route.pattern) && route.methods.includes(req.method)) {
        console.log(`[${requestId}] Router: Matched route pattern [${route.pattern.join('/')}] for path [${apiPath.join('/')}] with method ${req.method}`);
        try {
          return await route.handler(req, context);
        } catch (error) {
          console.error(`[${requestId}] Router: Error in route handler for [${route.pattern.join('/')}]:`, error.message, error.stack ? error.stack.split('\n')[0] : '');
          return createErrorResponse(
            ErrorType.SERVER, 
            `Error in route handler: ${error.message}`, 
            500
          );
        }
      }
    }
    
    console.warn(`[${requestId}] Router: No matching route found for path [${apiPath.join('/')}] with method ${req.method}`);
    return createErrorResponse(
      ErrorType.NOT_FOUND, 
      `Endpoint not found: /${apiPath.join('/')}`, 
      404
    );
  }
  
  private matchRoute(pathParts: string[], pattern: string[]): boolean {
    // A simple matching logic: if pattern is shorter or longer than path, it's not a match
    // unless a more sophisticated wildcard/param system is in place (not implemented here for simplicity,
    // relying on exact pattern length matching current structure).
    // The prompt's example matcher was more lenient. This one is stricter to match current behavior.
    if (pathParts.length !== pattern.length) {
        return false;
    }
    
    for (let i = 0; i < pattern.length; i++) {
      // Wildcard segment (could be specific like ':id' or generic '*')
      // For this refactor, we assume patterns are exact or use simple wildcards if any.
      // The prompt's patterns are exact strings.
      if (pattern[i].startsWith(':') || pattern[i] === '*') { // Basic support for params/wildcards
        continue; 
      }
      if (pattern[i] !== pathParts[i]) {
        return false;
      }
    }
    return true;
  }
}

// Create and export the router instance, configured with routes
export const router = new Router(routes);

// This function will be called by the middleware chain as the main handler
export async function handleApiRequest(req: Request, context: MiddlewareContext): Promise<Response> {
  return await router.handleRequest(req, context);
}

