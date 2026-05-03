/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals (LCP, FID, CLS, INP, TTFB)
 */

import { getCLS, getFCP, getFID, getLCP, getTTFB, getINP } from "web-vitals";
import * as Sentry from "@sentry/react";

export const initWebVitals = () => {
  // Largest Contentful Paint - When the largest content element is painted
  getLCP((metric) => {
    reportMetric(metric, "LCP");
    // Flag as warning if > 2.5s or poor if > 4s
    if (metric.value > 4000) {
      console.warn(`❌ Poor LCP: ${metric.value.toFixed(0)}ms`);
      Sentry.captureMessage(`Poor LCP performance: ${metric.value.toFixed(0)}ms`, "warning");
    } else if (metric.value > 2500) {
      console.warn(`⚠️ Needs improvement LCP: ${metric.value.toFixed(0)}ms`);
    }
  });

  // Cumulative Layout Shift - Unexpected layout shifts
  getCLS((metric) => {
    reportMetric(metric, "CLS");
    // Flag as warning if > 0.1 or poor if > 0.25
    if (metric.value > 0.25) {
      console.warn(`❌ Poor CLS: ${metric.value.toFixed(3)}`);
      Sentry.captureMessage(`Poor CLS performance: ${metric.value.toFixed(3)}`, "warning");
    } else if (metric.value > 0.1) {
      console.warn(`⚠️ Needs improvement CLS: ${metric.value.toFixed(3)}`);
    }
  });

  // First Contentful Paint - When first content is painted
  getFCP((metric) => {
    reportMetric(metric, "FCP");
  });

  // First Input Delay - Delay of first user interaction (deprecated, replaced by INP)
  getFID((metric) => {
    reportMetric(metric, "FID");
    if (metric.value > 300) {
      console.warn(`❌ Poor FID: ${metric.value.toFixed(0)}ms`);
      Sentry.captureMessage(`Poor FID performance: ${metric.value.toFixed(0)}ms`, "warning");
    }
  });

  // Interaction to Next Paint - Time from interaction to next frame paint
  getINP((metric) => {
    reportMetric(metric, "INP");
    if (metric.value > 500) {
      console.warn(`❌ Poor INP: ${metric.value.toFixed(0)}ms`);
      Sentry.captureMessage(`Poor INP performance: ${metric.value.toFixed(0)}ms`, "warning");
    }
  });

  // Time to First Byte - Backend response time
  getTTFB((metric) => {
    reportMetric(metric, "TTFB");
    if (metric.value > 600) {
      console.warn(`❌ Poor TTFB: ${metric.value.toFixed(0)}ms`);
      Sentry.captureMessage(`Poor TTFB performance: ${metric.value.toFixed(0)}ms`, "warning");
    }
  });
};

/**
 * Report metric to Sentry and local analytics
 */
function reportMetric(metric, name) {
  // Send to Sentry
  Sentry.captureMessage(`Web Vital - ${name}: ${metric.value.toFixed(0)}ms`, "info");

  // Send to analytics service (e.g., Google Analytics)
  if (window.gtag) {
    window.gtag("event", `web_vitals_${name.toLowerCase()}`, {
      event_category: "web_vitals",
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // Log locally
  console.log(`📊 ${name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);
}

/**
 * Track page navigation performance
 */
export const trackPageNavigation = () => {
  if (!window.performance || !window.performance.navigation) {
    return;
  }

  const navigationTiming = window.performance.timing;
  const pageLoadTime = navigationTiming.loadEventEnd - navigationTiming.navigationStart;
  const connectTime = navigationTiming.responseEnd - navigationTiming.requestStart;
  const renderTime = navigationTiming.domComplete - navigationTiming.domLoading;

  Sentry.setContext("page_performance", {
    pageLoadTime,
    connectTime,
    renderTime,
    domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart,
  });

  console.log(`📄 Page Load Time: ${pageLoadTime}ms (Connect: ${connectTime}ms, Render: ${renderTime}ms)`);
};

/**
 * Track resource timing
 */
export const trackResourceTiming = () => {
  if (!window.performance || !window.performance.getEntriesByType) {
    return;
  }

  const resources = window.performance.getEntriesByType("resource");
  const resourcesByType = {};

  resources.forEach((resource) => {
    const type = resource.initiatorType || "unknown";
    if (!resourcesByType[type]) {
      resourcesByType[type] = {
        count: 0,
        totalDuration: 0,
        totalSize: 0,
      };
    }
    resourcesByType[type].count++;
    resourcesByType[type].totalDuration += resource.duration;
    resourcesByType[type].totalSize += resource.transferSize || 0;
  });

  Sentry.setContext("resource_timing", resourcesByType);
  console.log("📦 Resource Timing:", resourcesByType);
};

export default {
  initWebVitals,
  trackPageNavigation,
  trackResourceTiming,
};
