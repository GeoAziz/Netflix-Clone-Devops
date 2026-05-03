# Sentry Error Monitoring Setup

## Installation

```bash
npm install @sentry/react @sentry/tracing
```

## Configuration

Create `src/monitoring/sentry.js`:

```javascript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export const initSentry = () => {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    release: import.meta.env.VITE_APP_VERSION,
    beforeSend(event) {
      // Filter sensitive data
      if (event.request) {
        event.request.cookies = '[REDACTED]';
      }
      return event;
    },
  });
};

export default Sentry;
```

## Integration in App

In `src/App.jsx`:

```javascript
import { useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { initSentry } from './monitoring/sentry';

function App() {
  useEffect(() => {
    initSentry();
  }, []);

  return (
    // ... app content
  );
}

export default Sentry.withProfiler(App);
```

## Environment Variables

Add to `.env` and `.env.example`:

```env
VITE_SENTRY_DSN=https://your-key@o1234567.ingest.sentry.io/1234567
VITE_APP_VERSION=1.0.0
```

## Error Capturing

### Automatic Capture
- JavaScript errors
- Unhandled promise rejections
- Console errors
- Network errors

### Manual Capture

```javascript
import * as Sentry from '@sentry/react';

// Capture exception
try {
  doSomething();
} catch (error) {
  Sentry.captureException(error);
}

// Capture message
Sentry.captureMessage('Something happened', 'info');

// Add context
Sentry.setContext('user_action', {
  action: 'viewed_movie',
  movieId: 12345,
});

// Set user
Sentry.setUser({
  id: userId,
  email: userEmail,
});
```

## Performance Monitoring

### Transaction Tracking

```javascript
import * as Sentry from '@sentry/react';

export function fetchMovies(genre) {
  const transaction = Sentry.startTransaction({
    name: 'Fetch Movies',
    op: 'http.client',
  });

  const span = transaction.startChild({
    description: `Fetch ${genre} movies`,
    op: 'database.query',
  });

  try {
    const response = await fetch(`/api/movies?genre=${genre}`);
    const data = await response.json();
    span.setStatus('ok');
    return data;
  } catch (error) {
    span.setStatus('error');
    Sentry.captureException(error);
  } finally {
    span.finish();
    transaction.finish();
  }
}
```

### React Component Profiler

All components automatically profiled for:
- Mount time
- Update time
- Render count

## Alerts & Notifications

In Sentry Dashboard:
1. Go to "Alerts"
2. Create Alert Rule:
   - **When**: Error rate > 5% OR New Issue Created
   - **If**: Environment is Production
   - **Then**: Send Slack notification + Email

## Sensitive Data Filtering

Never log:
- Auth tokens (automatically filtered)
- passwords
- SSN/Personal IDs
- Credit card numbers

Configure in `beforeSend`:

```javascript
beforeSend(event) {
  if (event.extra?.password) {
    delete event.extra.password;
  }
  return event;
}
```

## Dashboard Monitoring

Track:
- Error volume over time
- Performance metrics
- User session replays
- Release health

## Cost Optimization

- Errors: $0.50 per 10k errors (first 100k free)
- Transactions: $0.02 per transaction
- Replays: $0.10 per 1000 replays

On Spark plan (low volume):
- ~500 errors/month = FREE
- ~1000 transactions/month = ~$0.02

Recommended: Set `tracesSampleRate: 0.1` (10% of transactions) in production.
