// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://b281705d0773c62b9db7d08a3424dcdd@o4511106658795520.ingest.us.sentry.io/4511106659057664",

  // Prefetch / navigation / SDKs often abort in-flight fetch; not actionable for users
  ignoreErrors: [
    'AbortError',
    'signal is aborted without reason',
    /AbortError/i,
    /aborted without reason/i,
  ],

  // Heavily downsample traces in production — full sampling was sending a /monitoring
  // POST on every page view and adding ~300 KB of trace runtime to the initial bundle.
  // Keep full sampling in dev so local instrumentation still works.
  tracesSampleRate: isProduction ? 0.05 : 1,

  // Console-log forwarding wraps console.* and ships every log to Sentry. Off in prod.
  enableLogs: !isProduction,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
