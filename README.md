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

```ts
// client: send the solved token as a header
fetch('/api/action', {
  method: 'POST',
  headers: { 'x-krynox-captcha': token },
  body: JSON.stringify(payload),
});
```

## API

- `verifyKrynox(token, { secret?, apiHost?, remoteip?, timeoutMs? }) → Promise<KrynoxResult>`
- `krynoxMiddleware({ header?, secret?, apiHost?, methods? })` → Next middleware
- `<KrynoxCaptcha sitekey? challenge? apiHost? cdnHost? />` (from `/react`)

`KrynoxResult`: `{ success, score?, risk?, hostname?, challengeTs?, errorCodes? }`

## License

MIT. Built for [Krynox Captcha](https://krynox.id) · docs: <https://krynox.id/docs>
