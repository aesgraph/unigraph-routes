// Quick test to verify environment configuration
// Run with: node tests/env-check.js

import dotenv from "dotenv";

dotenv.config();

// Simplified auth check without importing test-utils
async function getAuthToken() {
  const testEmail = process.env.TEST_EMAIL;
  const testPassword = process.env.TEST_PASSWORD;
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  if (!testEmail || !testPassword) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        action: "signin",
      }),
    });

    const data = await response.json();
    return data.success && data.tokens?.access_token
      ? data.tokens.access_token
      : null;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

function isAuthAvailable() {
  return !!(process.env.TEST_EMAIL && process.env.TEST_PASSWORD);
}

async function checkEnvironment() {
  console.log("🔍 Environment Configuration Check");
  console.log("==================================");

  // Check required environment variables
  const requiredVars = [
    "BASE_URL",
    "TEST_EMAIL",
    "TEST_PASSWORD",
    "APPROVED_USERS",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
  ];

  console.log("\n📋 Environment Variables:");
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      if (varName.includes("PASSWORD") || varName.includes("KEY")) {
        console.log(`  ✅ ${varName}: [HIDDEN]`);
      } else {
        console.log(`  ✅ ${varName}: ${value}`);
      }
    } else {
      console.log(`  ❌ ${varName}: NOT SET`);
    }
  }

  console.log("\n🔐 Authentication Test:");

  if (!isAuthAvailable()) {
    console.log(
      "  ❌ Authentication not available - missing TEST_EMAIL or TEST_PASSWORD"
    );
    return;
  }

  try {
    console.log("  🔄 Attempting to get auth token...");
    const token = await getAuthToken();

    if (token) {
      console.log("  ✅ Successfully obtained auth token");
      console.log(`  📝 Token preview: ${token.substring(0, 20)}...`);

      // Test the token with a simple request
      console.log("  🧪 Testing token with API call...");
      const baseUrl = process.env.BASE_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: "Hello, this is a test!",
            },
          ],
          max_tokens: 10,
        }),
      });

      const data = await response.json();

      if (response.status === 200 && data.success) {
        console.log("  ✅ Token works! API responded successfully");
        console.log(`  📊 Response: ${data.message?.substring(0, 50)}...`);
      } else {
        console.log(
          `  ❌ Token validation failed: ${response.status} - ${data.error}`
        );
      }
    } else {
      console.log("  ❌ Failed to obtain auth token");
    }
  } catch (error) {
    console.log(`  ❌ Auth test failed: ${error.message}`);
  }

  console.log("\n✨ Environment check complete!");
}

// Run the check
checkEnvironment().catch(console.error);
