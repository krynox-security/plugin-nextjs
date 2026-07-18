'use client';

import { createElement, useEffect, type ReactElement } from 'react';

export interface KrynoxCaptchaProps {
  /** Public site key (kcpt_…). Ignored if `challenge` is given. */
  sitekey?: string;
  /** Full challenge URL override. */
  challenge?: string;
  apiHost?: string;
  cdnHost?: string;
  /** Any extra attributes forwarded to the <krynox-captcha> element. */
  [attr: string]: unknown;
}

/**
 * Renders the <krynox-captcha> widget and lazily loads its script from the CDN.
 * The widget injects the solved token as a hidden `krynox-captcha` form field.
 *
 *   import { KrynoxCaptcha } from '@krynox/captcha-next/react';
 *   <KrynoxCaptcha sitekey={process.env.NEXT_PUBLIC_KRYNOX_SITE_KEY} />
 */
export function KrynoxCaptcha({
  sitekey,
  challenge,
  apiHost = 'https://api.krynox.net',
  cdnHost = 'https://cdn.krynox.net',
  ...rest
}: KrynoxCaptchaProps): ReactElement {
  const cdn = cdnHost.replace(/\/$/, '');

  useEffect(() => {
    const src = `${cdn}/widget/krynox-captcha.js`;
    if (!document.querySelector(`script[src="${src}"]`)) {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.defer = true;
      s.type = 'module';
      document.head.appendChild(s);
    }
  }, [cdn]);

  const ch = challenge ?? `${apiHost.replace(/\/$/, '')}/challenge?sitekey=${encodeURIComponent(sitekey ?? '')}`;
  return createElement('krynox-captcha', { challenge: ch, ...rest });
}
