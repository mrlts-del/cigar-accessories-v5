import { NextResponse } from "next/server";

/**
 * Wraps an API handler to provide consistent error handling.
 * Returns errors as { error: string } with appropriate status.
 */
// Define a generic context type
type RouteContext<TParams = { [key: string]: string | string[] | undefined }> = { params: TParams };
// Define a generic RequestHandler type
import { NextRequest } from "next/server";

type RequestHandler<TParams = { [key: string]: string | string[] | undefined }> =
    (request: NextRequest, context: RouteContext<TParams>) => Promise<Response | NextResponse>;

// Make withError generic over the Params type
export function withError<TParams>(handler: RequestHandler<TParams>) {
  // The wrapper accepts Request and the specific context type
  return async (request: NextRequest, context: RouteContext<TParams>) => {
    try {
      // Pass both arguments to the handler
      return await handler(request, context);
    } catch (error: unknown) { // Use unknown for error
      console.error(error);
      return NextResponse.json(
        // Check if error is an object with message/status properties
        { error: (error instanceof Error ? error.message : "Internal Server Error") },
        { status: (error && typeof error === 'object' && 'status' in error ? error.status as number : 500) }
      );
    }
  };
}