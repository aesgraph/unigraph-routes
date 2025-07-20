// Test utilities for API testing
// Provides authentication helpers and common test functions

// Load environment variables from .env
import dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

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

// Cache for auth token to avoid repeated auth requests
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get an authentication token for testing
 * Uses environment variables TEST_EMAIL and TEST_PASSWORD
 * Caches the token to avoid repeated auth requests
 */
export async function getAuthToken(): Promise<string | null> {
  // Check if we have a cached token that's still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const testEmail = process.env.TEST_EMAIL;
  const testPassword = process.env.TEST_PASSWORD;

  if (!testEmail || !testPassword) {
    console.warn("⚠️ TEST_EMAIL and TEST_PASSWORD not found in .env");
    console.warn("   Please add these to your .env file:");
    console.warn("   TEST_EMAIL=your-test-email@example.com");
    console.warn("   TEST_PASSWORD=your-test-password");
    console.warn("   APPROVED_USERS=your-test-email@example.com");
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/login`, {
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

    const data: AuthResponse = await response.json();

    if (data.success && data.tokens?.access_token) {
      cachedToken = data.tokens.access_token;
      // Set expiry to 1 hour from now
      tokenExpiry = Date.now() + 60 * 60 * 1000;
      return cachedToken;
    } else {
      console.warn("⚠️ Authentication failed:", data.error);
      return null;
    }
  } catch (error) {
    console.warn("⚠️ Auth request failed:", error);
    return null;
  }
}

/**
 * Make an authenticated request to the chat API
 */
export async function makeAuthenticatedChatRequest(
  messages: any[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  } = {}
): Promise<{ response: Response; data: ChatResponse }> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      messages,
      ...options,
    }),
  });

  const data: ChatResponse = await response.json();
  return { response, data };
}

/**
 * Make an unauthenticated request to the chat API (for testing auth failures)
 */
export async function makeUnauthenticatedChatRequest(
  messages: any[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  } = {}
): Promise<{ response: Response; data: ChatResponse }> {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // No Authorization header
    },
    body: JSON.stringify({
      messages,
      ...options,
    }),
  });

  const data: ChatResponse = await response.json();
  return { response, data };
}

/**
 * Make a request with an invalid token (for testing auth failures)
 */
export async function makeInvalidTokenChatRequest(
  messages: any[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  } = {}
): Promise<{ response: Response; data: ChatResponse }> {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer invalid-token-here",
    },
    body: JSON.stringify({
      messages,
      ...options,
    }),
  });

  const data: ChatResponse = await response.json();
  return { response, data };
}

/**
 * Check if authentication is available for testing
 */
export function isAuthAvailable(): boolean {
  return !!(process.env.TEST_EMAIL && process.env.TEST_PASSWORD);
}

/**
 * Get test messages for common scenarios
 */
export const testMessages = {
  basic: [
    {
      role: "user" as const,
      content: "What is the capital of France?",
    },
  ],
  withSystem: [
    {
      role: "system" as const,
      content: "You are a helpful coding assistant.",
    },
    {
      role: "user" as const,
      content: "How do I create a React component?",
    },
  ],
  conversation: [
    {
      role: "system" as const,
      content: "You are a helpful assistant.",
    },
    {
      role: "user" as const,
      content: "My name is Alice.",
    },
    {
      role: "assistant" as const,
      content: "Hello Alice! How can I help you today?",
    },
    {
      role: "user" as const,
      content: "What programming languages should I learn?",
    },
  ],
};
