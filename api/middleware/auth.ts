import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

interface AuthenticatedRequest extends VercelRequest {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

// Whitelist of approved user emails from environment variable
const APPROVED_USERS = (process.env.APPROVED_USERS || "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

export async function authenticateUser(
  req: AuthenticatedRequest,
  res: VercelResponse,
): Promise<boolean> {
  // If the whitelist is not set, handle based on environment
  if (!process.env.APPROVED_USERS || APPROVED_USERS.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Warning: APPROVED_USERS is not set. Bypassing user approval check in development mode.",
      );
      // In development mode, we still require authentication but skip whitelist
      const bypassWhitelist = true;
    } else {
      res.status(500).json({
        success: false,
        error: "APPROVED_USERS environment variable is not set. Access denied.",
      });
      return false;
    }
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
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      res.status(500).json({
        success: false,
        error: "Missing Supabase configuration",
      });
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
      return false;
    }

    // Whitelist check (skip in development if APPROVED_USERS not set)
    const bypassWhitelist =
      process.env.NODE_ENV === "development" &&
      (!process.env.APPROVED_USERS || APPROVED_USERS.length === 0);

    if (
      !bypassWhitelist &&
      (!user.email || !APPROVED_USERS.includes(user.email))
    ) {
      // Return a custom response that mimics the chat API format
      res.status(200).json({
        choices: [
          {
            message: {
              role: "assistant",
              content:
                "I'm sorry, but you don't have access to this chat feature yet. Please email aesgraph@gmail.com to request access. I'll be happy to help you once you're approved!",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
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
