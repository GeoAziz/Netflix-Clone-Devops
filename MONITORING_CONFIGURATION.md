# Monitoring & Observability Configuration Guide

## Overview

Complete monitoring, error tracking, and performance observability setup for NetflixReact Clone.

---

## 1. Sentry Configuration (Error Tracking)

### 1.1 Setup

1. Create account at [sentry.io](https://sentry.io/)
2. Create new project (select "React")
3. Copy DSN: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

### 1.2 Installation

```bash
npm install @sentry/react @sentry/tracing web-vitals
```

### 1.3 Frontend Integration

**Configuration** (`src/monitoring/sentry.js`):
```javascript
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

**Usage in App** (`src/App.jsx`):
```javascript
import { initSentry } from './monitoring/sentry';

useEffect(() => {
  initSentry();
}, []);

export default Sentry.withProfiler(App);
```

### Alert Configuration

1. Go to Alerts → Create Alert Rule
2. Set trigger: Error rate > 5% OR New Issue
3. Set action: Slack notification + Email

**Example Alert Rule**:
```
When: Error rate > 5%
If: Environment is Production
Then: Send Slack #incidents
```

### Performance Monitoring

Sentry automatically tracks:
- JavaScript errors
- Unhandled promises
- Performance metrics
- Session replay

---

## 2. Web Vitals Monitoring

### Installation

```bash
npm install web-vitals
```

### Integration

**Create hook** (`src/hooks/useWebVitals.js`):
```javascript
import { useEffect } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import * as Sentry from '@sentry/react';

export function useWebVitals() {
  useEffect(() => {
    // Largest Contentful Paint
    getLCP((metric) => {
      logMetric('LCP', metric);
      if (metric.value > 2500) {
        Sentry.captureMessage('Slow LCP detected', 'warning');
      }
    });

    // First Input Delay
    getFID((metric) => {
      logMetric('FID', metric);
      if (metric.value > 100) {
        Sentry.captureMessage('High FID detected', 'warning');
      }
    });

    // Cumulative Layout Shift
    getCLS((metric) => {
      logMetric('CLS', metric);
      if (metric.value > 0.1) {
        Sentry.captureMessage('High CLS detected', 'warning');
      }
    });

    // First Contentful Paint
    getFCP((metric) => {
      logMetric('FCP', metric);
      if (metric.value > 1800) {
        Sentry.captureMessage('Slow FCP detected', 'info');
      }
    });

    // Time to First Byte
    getTTFB((metric) => {
      logMetric('TTFB', metric);
      if (metric.value > 600) {
        Sentry.captureMessage('Slow TTFB detected', 'info');
      }
    });
  }, []);
}

function logMetric(name, metric) {
  console.log(`${name}: ${Math.round(metric.value)}ms`);
  
  // Send to analytics
  if (window.gtag) {
    window.gtag('event', name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
    });
  }
}
```

**Use in App**:
```javascript
import { useWebVitals } from './hooks/useWebVitals';

function App() {
  useWebVitals();
  // ... rest of app
}
```

### Dashboard Metrics

Track in Google Analytics:
1. Go to Analytics → Reports → Engagement
2. View Web Vitals metric events
3. Set up alerts for thresholds

---

## 3. Application Health Checks

### Health Endpoint

**Implementation** (`api/health.js`):
```javascript
import admin from '../lib/firebaseAdmin';
import { tmdbClient } from '../lib/tmdbClient';

export default async function handler(req, res) {
  const timestamp = new Date().toISOString();
  
  const checks = {
    firestore: await checkFirestore(),
    tmdb: await checkTMDB(),
    auth: await checkAuth(),
  };

  const allHealthy = Object.values(checks).every(c => c.status === 'ok');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp,
    checks,
    uptime: process.uptime(),
  });
}

async function checkFirestore() {
  try {
    await admin.firestore().collection('_health').doc('check').get();
    return { status: 'ok', service: 'Firestore' };
  } catch (error) {
    console.error('Firestore check failed:', error);
    return { status: 'error', service: 'Firestore', error: error.message };
  }
}

async function checkTMDB() {
  try {
    const response = await tmdbClient.get('/configuration');
    return { status: response ? 'ok' : 'error', service: 'TMDB' };
  } catch (error) {
    return { status: 'error', service: 'TMDB', error: error.message };
  }
}

async function checkAuth() {
  try {
    await admin.auth().getUser('dummy');
  } catch (error) {
    // Expected to fail, just checking connectivity
    return { 
      status: error.code === 'auth/user-not-found' ? 'ok' : 'error',
      service: 'Firebase Auth'
    };
  }
}
```

### Monitoring Health Endpoint

**GitHub Actions** (`.github/workflows/health-check.yml`):
```yaml
name: Health Check

