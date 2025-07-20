// Node.js built-in test runner
// Run with: node --test tests/streaming.test.ts

import { test, describe } from "node:test";
import * as assert from "node:assert";
import { 
  getAuthToken,
  isAuthAvailable 
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

describe("Chat API Streaming Tests", () => {
  test("should handle streaming responses with authentication", async () => {
    if (!isAuthAvailable()) {
      console.log("⚠️ Skipping streaming test - auth credentials not configured");
      return;
    }

    const token = await getAuthToken();
    if (!token) {
      console.log("⚠️ Failed to get auth token for streaming test");
      return;
    }

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
            content: "Say hello in a streaming response",
          },
        ],
        stream: true,
        max_tokens: 50,
      }),
    });

    assert.strictEqual(response.status, 200);
    assert.ok(response.body);

    // Note: This test would need a running server to actually test streaming
    // For now, we're just testing that the request can be made with proper auth
  });

  test("should handle non-streaming responses when stream is false with auth", async () => {
    if (!isAuthAvailable()) {
      console.log("⚠️ Skipping streaming test - auth credentials not configured");
      return;
    }

    const token = await getAuthToken();
    if (!token) {
      console.log("⚠️ Failed to get auth token for streaming test");
      return;
    }

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
            content: "Say hello",
          },
        ],
        stream: false,
        max_tokens: 50,
      }),
    });

    assert.strictEqual(response.status, 200);
    // Note: This test would need a running server to actually test the response
  });

  test("should reject streaming requests without authentication", async () => {
    const response = await fetch(`${CHAT_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // No Authorization header
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "Say hello in a streaming response",
          },
        ],
        stream: true,
        max_tokens: 50,
      }),
    });

    const data = await response.json();
    assert.strictEqual(response.status, 401);
    assert.strictEqual(data.success, false);
    assert.ok(data.error);
    assert.ok(data.error.includes("Authorization header required"));
  });
});
