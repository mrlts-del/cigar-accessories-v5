import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

type RouteHandler<TContext> = (request: NextRequest, context: TContext) => Promise<Response | NextResponse>;

export function withError<TContext>(handler: RouteHandler<TContext>) {
  return async (request: NextRequest, context: TContext) => {
    try {
      return await handler(request, context);
    } catch (error: unknown) {
      console.error(error);
      return NextResponse.json(
        { error: (error instanceof Error ? error.message : "Internal Server Error") },
        { status: (error && typeof error === 'object' && 'status' in error ? error.status as number : 500) }
      );
    }
  };
}