#!/usr/bin/env node
/**
 * Load Testing Suite for NetflixReact Clone
 * Tests critical infrastructure limits and bottlenecks
 * 
 * Usage:
 *   node tests/loadTest.js --endpoint=http://localhost:5173 --duration=60 --users=100
 */

const axios = require("axios");
const { performance } = require("perf_hooks");
const fs = require("fs");
const path = require("path");

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split("=");
  acc[key.replace("--", "")] = value || true;
  return acc;
}, {});

const CONFIG = {
  endpoint: args.endpoint || "http://localhost:5173",
  duration: parseInt(args.duration) || 30,
  maxConcurrentUsers: parseInt(args.users) || 50,
  rampUpTime: parseInt(args.rampup) || 10,
};

// Test scenarios
const scenarios = {
  // Firestore limits: 50k reads/day, 20k writes/day
  firestoreReads: {
    name: "Firestore Read Operations",
    endpoint: "/api/user/watchHistory",
    method: "GET",
    maxRPS: 600, // 50k reads/day ≈ 0.58 RPS sustained, 600 RPS burst
  },
  firestoreWrites: {
    name: "Firestore Write Operations",
    endpoint: "/api/auth/create-profile",
    method: "POST",
    payload: {
      name: "Test Profile",
      avatar: 1,
    },
    maxRPS: 230, // 20k writes/day ≈ 0.23 RPS sustained, 230 RPS burst
  },
  // TMDB API: 40 requests/10 seconds = 4 RPS limit
  tmdbAPI: {
    name: "TMDB API Proxy",
    endpoint: "/api/tmdb/trending/movie/week?page=1",
    method: "GET",
    maxRPS: 40,
  },
  // Vercel: 30s timeout per function
  vercelTimeout: {
    name: "Vercel Function Timeout (30s)",
    endpoint: "/api/content/trending",
    method: "GET",
    timeout: 30000,
  },
  // Search with debounce
  searchAPI: {
    name: "Search API (300ms debounce)",
    endpoint: "/api/content/search",
    method: "GET",
    params: { q: "action" },
    maxRPS: 100,
  },
};

// Metrics tracking
let metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalDuration: 0,
  minDuration: Infinity,
  maxDuration: 0,
  avgDuration: 0,
  errors: {},
  statusCodes: {},
  rpsHistory: [],
};

/**
 * Execute load test for a single scenario
 */
async function loadTestScenario(scenario, durationSeconds = CONFIG.duration) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📍 Endpoint: ${scenario.endpoint}`);
  console.log(`⏱️  Duration: ${durationSeconds}s`);
  console.log(`👥 Max Concurrent Users: ${CONFIG.maxConcurrentUsers}\n`);

  const startTime = performance.now();
  let requestCount = 0;
  let currentUsers = 0;
  const rampUpInterval = CONFIG.rampUpTime / CONFIG.maxConcurrentUsers;
  let scenarioMetrics = {
    requests: 0,
    success: 0,
    failed: 0,
    durations: [],
    errors: {},
    statusCodes: {},
  };

  // Ramp up users gradually
  const rampUpPromises = [];
  for (let i = 0; i < CONFIG.maxConcurrentUsers; i++) {
    const delay = i * rampUpInterval * 1000;
    rampUpPromises.push(
      new Promise((resolve) => {
        setTimeout(() => {
          currentUsers++;
          resolve();
        }, delay);
      })
    );
  }

  await Promise.all(rampUpPromises);

  // Send requests for duration
  const requestPromises = [];
  const sendRequest = async () => {
    while (performance.now() - startTime < durationSeconds * 1000) {
      const reqStartTime = performance.now();

      try {
        const config = {
          method: scenario.method,
          url: `${CONFIG.endpoint}${scenario.endpoint}`,
          timeout: scenario.timeout || 10000,
        };

        if (scenario.method === "POST") {
          config.data = scenario.payload;
        } else if (scenario.params) {
          config.params = scenario.params;
        }

        const response = await axios(config);
        const duration = performance.now() - reqStartTime;

        scenarioMetrics.success++;
        scenarioMetrics.durations.push(duration);
        scenarioMetrics.statusCodes[response.status] =
          (scenarioMetrics.statusCodes[response.status] || 0) + 1;
      } catch (error) {
        const duration = performance.now() - reqStartTime;
        scenarioMetrics.failed++;
        scenarioMetrics.durations.push(duration);

        const statusCode = error.response?.status || "TIMEOUT";
        scenarioMetrics.statusCodes[statusCode] =
          (scenarioMetrics.statusCodes[statusCode] || 0) + 1;
        scenarioMetrics.errors[error.message] =
          (scenarioMetrics.errors[error.message] || 0) + 1;
      }

      scenarioMetrics.requests++;
    }
  };

  // Start requests from all virtual users
  for (let i = 0; i < CONFIG.maxConcurrentUsers; i++) {
    requestPromises.push(sendRequest());
  }

  await Promise.all(requestPromises);

  // Calculate statistics
  const totalDuration = scenarioMetrics.durations.reduce((a, b) => a + b, 0);
  const avgDuration = totalDuration / scenarioMetrics.durations.length;
  const sortedDurations = scenarioMetrics.durations.sort((a, b) => a - b);
  const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)];
  const p99 = sortedDurations[Math.floor(sortedDurations.length * 0.99)];

  // Display results
  console.log(`
