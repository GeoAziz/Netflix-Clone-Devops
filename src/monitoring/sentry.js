import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

// Initialize Sentry for error tracking and performance monitoring
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new BrowserTracing({
      // Set sampling rate for performance monitoring
      tracingOrigins: ["localhost", /^\//],
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        window.history
      ),
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Capture 100% of transactions for development, 10% for production
  tracesSampleRate:
    import.meta.env.MODE === "production" ? 0.1 : 1.0,
  
  // Capture 100% of Replay for development, 20% for production
  replaysSessionSampleRate:
    import.meta.env.MODE === "production" ? 0.2 : 1.0,
  
  // Capture 100% of errors in Replay
  replaysOnErrorSampleRate: 1.0,

  // Release tracking
  release: import.meta.env.VITE_APP_VERSION,

  // Before sending to Sentry, filter out sensitive data
  beforeSend(event, hint) {
    // Filter out health checks and noise
    if (event.request?.url?.includes("/health")) {
      return null;
    }
    return event;
  },

  // Ignore certain errors
  ignoreErrors: [
    // Random plugins/extensions
    "top.GLOBALS",
    // See http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    // Network errors from video players
    "NetworkError",
    "ResizeObserver",
  ],
});

export default Sentry;
