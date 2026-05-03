# Web Vitals Monitoring Setup

## Installation

```bash
npm install web-vitals
```

## Configuration

Create `src/monitoring/webVitals.js`:

```javascript
import {
  getCLS,
  getFID,
  getFCP,
  getLCP,
  getTTFB,
} from 'web-vitals';
import * as Sentry from '@sentry/react';

export const trackWebVitals = () => {
  // Cumulative Layout Shift
  getCLS((metric) => {
    logMetric('CLS', metric);
    if (metric.value > 0.1) {
      Sentry.captureMessage('High CLS detected', 'warning', {
        contexts: { web_vitals: metric },
      });
    }
  });

  // First Input Delay
  getFID((metric) => {
    logMetric('FID', metric);
    if (metric.value > 100) {
      Sentry.captureMessage('High FID detected', 'warning', {
        contexts: { web_vitals: metric },
      });
    }
  });

  // First Contentful Paint
  getFCP((metric) => {
    logMetric('FCP', metric);
    if (metric.value > 1800) {
      Sentry.captureMessage('Slow FCP detected', 'info', {
        contexts: { web_vitals: metric },
      });
    }
  });

  // Largest Contentful Paint
  getLCP((metric) => {
    logMetric('LCP', metric);
    if (metric.value > 2500) {
      Sentry.captureMessage('Slow LCP detected', 'warning', {
        contexts: { web_vitals: metric },
      });
    }
  });

  // Time to First Byte
  getTTFB((metric) => {
    logMetric('TTFB', metric);
    if (metric.value > 600) {
      Sentry.captureMessage('Slow TTFB detected', 'info', {
        contexts: { web_vitals: metric },
      });
    }
  });
};

function logMetric(name, metric) {
  const msg = `${name}: ${Math.round(metric.value)}ms`;
  console.log(msg);

  // Send to analytics
  if (window.gtag) {
    window.gtag('event', name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
    });
  }

  // Send to custom analytics endpoint
  sendAnalytics({
    metric: name,
    value: metric.value,
    id: metric.id,
    rating: metric.rating,
    navigationType: metric.navigationType,
  });
}

async function sendAnalytics(data) {
  try {
    await fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true,
    });
  } catch (error) {
    console.error('Failed to send analytics:', error);
  }
}
```

## Integration in App

In `src/main.jsx`:

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { trackWebVitals } from './monitoring/webVitals'
import './index.css'

trackWebVitals();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

## Metrics Explained

### Core Web Vitals (User Experience)

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5s - 4.0s | > 4.0s |
| **FID** (First Input Delay) | < 100ms | 100ms - 300ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1 - 0.25 | > 0.25 |

### Additional Web Vitals

| Metric | Description | Target |
|--------|-------------|--------|
| **FCP** (First Contentful Paint) | First pixel painted | < 1.8s |
| **TTFB** (Time to First Byte) | Server response time | < 600ms |
| **FPS** (Frames Per Second) | Animation smoothness | 60 fps |

## Monitoring Dashboard

### Google Analytics Integration

```javascript
// In window.gtag callback
window.gtag('config', 'GA_ID', {
  'page_path': window.location.pathname,
});

// Send custom events
window.gtag('event', 'purchase', {
  value: 99.99,
  currency: 'USD',
});
```

### Custom Analytics Dashboard

Create `api/analytics/web-vitals.js`:

```javascript
import { db } from '@/lib/firebaseAdmin';
import { validateRequest } from '@/lib/validation';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { metric, value, id, rating } = validateRequest(req.body, {
      metric: 'string',
      value: 'number',
      id: 'string',
      rating: 'string',
    });

    await db.collection('analytics').doc('web_vitals').collection('metrics').add({
      metric,
      value,
      id,
      rating,
      timestamp: new Date(),
      url: req.headers.referer,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to log analytics' });
  }
}
```

## Performance Optimization Tips

### Improve LCP
- Optimize images (WebP format, lazy loading)
- Minimize JavaScript
- Use font-display: swap
- Enable HTTP/2 Server Push

### Improve FID
- Break up long JavaScript tasks
- Use requestIdleCallback() for non-critical work
- Defer non-critical scripts

### Improve CLS
- Set explicit width/height on images
- Avoid inserting content above existing content
- Use transform animations instead of reflow-triggering properties

## Thresholds & Alerts

```javascript
const THRESHOLDS = {
  LCP: 2500,    // 2.5 seconds
  FID: 100,     // 100 milliseconds
  CLS: 0.1,     // 0.1 score
  FCP: 1800,    // 1.8 seconds
  TTFB: 600,    // 600 milliseconds
};

function checkThreshold(metric) {
  const threshold = THRESHOLDS[metric.name];
  if (metric.value > threshold) {
    sendAlert(`${metric.name} exceeded threshold: ${metric.value}ms`);
  }
}
```

## Testing Web Vitals Locally

```bash
# Run Lighthouse CLI
npm install -g @lhci/cli@latest lighthouse

# Create .lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:5173"],
      "numberOfRuns": 3
    },
    "upload": {
      "target": "temporary-public-storage"
    },
    "assert": {
      "preset": "lighthouse:recommended"
    }
  }
}

# Run audit
lhci autorun
```

## Vercel Analytics

Vercel automatically collects Core Web Vitals. View in:
1. Vercel Dashboard → Analytics tab
2. Real User Monitoring (RUM) data
3. Performance insights per route

## Resources

- [Web Vitals Guide](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [CrUX Dashboard](https://developers.google.com/web/tools/crux-dashboard)
- [PageSpeed Insights](https://pagespeed.web.dev/)
