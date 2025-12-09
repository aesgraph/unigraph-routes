import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { getEnvVar } from "../utils/envUtils.js";

interface AuthenticatedRequest extends VercelRequest {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

// Helper function to get environment variable value
// In serverless functions, process.env is the most reliable source
function getEnvValue(key: string): string | undefined {
  // In Vercel serverless functions, process.env is the most reliable source
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key];
  }
  // Fallback to getEnvVar for other environments
  return getEnvVar(key);
}

// Helper function to get approved users from environment variable
// Reads at runtime to ensure it works in Vercel serverless functions
function getApprovedUsers(): string[] {
  const approvedUsersEnv = getEnvValue("APPROVED_USERS") || "";

  return approvedUsersEnv
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

export async function authenticateUser(
  req: AuthenticatedRequest,
  res: VercelResponse,
): Promise<boolean> {
  const isDevelopment = getEnvValue("NODE_ENV") === "development";

  // In development mode, bypass all authentication
  if (isDevelopment) {
    console.warn(
      "⚠️  Development mode: Bypassing all authentication (Supabase and whitelist checks)",
    );

    // Set a mock development user
    req.user = {
      id: "dev-user-id",
      email: "dev@localhost",
      role: "admin",
    };

    return true;
  }

  // Production mode: Full authentication required
  // Get approved users at runtime
  const APPROVED_USERS = getApprovedUsers();
  const approvedUsersEnv = getEnvValue("APPROVED_USERS");

  // Check if whitelist is effectively empty (not set, empty string, or only whitespace)
  const isWhitelistEmpty =
    !approvedUsersEnv ||
    approvedUsersEnv.trim() === "" ||
    APPROVED_USERS.length === 0;

  // If the whitelist is not set in production, deny access immediately
  if (isWhitelistEmpty) {
    res.status(500).json({
      success: false,
      error:
        "APPROVED_USERS environment variable is not set or is empty. Access denied.",
    });
    return false;
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Authorization header required. Format: Bearer <token>",
      });
      return false;
    }

    // Extract the token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Initialize Supabase client
    const supabaseUrl = getEnvValue("SUPABASE_URL");
    const supabaseKey = getEnvValue("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      res.status(500).json({
        success: false,
        error: "Missing Supabase configuration",
      });
      return false;
    }

    // Create Supabase client with the access token in the auth header
    // This is the recommended way to verify a JWT token
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verify the token by getting the user
    // When the client is created with the token in headers, getUser() will verify it
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("Token verification failed:", {
        error: error?.message,
        errorCode: error?.status,
        hasUser: !!user,
        tokenPrefix: token.substring(0, 20) + "...",
      });
      res.status(401).json({
        success: false,
        error: `Invalid or expired token: ${error?.message || "Unknown error"}`,
      });
      return false;
    }

    // Whitelist check - verify user email is in approved list
    if (!user.email || !APPROVED_USERS.includes(user.email)) {
      res.status(401).json({
        success: false,
        error: "User is not authorized",
      });
      return false;
    }

    // Add user info to the request object
    req.user = {
      id: user.id,
      email: user.email || "",
      role: user.role || "user",
    };

    return true;
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication failed",
    });
    return false;
  }
}

// Optional: Role-based access control
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: VercelResponse): boolean => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return false;
    }

    if (!allowedRoles.includes(req.user.role || "user")) {
      res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
      return false;
    }

    return true;
  };
}
