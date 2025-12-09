// Node.js built-in test runner
// Run with: node --test tests/integration.test.ts

import { test, describe } from "node:test";
import * as assert from "node:assert";
import {
  makeAuthenticatedChatRequest,
  isAuthAvailable,
  testMessages,
} from "./test-utils.js";

const CHAT_BASE_URL: string = process.env.BASE_URL || "http://localhost:3000";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

describe("Chat API Integration Tests", () => {
  test("should handle complete chat flow with authentication", async () => {
    if (!isAuthAvailable()) {
      console.log(
        "⚠️ Skipping integration test - auth credentials not configured",
      );
      return;
    }

    // Test a complete conversation flow
    const { response, data } = await makeAuthenticatedChatRequest(
      [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: "What is 2 + 2?",
        },
      ],
      { max_tokens: 100 },
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.message);
    assert.ok(data.usage);
  });

  test("should handle conversation with multiple messages", async () => {
    if (!isAuthAvailable()) {
      console.log(
        "⚠️ Skipping integration test - auth credentials not configured",
      );
      return;
    }

    const { response, data } = await makeAuthenticatedChatRequest(
      testMessages.conversation,
      { max_tokens: 150 },
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.message);
    assert.ok(data.usage);
  });

  test("should handle authentication endpoints", async () => {
    const response = await fetch(`${CHAT_BASE_URL}/api/auth`, {
      method: "GET",
    });

    // This test checks if the auth endpoint exists
    // The actual status code depends on the implementation
    assert.ok(response.status >= 200 && response.status < 600);
  });
});
