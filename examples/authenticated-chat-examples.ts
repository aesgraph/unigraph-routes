// Example usage of the Authenticated Chat API
// This file demonstrates how to use the chat endpoint with authentication

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

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

// Step 1: Get authentication token
async function getAuthToken(): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: process.env.TEST_EMAIL,
        password: process.env.TEST_PASSWORD,
        action: "signin",
      }),
    });

    const data: AuthResponse = await response.json();

    if (data.success && data.tokens?.access_token) {
      console.log("✅ Authentication successful");
      console.log(`   User: ${data.user?.email}`);
      console.log(`   Token: ${data.tokens.access_token.substring(0, 30)}...`);
      return data.tokens.access_token;
    } else {
      console.log("❌ Authentication failed:", data.error);
      return null;
    }
  } catch (error) {
    console.error("❌ Auth request failed:", error);
    return null;
  }
}

// Step 2: Use authenticated chat API
async function authenticatedChatExample(token: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "Hello! This is an authenticated request.",
          },
        ],
        max_tokens: 100,
      }),
    });

    const data: ChatResponse = await response.json();

    if (data.success) {
      console.log("✅ Authenticated chat successful!");
      console.log("   Response:", data.message);
      if (data.usage) {
        console.log("   Usage:", data.usage);
      }
    } else {
      console.log("❌ Chat failed:", data.error);
    }
  } catch (error) {
    console.error("❌ Chat request failed:", error);
  }
}

// Step 3: Test without authentication (should fail)
async function unauthenticatedChatExample() {
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // No Authorization header
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "This should fail without authentication.",
          },
        ],
      }),
    });

    const data: ChatResponse = await response.json();

    if (response.status === 401) {
      console.log("✅ Unauthenticated request correctly rejected");
      console.log("   Error:", data.error);
    } else {
      console.log("❌ Unexpected response:", response.status, data);
    }
  } catch (error) {
    console.error("❌ Request failed:", error);
  }
}

// Step 4: Test with invalid token (should fail)
async function invalidTokenChatExample() {
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid-token-here",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "This should fail with invalid token.",
          },
        ],
      }),
    });

    const data: ChatResponse = await response.json();

    if (response.status === 401) {
      console.log("✅ Invalid token correctly rejected");
      console.log("   Error:", data.error);
    } else {
      console.log("❌ Unexpected response:", response.status, data);
    }
  } catch (error) {
    console.error("❌ Request failed:", error);
  }
}

// Main function to run all examples
async function runAuthenticatedChatExamples() {
  console.log("🧪 Testing Authenticated Chat API\n");

  // Test 1: Get auth token
  console.log("1️⃣ Getting authentication token...");
  const token = await getAuthToken();

  if (!token) {
    console.log("❌ Cannot proceed without valid token");
    return;
  }

  console.log("\n2️⃣ Testing authenticated chat...");
  await authenticatedChatExample(token);

  console.log("\n3️⃣ Testing unauthenticated chat (should fail)...");
  await unauthenticatedChatExample();

  console.log("\n4️⃣ Testing with invalid token (should fail)...");
  await invalidTokenChatExample();

  console.log("\n🏁 Authenticated chat examples complete!");
}

// Export functions for use in other modules
export {
  getAuthToken,
  authenticatedChatExample,
  unauthenticatedChatExample,
  invalidTokenChatExample,
  runAuthenticatedChatExamples,
};

// Run examples if this file is executed directly
runAuthenticatedChatExamples().catch(console.error);