on:
  schedule:
    - cron: '*/5 * * * *' # Every 5 minutes

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check app health
        run: |
          RESPONSE=$(curl -s https://netflix-clone.vercel.app/api/health)
          STATUS=$(echo $RESPONSE | jq -r '.status')
          
          if [ "$STATUS" != "healthy" ]; then
            echo "❌ Health check failed: $RESPONSE"
            curl -X POST https://hooks.slack.com/services/YOUR_WEBHOOK \
              -H 'Content-Type: application/json' \
              -d "{\"text\": \"⚠️ Netflix Clone health check failed: $RESPONSE\"}"
            exit 1
          fi
          
          echo "✅ Health check passed"
```

---

## 4. Error Monitoring Alerts

### Sentry Alert Rules

**Rule 1: Error Spike**
```
When: Error count > 10 in 10 minutes
Then: Slack notification to #incidents
```

**Rule 2: New Issue**
```
When: First time seeing this error
Then: Email + Slack mention
```

**Rule 3: Performance Degradation**
```
When: API response time > 1s (95th percentile)
Then: Slack notification to #ops
```

### Configuration Example

```json
{
  "conditions": [
    {
      "id": "sentry.rules.conditions.event_frequency.EventFrequencyCondition",
      "value": 100,
      "comparisonType": "gt",
      "interval": "1h"
    }
  ],
  "actions": [
    {
      "service": "slack",
      "channel": "#incidents",
      "workspace": "workspace-id"
    }
  ],
  "name": "High error rate alert",
  "frequency": "high"
}
```

---

## 5. Firestore Quota Monitoring

### Quota Alerts

**Monitor in Firebase Console**:
1. Go to Firestore → Usage
2. View daily breakdown:
   - Reads: Target < 30k/day (Spark: 50k)
   - Writes: Target < 15k/day (Spark: 20k)
   - Deletes: Target < 5k/day

### Quota Alert Implementation

Create `api/monitoring/check-quotas.js`:

```javascript
import admin from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  // This requires manual quota tracking via Firebase Admin API
  // Or check via Firebase Console alerts
  
  const quotas = {
    reads: {
      daily_limit: 50000,
      estimated_today: 'N/A', // Manually check
      status: 'healthy'
    },
    writes: {
      daily_limit: 20000,
      estimated_today: 'N/A',
      status: 'healthy'
    }
  };

  res.status(200).json(quotas);
}
```

**Best Practice**: Check quotas manually in Firebase Console daily, or implement custom quota tracking.

---

## 6. API Performance Monitoring

### Response Time Tracking

Add to API routes:

```javascript
export default async function handler(req, res) {
  const startTime = Date.now();

  try {
    // ... handler logic
    
    const duration = Date.now() - startTime;
    
    // Log performance
    console.log(`${req.url}: ${duration}ms`);
    
    // Alert if slow
    if (duration > 1000) {
      console.warn(`⚠️ Slow API: ${req.url} took ${duration}ms`);
    }

    res.json({ data, _timing: duration });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`${req.url}: failed after ${duration}ms`, error);
    res.status(500).json({ error: error.message });
  }
}
```

### Logging Strategy

Use Vercel's native logging:

```bash
# View production logs
vercel logs --follow --prod

# View logs for specific function
vercel logs api/content/trending
```

---

## 7. Third-Party Status Monitoring

### TMDB API Status

Monitor API availability:

```javascript
// Check TMDB endpoint
async function checkTMDBStatus() {
  try {
    const response = await fetch('https://api.themoviedb.org/3/configuration', {
      headers: {
        'Authorization': `Bearer ${process.env.TMDB_TOKEN}`
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

### Firebase Status

Check official status page:
- https://www.firebase-status.com/
- https://status.firebase.google.com/

---

## 8. Custom Monitoring Dashboard

### Metrics to Track

Create `api/analytics/dashboard.js`:

```javascript
export default async function handler(req, res) {
  const dashboardData = {
    performance: {
      avg_response_time: 'N/A',
      p95_response_time: 'N/A',
      error_rate: 'N/A',
    },
    errors: {
      total_today: 'N/A',
      total_week: 'N/A',
      top_error: 'N/A',
    },
    users: {
      active_today: 'N/A',
      new_today: 'N/A',
    },
    quota: {
      firestore_reads: 'N/A',
      firestore_writes: 'N/A',
    },
  };

  // In production, fetch from Sentry, Google Analytics, Firebase
  res.json(dashboardData);
}
```

### Visualization Tools

- **Google Analytics**: User behavior + Web Vitals
- **Sentry Dashboard**: Error tracking + Performance
- **Vercel Analytics**: Deployment metrics
- **Firebase Console**: Quota usage

---

## 9. Alerting Strategy

### Alert Levels

| Level | Condition | Response |
|-------|-----------|----------|
| Info | < 1% error rate | Log only |
| Warning | 1-5% error rate | Slack notification |
| Critical | > 5% error rate | Slack + Email + Call |
| Severe | Service down | All channels + page |

### Notification Channels

**Setup Slack Integration**:
1. Go to Sentry → Settings → Integrations
2. Add Slack workspace
3. Select channels for alerts

**Email Alerts**:
- Configured per team member
- Critical issues only

---

## 10. Monitoring Checklist

- [ ] Sentry project created and DSN added
- [ ] Web Vitals tracking enabled
- [ ] Health endpoint deployed
- [ ] Alert rules configured
- [ ] Slack integration active
- [ ] Firestore quotas monitored
- [ ] API performance tracked
- [ ] Error logging implemented
- [ ] Dashboard created
- [ ] Weekly review scheduled

---

## 11. Weekly Monitoring Review

### Monday Morning Checklist

```
- [ ] Review error rate from previous week
- [ ] Check Firestore quota usage
- [ ] Verify all services healthy via /api/health
- [ ] Review Web Vitals metrics
- [ ] Check deployment success rate
- [ ] Review user activity
```

### Monthly Review

```
- [ ] Analyze performance trends
- [ ] Review alert effectiveness
- [ ] Check for scaling needs
- [ ] Plan optimizations
- [ ] Update documentation
```

---

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Firebase Monitoring](https://firebase.google.com/docs/perf-mon)
- [Vercel Analytics](https://vercel.com/analytics)
- [Google Analytics 4](https://support.google.com/analytics/)
