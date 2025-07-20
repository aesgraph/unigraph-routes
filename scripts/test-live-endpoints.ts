#!/usr/bin/env npx tsx

// Test Live Vercel Endpoints
// Usage: npx tsx test-live-endpoints.ts <vercel-url>
// Example: npx tsx test-live-endpoints.ts https://unigraph-routes-3cstv7irs-aesgraph.vercel.app

import dotenv from "dotenv";
dotenv.config();

// Colors for output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logBold(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${colors.bold}${message}${colors.reset}`);
}

// Get URL from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  logBold("❌ Error: Vercel URL is required", "red");
  console.log("Usage: npx tsx test-live-endpoints.ts <vercel-url>");
  console.log(
    "Example: npx tsx test-live-endpoints.ts https://unigraph-routes-3cstv7irs-aesgraph.vercel.app"
  );
  process.exit(1);
}

const LIVE_URL = args[0].replace(/\/$/, ""); // Remove trailing slash

logBold(`🚀 Testing Live Endpoints at: ${LIVE_URL}`, "blue");
console.log("=".repeat(50));

interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role?: string;
  };
  tokens?: {
    access_token: string;
    refresh_token: string;
  };
  expires_at?: number;
  error?: string;
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

async function testEndpoint(
  name: string,
  url: string,
  options: RequestInit = {}
) {
  try {
    logBold(`\n${name}`, "yellow");

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const status = response.status;
    const statusText = response.statusText;

    // Try to parse JSON response
    let data: any;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    if (status >= 200 && status < 300) {
      log(`✅ Status: ${status} ${statusText}`, "green");
      if (typeof data === "object") {
        console.log("Response:", JSON.stringify(data, null, 2));
      } else {
        console.log("Response:", data);
      }
      return { success: true, data, status };
    } else {
      log(`❌ Status: ${status} ${statusText}`, "red");
      console.log("Response:", data);
      return { success: false, data, status };
    }
  } catch (error) {
    log(`❌ Request failed: ${error}`, "red");
    return { success: false, error, status: 0 };
  }
}

async function main() {
  // Test 1: Hello endpoint (public)
  await testEndpoint(
    "1. Testing Hello Endpoint (Public)",
    `${LIVE_URL}/api/hello`
  );

  // Test 2: Auth endpoint - Get bearer token
  logBold("\n2. Getting Bearer Token", "yellow");

  // Get credentials from environment or prompt
  let testEmail = process.env.TEST_EMAIL;
  let testPassword = process.env.TEST_PASSWORD;

  if (!testEmail || !testPassword) {
    log("⚠️ TEST_EMAIL and TEST_PASSWORD not found in .env", "yellow");
    log("Please add these to your .env file or enter them manually.");

    // For now, use defaults
    testEmail = "user@example.com"; //pragma: allowlist secret
    testPassword = "password123"; //pragma: allowlist secret
    log(`Using default credentials: ${testEmail}`, "yellow");
  }

  const authResult = await testEndpoint(
    "Getting Bearer Token",
    `${LIVE_URL}/api/auth`,
    {
      method: "POST",
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        action: "signin",
      }),
    }
  );

  let token: string | null = null;
  if (authResult.success && authResult.data?.tokens?.access_token) {
    token = authResult.data.tokens.access_token;
    log(`✅ Got token: ${token.substring(0, 20)}...`, "green");
  } else {
    log("❌ Failed to get token. Please check credentials.", "red");
    log(
      "Make sure your .env file has valid TEST_EMAIL and TEST_PASSWORD",
      "yellow"
    );
    return;
  }

  // Test 3: Chat endpoint without auth (should fail)
  await testEndpoint(
    "3. Testing Chat Without Auth (Should Fail)",
    `${LIVE_URL}/api/chat`,
    {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello without auth" }],
      }),
    }
  );

  // Test 4: Chat endpoint with auth (should work)
  if (token) {
    await testEndpoint(
      "4. Testing Chat With Auth (Should Work)",
      `${LIVE_URL}/api/chat`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "user", content: "Hello from live endpoint test!" },
          ],
        }),
      }
    );
  }

  // Test 5: Chat with streaming
  if (token) {
    logBold("\n5. Testing Chat With Streaming", "yellow");
    try {
      const response = await fetch(`${LIVE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Tell me a short joke" }],
          stream: true,
        }),
      });

      if (response.ok) {
        log(`✅ Status: ${response.status} ${response.statusText}`, "green");
        log("Streaming response (first 500 chars):", "blue");

        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let buffer = "";
          let totalChars = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  log("\n✅ Streaming complete", "green");
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    process.stdout.write(parsed.content);
                    totalChars += parsed.content.length;
                    if (totalChars > 500) {
                      log("\n... (truncated)", "yellow");
                      break;
                    }
                  }
                } catch (e) {
                  // Ignore JSON parsing errors for incomplete chunks
                }
              }
            }

            if (totalChars > 500) break;
          }
        }
      } else {
        log(`❌ Status: ${response.status} ${response.statusText}`, "red");
      }
    } catch (error) {
      log(`❌ Streaming request failed: ${error}`, "red");
    }
  }

  // Test 6: Invalid token
  await testEndpoint(
    "6. Testing With Invalid Token (Should Fail)",
    `${LIVE_URL}/api/chat`,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid-token-12345",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "This should fail" }],
      }),
    }
  );

  // Test 7: Missing messages field
  if (token) {
    await testEndpoint(
      "7. Testing With Missing Messages (Should Fail)",
      `${LIVE_URL}/api/chat`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stream: false,
        }),
      }
    );
  }

  // Test 8: Invalid HTTP method
  await testEndpoint(
    "8. Testing GET Request (Should Fail)",
    `${LIVE_URL}/api/chat`,
    {
      method: "GET",
    }
  );

  // Test 9: CORS preflight
  await testEndpoint(
    "9. Testing OPTIONS Request (CORS preflight)",
    `${LIVE_URL}/api/chat`,
    {
      method: "OPTIONS",
    }
  );

  logBold("\n🎉 Live endpoint testing complete!", "green");
  log(`Tested URL: ${LIVE_URL}`, "blue");
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  log(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`, "red");
  process.exit(1);
});

// Run the tests
main().catch((error) => {
  log(`❌ Test script failed: ${error}`, "red");
  process.exit(1);
});
