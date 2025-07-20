import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Type definitions
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: "Missing Supabase configuration",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    let body: AuthRequest;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid JSON in request body",
      });
    }

    const { email, password, action = "signin" } = body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    let authResult;

    if (action === "signup") {
      // Handle user registration
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      authResult = data;
    } else {
      // Handle user sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({
          success: false,
          error: error.message,
        });
      }

      authResult = data;
    }

    // Check if user and session exist
    if (!authResult.user || !authResult.session) {
      return res.status(500).json({
        success: false,
        error: "Authentication failed - no user or session returned",
      });
    }

    // Return success response with tokens and user email
    return res.status(200).json({
      success: true,
      user: {
        id: authResult.user.id,
        email: authResult.user.email || "",
        role: authResult.user.role || "user",
      },
      tokens: {
        access_token: authResult.session.access_token,
        refresh_token: authResult.session.refresh_token,
      },
      expires_at: authResult.session.expires_at,
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
