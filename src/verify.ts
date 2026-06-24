export type RiskLevel = 'low' | 'medium' | 'high';

export interface KrynoxResult {
  success: boolean;
  score?: number;
  risk?: RiskLevel;
  hostname?: string;
  challengeTs?: string;
  errorCodes?: string[];
}

export interface VerifyOptions {
  /** Secret key. Defaults to process.env.KRYNOX_SECRET_KEY. */
  secret?: string;
  /** Data-plane host. Defaults to process.env.KRYNOX_API_HOST or api.krynox.id. */
  apiHost?: string;
  /** End-user IP (recommended). */
  remoteip?: string;
  /** Request timeout in ms (default 5000). */
  timeoutMs?: number;
}

/**
 * Verify a solved Krynox token against POST /siteverify. Works in the Node and Edge
 * runtimes (uses global fetch). Use this in Route Handlers, Server Actions, or middleware.
 */
export async function verifyKrynox(
  token: string | null | undefined,
  options: VerifyOptions = {},
): Promise<KrynoxResult> {
  if (!token) return { success: false, errorCodes: ['missing-input-response'] };

  const secret = options.secret ?? process.env.KRYNOX_SECRET_KEY ?? '';
  const apiHost = (options.apiHost ?? process.env.KRYNOX_API_HOST ?? 'https://api.krynox.id').replace(/\/$/, '');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);
  try {
    const res = await fetch(`${apiHost}/siteverify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: options.remoteip }),
      signal: controller.signal,
    });
    const data = (await res.json()) as Record<string, unknown>;
    return {
      success: data.success === true,
      score: typeof data.score === 'number' ? data.score : undefined,
      risk: data.risk as RiskLevel | undefined,
      hostname: typeof data.hostname === 'string' ? data.hostname : undefined,
      challengeTs: typeof data.challenge_ts === 'string' ? data.challenge_ts : undefined,
      errorCodes: Array.isArray(data['error-codes']) ? (data['error-codes'] as string[]) : undefined,
    };
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    return { success: false, errorCodes: [aborted ? 'timeout' : 'request-failed'] };
  } finally {
    clearTimeout(timer);
  }
}
