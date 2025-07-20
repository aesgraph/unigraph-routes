// Node.js built-in test runner
// Run with: node --test tests/performance.test.ts

import { test, describe } from "node:test";
import * as assert from "node:assert";
import { 
  makeAuthenticatedChatRequest, 
  isAuthAvailable,
  getAuthToken 
} from "./test-utils.js";

const CHAT_BASE_URL: string = process.env.BASE_URL || "http://localhost:3000";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface PerformanceMetrics {
  responseTime: number;
  success: boolean;
  statusCode: number;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Helper function to measure response time with authentication
async function measureAuthenticatedResponseTime(
  messages: any[],
  options: any = {}
): Promise<PerformanceMetrics> {
  const startTime = Date.now();

  try {
    const { response, data } = await makeAuthenticatedChatRequest(messages, options);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      responseTime,
      success: data.success,
      statusCode: response.status,
      error: data.error,
      usage: data.usage,
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      responseTime: endTime - startTime,
      success: false,
      statusCode: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper function to run concurrent authenticated requests
async function runConcurrentAuthenticatedRequests(
  messages: any[],
  options: any,
  concurrency: number
): Promise<PerformanceMetrics[]> {
  // Get the auth token once to use for all requests
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Failed to get auth token for concurrent requests");
  }

  const promises = Array(concurrency)
    .fill(null)
    .map(() => measureAuthenticatedResponseTime(messages, options));
  return Promise.all(promises);
}

describe("Chat API Performance Tests", () => {
  test("should have acceptable response time for basic requests", async () => {
    if (!isAuthAvailable()) {
      console.log("⚠️ Skipping performance test - auth credentials not configured");
      return;
    }

    const metrics = await measureAuthenticatedResponseTime(
      [
        {
          role: "user",
          content: "Say hello",
        },
      ],
      { max_tokens: 50 }
    );

    console.log(`⚡ Response time: ${metrics.responseTime}ms`);
    if (metrics.usage) {
      console.log(`📊 Token usage:`, metrics.usage);
    }

    assert.strictEqual(metrics.statusCode, 200);
    assert.strictEqual(metrics.success, true);
    assert.ok(
      metrics.responseTime < 10000,
      `Response time ${metrics.responseTime}ms is too slow (>10s)`
    );
    assert.ok(metrics.responseTime > 0, "Response time should be positive");
  });

  test("should handle concurrent requests efficiently", async () => {
    if (!isAuthAvailable()) {
      console.log("⚠️ Skipping performance test - auth credentials not configured");
      return;
    }

    const concurrency = 3;
    const messages = [
      {
        role: "user",
        content: "Quick response test",
      },
    ];
    const options = { max_tokens: 30 };

    const startTime = Date.now();
    const results = await runConcurrentAuthenticatedRequests(messages, options, concurrency);
    const totalTime = Date.now() - startTime;

    console.log(
      `⚡ ${concurrency} concurrent requests completed in ${totalTime}ms`
    );

    let successCount = 0;
    let totalResponseTime = 0;

    results.forEach((result: PerformanceMetrics, index: number) => {
      console.log(
        `  Request ${index + 1}: ${result.success ? "✅" : "❌"} Success (${
          result.statusCode
        }) - ${result.responseTime}ms`
      );
      if (result.success) {
        successCount++;
        totalResponseTime += result.responseTime;
      }
    });

    const successRate = (successCount / concurrency) * 100;
    const avgResponseTime =
      successCount > 0 ? totalResponseTime / successCount : 0;

    console.log(
      `📊 Success rate: ${successCount}/${concurrency} (${successRate.toFixed(
        1
      )}%)`
    );
    console.log(`📊 Average response time: ${avgResponseTime.toFixed(0)}ms`);

    assert.ok(
      successRate >= 80,
      `Success rate ${successRate}% is too low (<80%)`
    );
    assert.ok(
      avgResponseTime < 8000,
      `Average response time ${avgResponseTime}ms is too slow (>8s)`
    );
  });

  test("should handle large content efficiently", async () => {
    if (!isAuthAvailable()) {
      console.log("⚠️ Skipping performance test - auth credentials not configured");
      return;
    }

    // Create a large message to test handling of substantial input
    const largeContent = "This is a test message. ".repeat(100); // ~2800 characters

    const metrics = await measureAuthenticatedResponseTime(
      [
        {
          role: "user",
          content: largeContent,
        },
      ],
      { max_tokens: 100 }
    );

    console.log(
      `📏 Large content test (${largeContent.length} chars): ${metrics.responseTime}ms`
    );
    if (metrics.usage) {
      console.log(`📊 Token usage:`, metrics.usage);
    }

    assert.strictEqual(metrics.statusCode, 200);
    assert.strictEqual(metrics.success, true);
    assert.ok(
      metrics.responseTime < 15000,
      `Large content response time ${metrics.responseTime}ms is too slow (>15s)`
    );
  });

  test("should handle streaming responses efficiently", async () => {
    if (!isAuthAvailable()) {
      console.log("⚠️ Skipping performance test - auth credentials not configured");
      return;
    }

    const token = await getAuthToken();
    if (!token) {
      console.log("⚠️ Failed to get auth token for streaming test");
      return;
    }

    const startTime = Date.now();

    const response = await fetch(`${CHAT_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "Count from 1 to 5 slowly",
          },
        ],
        stream: true,
        max_tokens: 50,
      }),
    });

    const initialResponseTime = Date.now() - startTime;
    console.log(`⚡ Streaming initial response time: ${initialResponseTime}ms`);

    assert.strictEqual(response.status, 200);
    assert.ok(
      initialResponseTime < 5000,
      `Streaming initial response time ${initialResponseTime}ms is too slow (>5s)`
    );

    // Read the stream to completion
    const reader = response.body?.getReader();
    if (reader) {
      let chunkCount = 0;
      const streamStartTime = Date.now();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunkCount++;
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                const totalStreamTime = Date.now() - streamStartTime;
                console.log(
                  `📊 Streaming completed: ${chunkCount} chunks in ${totalStreamTime}ms`
                );
                assert.ok(
                  totalStreamTime < 10000,
                  `Total streaming time ${totalStreamTime}ms is too slow (>10s)`
                );
                return;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }
  });

  test("should maintain performance under different temperature settings", async () => {
    if (!isAuthAvailable()) {
      console.log("⚠️ Skipping performance test - auth credentials not configured");
      return;
    }

    const temperatures = [0.1, 0.5, 0.9];
    const results: { temp: number; responseTime: number }[] = [];

    for (const temp of temperatures) {
      const metrics = await measureAuthenticatedResponseTime(
        [
          {
            role: "user",
            content: "Say hello",
          },
        ],
        {
          temperature: temp,
          max_tokens: 30,
        }
      );

      console.log(`🌡️ Temperature ${temp}: ${metrics.responseTime}ms`);
      results.push({ temp, responseTime: metrics.responseTime });

      assert.strictEqual(metrics.statusCode, 200);
      assert.strictEqual(metrics.success, true);
    }

    // Check that response times are reasonably consistent across temperatures
    const avgTime =
      results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const maxDeviation = Math.max(
      ...results.map((r) => Math.abs(r.responseTime - avgTime))
    );

    console.log(`📊 Average response time: ${avgTime.toFixed(0)}ms`);
    console.log(`📊 Max deviation: ${maxDeviation.toFixed(0)}ms`);

    assert.ok(
      maxDeviation < avgTime * 0.5,
      `Response time variation too high: ${maxDeviation}ms vs avg ${avgTime}ms`
    );
  });

  test("should handle rate limiting gracefully", async () => {
    if (!isAuthAvailable()) {
      console.log("⚠️ Skipping performance test - auth credentials not configured");
      return;
    }

    // Make multiple rapid requests to test rate limiting behavior
    const rapidRequests = 5;
    const messages = [
      {
        role: "user",
        content: "Quick test",
      },
    ];
    const options = { max_tokens: 20 };

    const results = await runConcurrentAuthenticatedRequests(messages, options, rapidRequests);

    let successCount = 0;
    let rateLimitCount = 0;

    results.forEach((result: PerformanceMetrics, index: number) => {
      if (result.statusCode === 429) {
        rateLimitCount++;
        console.log(`  Request ${index + 1}: ⚠️ Rate limited (429)`);
      } else if (result.success) {
        successCount++;
        console.log(
          `  Request ${index + 1}: ✅ Success (${result.responseTime}ms)`
        );
      } else {
        console.log(`  Request ${index + 1}: ❌ Failed (${result.statusCode})`);
      }
    });

    console.log(
      `📊 Rapid requests: ${successCount} success, ${rateLimitCount} rate limited`
    );

    // At least some requests should succeed, and rate limiting should be handled gracefully
    assert.ok(
      successCount > 0 || rateLimitCount > 0,
      "No requests succeeded or were rate limited"
    );
  });
});
