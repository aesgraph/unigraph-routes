// Node.js built-in test runner
// Run with: node --test tests/auth-scenarios.test.ts
// Comprehensive authentication testing for the Chat API

import { test, describe } from "node:test";
import * as assert from "node:assert";
import {
  makeAuthenticatedChatRequest,
  makeUnauthenticatedChatRequest,
  makeInvalidTokenChatRequest,
  isAuthAvailable,
  getAuthToken,
  testMessages,
} from "./test-utils.js";

const CHAT_BASE_URL: string = process.env.BASE_URL || "http://localhost:3000";

describe("Authentication Scenarios Tests", () => {
  test("should successfully authenticate with valid bearer token", async () => {
    if (!isAuthAvailable()) {
      console.log("⚠️ Skipping auth test - credentials not configured");
      return;
    }

    const { response, data } = await makeAuthenticatedChatRequest(
      testMessages.basic,
      { max_tokens: 50 },
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.message);
    assert.ok(data.usage);
  });

  test("should reject requests with no authorization header", async () => {
    const { response, data } = await makeUnauthenticatedChatRequest(
      testMessages.basic,
      { max_tokens: 50 },
    );

    assert.strictEqual(response.status, 401);
    assert.strictEqual(data.success, false);
    assert.ok(data.error);
    assert.ok(data.error.includes("Authorization header required"));
  });

  test("should reject requests with invalid bearer token", async () => {
    const { response, data } = await makeInvalidTokenChatRequest(
      testMessages.basic,
      { max_tokens: 50 },
    );

    assert.strictEqual(response.status, 401);
    assert.strictEqual(data.success, false);
    assert.ok(data.error);
    assert.ok(data.error.includes("Invalid or expired token"));
  });

  test("should reject requests with malformed authorization header", async () => {
    const response = await fetch(`${CHAT_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "InvalidFormat token-here", // Should be "Bearer token"
      },
      body: JSON.stringify({
        messages: testMessages.basic,
        max_tokens: 50,
      }),
    });

    const data = await response.json();
    assert.strictEqual(response.status, 401);
    assert.strictEqual(data.success, false);
    assert.ok(data.error);
    assert.ok(data.error.includes("Authorization header required"));
  });

  test("should reject requests with empty bearer token", async () => {
    const response = await fetch(`${CHAT_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer ", // Empty token
      },
      body: JSON.stringify({
        messages: testMessages.basic,
        max_tokens: 50,
      }),
    });

    const data = await response.json();
    assert.strictEqual(response.status, 401);
    assert.strictEqual(data.success, false);
    assert.ok(data.error);
  });

  test("should handle case-sensitive bearer token validation", async () => {
    const response = await fetch(`${CHAT_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "bearer invalid-token", // lowercase 'bearer'
      },
      body: JSON.stringify({
        messages: testMessages.basic,
        max_tokens: 50,
      }),
    });

    const data = await response.json();
    assert.strictEqual(response.status, 401);
    assert.strictEqual(data.success, false);
    assert.ok(data.error);
    assert.ok(data.error.includes("Authorization header required"));
  });

  test("should handle authentication with different message types", async () => {
    if (!isAuthAvailable()) {
      console.log("⚠️ Skipping auth test - credentials not configured");
      return;
    }

    // Test with system message
    const { response: response1, data: data1 } =
      await makeAuthenticatedChatRequest(testMessages.withSystem, {
        max_tokens: 100,
      });

    assert.strictEqual(response1.status, 200);
    assert.strictEqual(data1.success, true);

    // Test with conversation
    const { response: response2, data: data2 } =
      await makeAuthenticatedChatRequest(testMessages.conversation, {
        max_tokens: 150,
      });

    assert.strictEqual(response2.status, 200);
    assert.strictEqual(data2.success, true);
  });

  test("should maintain authentication across multiple requests", async () => {
    if (!isAuthAvailable()) {
      console.log("⚠️ Skipping auth test - credentials not configured");
      return;
    }

    // Make multiple requests with the same token
    const requests = [
      makeAuthenticatedChatRequest(testMessages.basic, { max_tokens: 30 }),
      makeAuthenticatedChatRequest([{ role: "user", content: "Count to 3" }], {
        max_tokens: 30,
      }),
      makeAuthenticatedChatRequest([{ role: "user", content: "What's 1+1?" }], {
        max_tokens: 30,
      }),
    ];

    const responses = await Promise.all(requests);

    for (const { response, data } of responses) {
      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.success, true);
      assert.ok(data.message);
    }
  });

  test("should provide helpful error messages for auth failures", async () => {
    const testCases = [
      {
        name: "No auth header",
        headers: { "Content-Type": "application/json" } as Record<
          string,
          string
        >,
        expectedError: "Authorization header required",
      },
      {
        name: "Invalid format",
        headers: {
          "Content-Type": "application/json",
          Authorization: "InvalidFormat token",
        } as Record<string, string>,
        expectedError: "Authorization header required",
      },
      {
        name: "Invalid token",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-token-12345",
        } as Record<string, string>,
        expectedError: "Invalid or expired token",
      },
    ];

    for (const testCase of testCases) {
      const response = await fetch(`${CHAT_BASE_URL}/api/chat`, {
        method: "POST",
        headers: testCase.headers,
        body: JSON.stringify({
          messages: testMessages.basic,
          max_tokens: 50,
        }),
      });

      const data = await response.json();
      assert.strictEqual(response.status, 401, `Failed for ${testCase.name}`);
      assert.strictEqual(data.success, false, `Failed for ${testCase.name}`);
      assert.ok(
        data.error && data.error.includes(testCase.expectedError),
        `Expected error "${testCase.expectedError}" for ${testCase.name}, got: ${data.error}`,
      );
    }
  });

  test("should handle token refresh scenarios", async () => {
    if (!isAuthAvailable()) {
      console.log("⚠️ Skipping auth test - credentials not configured");
      return;
    }

    // Get a fresh token
    const token = await getAuthToken();
    assert.ok(token, "Should be able to get a fresh token");

    // Use the token directly
    const response = await fetch(`${CHAT_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: testMessages.basic,
        max_tokens: 50,
      }),
    });

    const data = await response.json();
    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.success, true);
  });
});
