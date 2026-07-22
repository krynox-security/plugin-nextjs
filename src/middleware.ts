import { NextResponse, type NextRequest } from 'next/server';
import { verifyKrynox } from './verify';

export interface KrynoxMiddlewareConfig {
  /** Request header carrying the solved token (default: 'x-krynox-captcha'). */
  header?: string;
  /** Secret key. Defaults to process.env.KRYNOX_SECRET_KEY. */
  secret?: string;
  /** Data-plane host override. */
  apiHost?: string;
  /** Methods to enforce on (default: POST, PUT, PATCH, DELETE). */
  methods?: string[];
  /**
   * Hosting-provider header that is guaranteed to be overwritten by your trusted
   * edge (for example `x-vercel-forwarded-for`). Disabled by default because
   * Next.js has no portable socket IP in middleware.
   */
  trustedProxyHeader?: string;
  /** Custom platform-specific IP resolver. Takes precedence over trustedProxyHeader. */
  resolveIp?: (request: NextRequest) => string | undefined;
}

/**
 * Build a Next.js middleware that verifies a Krynox token carried in a request
 * **header** (default `x-krynox-captcha`) and returns 403 on failure.
 *
 * Why a header and not the form body? Reading the request body in middleware consumes
 * the stream and breaks the downstream Route Handler. So:
 *   - API clients / fetch → send the token as the `x-krynox-captcha` header (use this).
 *   - HTML <form> posts    → verify in the Route Handler / Server Action with `verifyKrynox()`.
 *
 *   // middleware.ts
 *   import { krynoxMiddleware } from '@krynox/captcha-next';
 *   export const middleware = krynoxMiddleware();
 *   export const config = { matcher: ['/api/:path*'] };
 */
export function krynoxMiddleware(config: KrynoxMiddlewareConfig = {}) {
  const header = config.header ?? 'x-krynox-captcha';
  const methods = config.methods ?? ['POST', 'PUT', 'PATCH', 'DELETE'];

  return async (request: NextRequest): Promise<NextResponse> => {
    if (!methods.includes(request.method)) return NextResponse.next();

    const trustedHeader = config.trustedProxyHeader
      ? request.headers.get(config.trustedProxyHeader)?.split(',')[0]?.trim()
      : undefined;
    const token = request.headers.get(header);
    const result = await verifyKrynox(token, {
      secret: config.secret,
      apiHost: config.apiHost,
      remoteip: config.resolveIp?.(request) || trustedHeader || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'captcha_failed', 'error-codes': result.errorCodes ?? [] },
        { status: 403 },
      );
    }
    return NextResponse.next();
  };
}
