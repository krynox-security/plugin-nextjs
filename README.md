# Krynox Captcha for Next.js

Privacy-first, proof-of-work CAPTCHA for Next.js (App Router) — a **React widget**, a
**server-side verify** helper, and a **middleware** factory. No cookies, no puzzles.

## Install

```bash
npm install @krynox/captcha-next
```

```env
KRYNOX_SECRET_KEY=kcps_live_xxx
NEXT_PUBLIC_KRYNOX_SITE_KEY=kcpt_live_xxx
```

## 1. Render the widget (client)

```tsx
import { KrynoxCaptcha } from '@krynox/captcha-next/react';

export default function SignupForm() {
  return (
    <form action="/api/signup" method="post">
      <input name="email" type="email" required />
      <KrynoxCaptcha sitekey={process.env.NEXT_PUBLIC_KRYNOX_SITE_KEY} />
      <button type="submit">Create account</button>
    </form>
  );
}
```

## 2a. Verify in a Route Handler / Server Action (form posts)

```ts
import { verifyKrynox } from '@krynox/captcha-next';

export async function POST(request: Request) {
  const form = await request.formData();
  const result = await verifyKrynox(form.get('krynox-captcha') as string);
  if (!result.success) return new Response('captcha failed', { status: 403 });
  // result.risk => 'low' | 'medium' | 'high'
}
```

## 2b. Or protect API routes with middleware (header token)

Middleware can't read the form body without breaking the downstream handler, so it
verifies a token sent in the **`x-krynox-captcha` header** — ideal for `fetch`/API clients.

```ts
// middleware.ts
import { krynoxMiddleware } from '@krynox/captcha-next';

export const middleware = krynoxMiddleware();
export const config = { matcher: ['/api/:path*'] };
```

Next.js middleware has no portable socket IP API. The secure default therefore
omits `remoteip`. On a managed edge, provide `resolveIp(request)` using the hosting
provider's official API (on Vercel, `ipAddress` from `@vercel/functions`), or opt
in only to a header that your edge removes and overwrites.

```ts
// client: send the solved token as a header
fetch('/api/action', {
  method: 'POST',
  headers: { 'x-krynox-captcha': token },
  body: JSON.stringify(payload),
});
```

## API

- `verifyKrynox(token, { secret?, apiHost?, remoteip?, timeoutMs?, retries? }) → Promise<KrynoxResult>`
- `krynoxMiddleware({ header?, secret?, apiHost?, methods?, trustedProxyHeader?, resolveIp? })` → Next middleware
- `<KrynoxCaptcha sitekey? challenge? apiHost? cdnHost? />` (from `/react`)

`KrynoxResult`: `{ success, score?, risk?, hostname?, challengeTs?, errorCodes?, reasons?, agent?, human? }`

- `reasons` — stable codes explaining the score (`tor-exit`, `elevated-request-rate`, …).
- `agent` — a verified AI agent (Web Bot Auth) when forwarded: `{ verified, name, allowlisted }`.
- `human` — a device-attested human (Private Access Token) when forwarded: `{ attested, method, issuer }`.

Transient failures (network / 429 / 5xx) are retried automatically (default 2), with a per-verify
idempotency key so a retried single-use token replays the first outcome instead of failing.

## Honeypot

Enable **Honeypot** in the Krynox dashboard and the widget injects an invisible decoy field
(`krynox-hp`) that only bots fill in. Because Next.js middleware can't read the request body, forward
it in your Route Handler / Server Action verify call:

```ts
const result = await verifyKrynox(token, { honeypot: form.get('krynox-hp') as string });
```

The data plane then floors the score (report mode) or rejects with `honeypot-tripped` (enforce mode).
See the [Honeypot docs](https://docs.krynox.net/server-side/honeypot/).

## License

MIT. Built for [Krynox Captcha](https://krynox.net) · docs: <https://docs.krynox.net>
