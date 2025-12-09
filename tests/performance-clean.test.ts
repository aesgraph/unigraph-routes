// Load testing and performance tests
// Run with: npx tsx tests/performance-clean.test.ts

import { getAuthToken, isAuthAvailable } from "./test-utils.js";

const PERF_BASE_URL: string = process.env.BASE_URL || "http://localhost:3000";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  model?: string;
}

interface ChatResponse {
  success: boolean;
  message?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
}

async function performanceTest(): Promise<void> {
  console.log("⚡ Performance Testing Chat API...\n");

  if (!isAuthAvailable()) {
    console.log(
      "❌ Cannot run performance tests - auth credentials not configured",
    );
    console.log("   Please add TEST_EMAIL and TEST_PASSWORD to your .env file");
    return;
  }

  const token = await getAuthToken();
  if (!token) {
    console.log("❌ Failed to get authentication token");
    return;
  }

  // Test 1: Response time test
  console.log("1️⃣ Testing response time...");
  const startTime = Date.now();

  try {
    const response = await fetch(`${PERF_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: 'Say "Hello World"',
          },
        ],
        max_tokens: 10,
        temperature: 0,
      }),
    });

    const data: ChatResponse = await response.json();
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (data.success) {
      console.log(`✅ Response time: ${responseTime}ms`);
      console.log(`📊 Token usage:`, data.usage);

      if (responseTime < 5000) {
        console.log("✅ Response time is acceptable (< 5s)");
      } else {
        console.log("⚠️ Response time is slow (> 5s)");
      }
    } else {
      console.log("❌ Request failed:", data.error);
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.log("❌ Performance test failed:", err.message);
  }

  console.log("\n" + "─".repeat(50) + "\n");

  // Test 2: Concurrent requests test
  console.log("2️⃣ Testing concurrent requests...");
  const concurrentRequests: number = 3;
  const requests: Promise<Response>[] = [];

  for (let i = 0; i < concurrentRequests; i++) {
    const requestBody: ChatRequest = {
      messages: [
        {
          role: "user",
          content: `Test request number ${i + 1}`,
        },
      ],
      max_tokens: 20,
    };

    requests.push(
      fetch(`${PERF_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      }),
    );
  }

  const concurrentStartTime: number = Date.now();

  try {
    const responses: Response[] = await Promise.all(requests);
    const concurrentEndTime: number = Date.now();
    const concurrentTime: number = concurrentEndTime - concurrentStartTime;

    console.log(
      `✅ ${concurrentRequests} concurrent requests completed in ${concurrentTime}ms`,
    );

    let successCount: number = 0;
    for (let i = 0; i < responses.length; i++) {
      const data: ChatResponse = await responses[i].json();
      if (data.success) {
        successCount++;
        console.log(`  Request ${i + 1}: ✅ Success (${responses[i].status})`);
      } else {
        console.log(
          `  Request ${i + 1}: ❌ Failed (${responses[i].status}) - ${
            data.error
          }`,
        );
      }
    }

    console.log(
      `📊 Success rate: ${successCount}/${concurrentRequests} (${(
        (successCount / concurrentRequests) *
        100
      ).toFixed(1)}%)`,
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.log("❌ Concurrent test failed:", err.message);
  }

  console.log("\n" + "─".repeat(50) + "\n");

  // Test 3: Large content test
  console.log("3️⃣ Testing large content handling...");
  const largeContent = "Tell me a story. ".repeat(100);

  const largeTestStart = Date.now();

  try {
    const response = await fetch(`${PERF_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: largeContent,
          },
        ],
        max_tokens: 50,
      }),
    });

    const data: ChatResponse = await response.json();
    const largeTestEnd = Date.now();
    const largeTestTime = largeTestEnd - largeTestStart;

    console.log(`📝 Input content length: ${largeContent.length} characters`);
    console.log(`⏱️ Processing time: ${largeTestTime}ms`);

    if (data.success) {
      console.log("✅ Large content handled successfully");
      console.log(`📊 Token usage:`, data.usage);
    } else {
      console.log("❌ Large content test failed:", data.error);
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.log("❌ Large content test failed:", err.message);
  }

  console.log("\n🏁 Performance testing complete!");
}

function logMemoryUsage(): void {
  const used = process.memoryUsage();
  console.log("\n📊 Memory Usage:");
  for (let key in used) {
    console.log(
      `  ${key}: ${
        Math.round(
          (used[key as keyof NodeJS.MemoryUsage] / 1024 / 1024) * 100,
        ) / 100
      } MB`,
    );
  }
}

async function runPerformanceTests(): Promise<void> {
  console.log("Starting performance tests...\n");
  logMemoryUsage();

  await performanceTest();

  console.log("\nFinal memory usage:");
  logMemoryUsage();
}

runPerformanceTests().catch(console.error);
