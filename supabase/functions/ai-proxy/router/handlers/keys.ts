
import { MiddlewareContext } from '../../middleware/index.ts';
import { createErrorResponse, ErrorType } from '../../error-utils.ts';
import { 
  listProviders as listProvidersCore,
  checkApiKeyStatus as checkApiKeyStatusCore,
  setApiKey as setApiKeyCore,
  deleteApiKey as deleteApiKeyCore
} from '../../api-keys.ts'; // Core logic functions

export async function handleListProviders(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId } = context;
  console.log(`[${requestId}] Router.KeysHandler: Listing providers`);
  return await listProvidersCore(req);
}

export async function handleCheckApiKeyStatus(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId } = context;
  console.log(`[${requestId}] Router.KeysHandler: Checking API key status`);
  return await checkApiKeyStatusCore(req);
}

export async function handleSetApiKey(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId } = context;
  console.log(`[${requestId}] Router.KeysHandler: Setting API key`);
  // Method check moved here from main router logic
  if (req.method !== 'POST') {
    return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
  }
  return await setApiKeyCore(req);
}

export async function handleDeleteApiKey(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId } = context;
  console.log(`[${requestId}] Router.KeysHandler: Deleting API key`);
  // Method check
  if (req.method !== 'POST') {
    return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST for delete.', 405);
  }
  return await deleteApiKeyCore(req);
}