📊 Results for ${scenario.name}:
├─ Total Requests: ${scenarioMetrics.requests}
├─ Successful: ${scenarioMetrics.success} (${((scenarioMetrics.success / scenarioMetrics.requests) * 100).toFixed(2)}%)
├─ Failed: ${scenarioMetrics.failed} (${((scenarioMetrics.failed / scenarioMetrics.requests) * 100).toFixed(2)}%)
├─ Duration:
│  ├─ Min: ${Math.min(...scenarioMetrics.durations).toFixed(2)}ms
│  ├─ Avg: ${avgDuration.toFixed(2)}ms
│  ├─ P95: ${p95.toFixed(2)}ms
│  ├─ P99: ${p99.toFixed(2)}ms
│  └─ Max: ${Math.max(...scenarioMetrics.durations).toFixed(2)}ms
├─ Requests/sec: ${(scenarioMetrics.requests / durationSeconds).toFixed(2)}
└─ Max RPS Limit: ${scenario.maxRPS}
  `);

  if (Object.keys(scenarioMetrics.statusCodes).length > 0) {
    console.log(`Status Codes:`, scenarioMetrics.statusCodes);
  }
  if (Object.keys(scenarioMetrics.errors).length > 0) {
    console.log(`Errors:`, scenarioMetrics.errors);
  }

  // Merge into global metrics
  metrics.totalRequests += scenarioMetrics.requests;
  metrics.successfulRequests += scenarioMetrics.success;
  metrics.failedRequests += scenarioMetrics.failed;
  metrics.rpsHistory.push((scenarioMetrics.requests / durationSeconds).toFixed(2));

  return scenarioMetrics;
}

/**
 * Run all load test scenarios
 */
async function runAllTests() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          NetflixReact Clone - Load Testing Suite            ║
║                                                              ║
║  Testing Infrastructure Limits:                             ║
║  • Firestore: 50k reads/day, 20k writes/day                 ║
║  • TMDB API: 40 requests/10 seconds                          ║
║  • Vercel: 30s timeout per function                          ║
║  • Concurrent Users: ${CONFIG.maxConcurrentUsers}
╚════════════════════════════════════════════════════════════╝
  `);

  const testStartTime = performance.now();

  // Run each scenario
  for (const [key, scenario] of Object.entries(scenarios)) {
    try {
      await loadTestScenario(scenario, CONFIG.duration);
    } catch (error) {
      console.error(`❌ Error in scenario ${scenario.name}:`, error.message);
    }
  }

  const totalTime = (performance.now() - testStartTime) / 1000;

  // Summary
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                      TEST SUMMARY                           ║
╠════════════════════════════════════════════════════════════╣
║ Total Requests: ${metrics.totalRequests}
║ Successful: ${metrics.successfulRequests}
║ Failed: ${metrics.failedRequests}
║ Success Rate: ${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%
║ Avg RPS: ${(metrics.totalRequests / totalTime).toFixed(2)}
║ Total Time: ${totalTime.toFixed(2)}s
╚════════════════════════════════════════════════════════════╝
  `);

  // Save results to file
  const reportPath = path.join("reports", "load-test-results.json");
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        config: CONFIG,
        metrics,
      },
      null,
      2
    )
  );

  console.log(`\n📝 Report saved to ${reportPath}`);
}

// Run tests
runAllTests().catch(console.error);
