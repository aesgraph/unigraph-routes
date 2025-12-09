// Example usage of the Auth API
// This file demonstrates how to interact with the /api/auth endpoint

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const EXAMPLE_EMAIL = "user@email.com"; //pragma: allowlist secret
const EXAMPLE_PASSWORD = "password123"; //pragma: allowlist secret

interface AuthRequest {
  email: string;
  password: string;
  action?: "signin" | "signup";
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

// Example 1: Sign in with your credentials
async function signInExample() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: EXAMPLE_EMAIL,
        password: EXAMPLE_PASSWORD,
        action: "signin",
      }),
    });

    const data: AuthResponse = await response.json();

    if (data.success) {
      console.log("✅ Sign in successful!");
      console.log("User ID:", data.user?.id);
      console.log("User Email:", data.user?.email);
      console.log("User Role:", data.user?.role);
      console.log(
        "Access Token:",
        data.tokens?.access_token?.substring(0, 20) + "...",
      );
      console.log(
        "Refresh Token:",
        data.tokens?.refresh_token?.substring(0, 20) + "...",
      );
      console.log(
        "Expires At:",
        new Date(data.expires_at! * 1000).toISOString(),
      );
    } else {
      console.log("❌ Sign in failed:", data.error);
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
}

// Example 3: Test with environment variables
async function signInWithEnvVars() {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    console.log(
      "⚠️ Set TEST_EMAIL and TEST_PASSWORD environment variables to test with real credentials",
    );
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        action: "signin",
      }),
    });

    const data: AuthResponse = await response.json();

    if (data.success) {
      console.log("✅ Sign in with env vars successful!");
      console.log("User ID:", data.user?.id);
      console.log("User Email:", data.user?.email);
      console.log("User Role:", data.user?.role);
      console.log(
        "Token expires:",
        new Date(data.expires_at! * 1000).toLocaleString(),
      );
    } else {
      console.log("❌ Sign in with env vars failed:", data.error);
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
}

// Export functions for use in other modules
export { signInExample, signInWithEnvVars };

// Uncomment and modify the function calls below to test with your credentials
// signInExample();
// signUpExample();
signInWithEnvVars();
