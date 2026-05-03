// Error handler middleware for Vercel API routes
// Captures errors and sends to Sentry with context

import * as Sentry from "@sentry/serverless";

// Initialize Sentry for server-side
Sentry.init({
  dsn: globalThis.process?.env?.SENTRY_DSN,
  environment: globalThis.process?.env?.NODE_ENV,
  tracesSampleRate: globalThis.process?.env?.NODE_ENV === "production" ? 0.1 : 1.0,
  release: globalThis.process?.env?.APP_VERSION,
});

export const withErrorHandler = (handler) => {
  return Sentry.withSentryAPI(async (req, res) => {
    // Add request metadata to Sentry scope
    Sentry.setContext("request", {
      method: req.method,
      url: req.url,
      headers: {
        "user-agent": req.headers["user-agent"],
        "x-forwarded-for": req.headers["x-forwarded-for"],
      },
    });

    // Add custom tags
    Sentry.setTag("api_route", req.url);
    Sentry.setTag("method", req.method);

    try {
      await handler(req, res);
    } catch (error) {
      // Capture error with context
      Sentry.captureException(error, {
        contexts: {
          request: {
            method: req.method,
            url: req.url,
          },
          query: req.query,
        },
      });

      // Log error details
      console.error("[API Error]", {
        route: req.url,
        method: req.method,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });

      // Return error response
      res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
        requestId: res.getHeader("x-request-id"),
        timestamp: new Date().toISOString(),
        ...(globalThis.process?.env?.NODE_ENV === "development" && {
          stack: error.stack,
        }),
      });
    }
  });
};

export default {
  withErrorHandler,
};
