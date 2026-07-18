// Server-safe entry (Node + Edge). The React widget lives at "@krynox/captcha-next/react".
export { verifyKrynox } from './verify';
export type { KrynoxResult, KrynoxAgent, KrynoxHuman, RiskLevel, VerifyOptions } from './verify';
export { krynoxMiddleware } from './middleware';
export type { KrynoxMiddlewareConfig } from './middleware';
