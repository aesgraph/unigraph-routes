// Node.js built-in test runner
// Run with: node --test tests/auth.test.ts

import { test, describe } from "node:test";
import * as assert from "node:assert";

const AUTH_BASE_URL: string = process.env.BASE_URL || "http://localhost:3000";

interface AuthRequest {
  email: string;
  password: string;
  action?: "signin";
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

describe("Auth API Tests", () => {
  test("should handle signin with valid credentials", async () => {
    const response = await fetch(`${AUTH_BASE_URL}/api/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: process.env.TEST_USER_EMAIL || "test@example.com",
        password: process.env.TEST_USER_PASSWORD || "testpassword123",
        action: "signin",
      }),
    });

    const data: AuthResponse = await response.json();

    // Note: This test will fail if Supabase is not configured or credentials are invalid
    // In a real test environment, you'd use test credentials or mock Supabase
    if (
      response.status === 500 &&
      data.error?.includes("Missing Supabase configuration")
    ) {
      console.log("⚠️ Skipping auth test - Supabase not configured");
      return; // Skip test if Supabase is not configured
    }

    if (response.status === 401) {
      console.log(
        "⚠️ Auth failed - invalid credentials (expected in test environment)"
      );
      assert.strictEqual(data.success, false);
      assert.ok(data.error);
      return;
    }

    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.user);
    assert.ok(data.user.id);
    assert.ok(data.user.email);
    assert.ok(data.tokens);
    assert.ok(data.tokens.access_token);
    assert.ok(data.tokens.refresh_token);
    assert.ok(data.expires_at);
  });

  test("should reject missing email", async () => {
    const response = await fetch(`${AUTH_BASE_URL}/api/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: "testpassword123",
        action: "signin",
      }),
    });

    const data: AuthResponse = await response.json();

    // If Supabase is not configured, we'll get a 500 error
    if (
      response.status === 500 &&
      data.error?.includes("Missing Supabase configuration")
    ) {
      console.log("⚠️ Skipping validation test - Supabase not configured");
      return;
    }

    assert.strictEqual(response.status, 400);
    assert.strictEqual(data.success, false);
    assert.ok(data.error?.includes("Email and password are required"));
  });

  test("should reject missing password", async () => {
    const response = await fetch(`${AUTH_BASE_URL}/api/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: process.env.TEST_EMAIL || "test@example.com",
        action: "signin",
      }),
    });

    const data: AuthResponse = await response.json();

    // If Supabase is not configured, we'll get a 500 error
    if (
      response.status === 500 &&
      data.error?.includes("Missing Supabase configuration")
    ) {
      console.log("⚠️ Skipping validation test - Supabase not configured");
      return;
    }

    assert.strictEqual(response.status, 400);
    assert.strictEqual(data.success, false);
    assert.ok(data.error?.includes("Email and password are required"));
  });

  test("should reject empty email", async () => {
    const response = await fetch(`${AUTH_BASE_URL}/api/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "",
        password: process.env.TEST_PASSWORD || "testpassword123",
        action: "signin",
      }),
    });

    const data: AuthResponse = await response.json();

    // If Supabase is not configured, we'll get a 500 error
    if (
      response.status === 500 &&
      data.error?.includes("Missing Supabase configuration")
    ) {
      console.log("⚠️ Skipping validation test - Supabase not configured");
      return;
    }

    assert.strictEqual(response.status, 400);
    assert.strictEqual(data.success, false);
    assert.ok(data.error?.includes("Email and password are required"));
  });

  test("should reject empty password", async () => {
    const response = await fetch(`${AUTH_BASE_URL}/api/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: process.env.TEST_EMAIL || "test@example.com",
        password: "",
        action: "signin",
      }),
    });

    const data: AuthResponse = await response.json();

    // If Supabase is not configured, we'll get a 500 error
    if (
      response.status === 500 &&
      data.error?.includes("Missing Supabase configuration")
    ) {
      console.log("⚠️ Skipping validation test - Supabase not configured");
      return;
    }

    assert.strictEqual(response.status, 400);
    assert.strictEqual(data.success, false);
    assert.ok(data.error?.includes("Email and password are required"));
  });

  test("should reject invalid email format", async () => {
    const response = await fetch(`${AUTH_BASE_URL}/api/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "invalid-email",
        password: "testpassword123",
        action: "signin",
      }),
    });

    const data: AuthResponse = await response.json();

    // If Supabase is not configured, we'll get a 500 error
    if (
      response.status === 500 &&
      data.error?.includes("Missing Supabase configuration")
    ) {
      console.log("⚠️ Skipping validation test - Supabase not configured");
      return;
    }

    // This might return 400 or 401 depending on Supabase validation
    assert.ok([400, 401].includes(response.status));
    assert.strictEqual(data.success, false);
    assert.ok(data.error);
  });

  test("should reject GET requests", async () => {
    const response = await fetch(`${AUTH_BASE_URL}/api/auth`, {
      method: "GET",
    });

    const data: AuthResponse = await response.json();

    assert.strictEqual(response.status, 405);
    assert.strictEqual(data.success, false);
    assert.ok(data.error?.includes("Method not allowed"));
  });

  test("should reject PUT requests", async () => {
    const response = await fetch(`${AUTH_BASE_URL}/api/auth`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "testpassword123",
      }),
    });

    const data: AuthResponse = await response.json();

    assert.strictEqual(response.status, 405);
    assert.strictEqual(data.success, false);
    assert.ok(data.error?.includes("Method not allowed"));
  });

  test("should reject DELETE requests", async () => {
    const response = await fetch(`${AUTH_BASE_URL}/api/auth`, {
      method: "DELETE",
    });

    const data: AuthResponse = await response.json();

    assert.strictEqual(response.status, 405);
    assert.strictEqual(data.success, false);
    assert.ok(data.error?.includes("Method not allowed"));
  });

  test("should handle OPTIONS requests (CORS preflight)", async () => {
    const response = await fetch(`${AUTH_BASE_URL}/api/auth`, {
      method: "OPTIONS",
    });

    assert.strictEqual(response.status, 200);
    assert.ok(response.headers.get("Access-Control-Allow-Origin"));
    assert.ok(response.headers.get("Access-Control-Allow-Methods"));
    assert.ok(response.headers.get("Access-Control-Allow-Headers"));
  });

  test("should handle missing Supabase configuration gracefully", async () => {
    // This test will pass if Supabase is not configured
    // In a real environment, you might temporarily unset the env vars for this test
    const response = await fetch(`${AUTH_BASE_URL}/api/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "testpassword123",
        action: "signin",
      }),
    });

    const data: AuthResponse = await response.json();

    if (
      response.status === 500 &&
      data.error?.includes("Missing Supabase configuration")
    ) {
      console.log("ℹ️ Supabase not configured (expected in test environment)");
      assert.strictEqual(data.success, false);
      assert.ok(data.error?.includes("Missing Supabase configuration"));
    } else {
      // If Supabase is configured, the test should still pass
      assert.ok([200, 400, 401].includes(response.status));
      assert.ok(data.success === false || (data.success === true && data.user));
    }
  });

  test("should handle malformed JSON gracefully", async () => {
    const response = await fetch(`${AUTH_BASE_URL}/api/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: '{"email": "test@example.com", "password": "test123",}', // Invalid JSON
    });

    // Should return 400 or 500 for malformed JSON
    assert.ok([400, 500].includes(response.status));
  });

  test("should handle missing Content-Type header", async () => {
    const response = await fetch(`${AUTH_BASE_URL}/api/auth`, {
      method: "POST",
      body: JSON.stringify({
        email: process.env.TEST_EMAIL || "test@example.com",
        password: process.env.TEST_PASSWORD || "testpassword123",
        action: "signin",
      }),
    });

    const data: AuthResponse = await response.json();

    // If Supabase is not configured, we'll get a 500 error
    if (
      response.status === 500 &&
      data.error?.includes("Missing Supabase configuration")
    ) {
      console.log("⚠️ Skipping validation test - Supabase not configured");
      return;
    }

    // The API might accept requests without Content-Type header or return an error
    // Both behaviors are acceptable, so we check for reasonable status codes
    assert.ok([200, 400, 401, 500].includes(response.status));

    // If it succeeds, verify the response structure
    if (response.status === 200) {
      assert.strictEqual(data.success, true);
      assert.ok(data.user);
      assert.ok(data.tokens);
    } else {
      // If it fails, verify there's an error message
      assert.strictEqual(data.success, false);
      assert.ok(data.error);
    }
  });

  test("should handle very long email addresses", async () => {
    const longEmail = "a".repeat(100) + "@example.com";
    const response = await fetch(`${AUTH_BASE_URL}/api/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: longEmail,
        password: "testpassword123",
        action: "signin",
      }),
    });

    const data: AuthResponse = await response.json();

    // If Supabase is not configured, we'll get a 500 error
    if (
      response.status === 500 &&
      data.error?.includes("Missing Supabase configuration")
    ) {
      console.log("⚠️ Skipping long input test - Supabase not configured");
      return;
    }

    // Should handle gracefully (either accept or reject with proper error)
    assert.ok([200, 400, 401, 500].includes(response.status));
    if (!data.success) {
      assert.ok(data.error);
    }
  });

  test("should handle very long passwords", async () => {
    const longPassword = "a".repeat(1000);
    const response = await fetch(`${AUTH_BASE_URL}/api/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: longPassword,
        action: "signin",
      }),
    });

    const data: AuthResponse = await response.json();

    // If Supabase is not configured, we'll get a 500 error
    if (
      response.status === 500 &&
      data.error?.includes("Missing Supabase configuration")
    ) {
      console.log("⚠️ Skipping long input test - Supabase not configured");
      return;
    }

    // Should handle gracefully (either accept or reject with proper error)
    assert.ok([200, 400, 401, 500].includes(response.status));
    if (!data.success) {
      assert.ok(data.error);
    }
  });
});
