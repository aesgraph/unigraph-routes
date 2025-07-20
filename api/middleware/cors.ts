import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Get environment variable from multiple sources in order of preference
 * 1. Vercel runtime environment variables
 * 2. Process.env (fallback)
 */
function getEnvVar(key: string): string | undefined {
  // Try Vercel runtime environment variables first
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

/**
 * Check if we're running on Vercel
 */
function isVercel(): boolean {
  return !!getEnvVar("VERCEL_URL") || !!getEnvVar("VERCEL_ENV");
}

/**
 * Configure CORS headers based on environment variables and Vercel deployment
 * Environment variables:
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins
 * - CORS_ALLOW_ALL: Set to 'true' to allow all origins
 * - VERCEL_URL: Automatically set by Vercel (e.g., 'unigraph-routes-avl8sp19f-aesgraph.vercel.app')
 */
export function configureCORS(req: VercelRequest, res: VercelResponse) {
  // Get allowed origins from environment variable
  const allowedOriginsEnv = getEnvVar("ALLOWED_ORIGINS");
  const corsAllowAll = getEnvVar("CORS_ALLOW_ALL") === "true";
  const vercelUrl = getEnvVar("VERCEL_URL");
  const vercelEnv = getEnvVar("VERCEL_ENV");

  let allowedOrigins: string[] = [];

  if (corsAllowAll) {
    // Allow all origins
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (allowedOriginsEnv) {
    // Use environment variable origins
    allowedOrigins = allowedOriginsEnv
      .split(",")
      .map((origin) => origin.trim());
  } else {
    // Default fallback - start with localhost
    allowedOrigins = ["http://localhost:3000"];
  }

  // Add Vercel deployment URL if available
  if (vercelUrl) {
    const vercelOrigin = `https://${vercelUrl}`;
    if (!allowedOrigins.includes(vercelOrigin)) {
      allowedOrigins.push(vercelOrigin);
    }
  }

  // Add Vercel preview URLs if in preview environment
  if (vercelEnv === "preview" && vercelUrl) {
    const previewOrigin = `https://${vercelUrl}`;
    if (!allowedOrigins.includes(previewOrigin)) {
      allowedOrigins.push(previewOrigin);
    }
  }

  const origin = req.headers.origin;

  // Add support for Vercel preview deployments with unigraph-git-* pattern
  if (origin) {
    // Check for unigraph-git-*.vercel.app pattern (allowing anything after .vercel.app)
    const unigraphGitPattern = /^https:\/\/unigraph-git-[^.]+\.vercel\.app.*$/;
    if (unigraphGitPattern.test(origin)) {
      // Allow any unigraph-git-*.vercel.app URL for preview deployments
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With",
      );

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        res.status(200).end();
        return true; // Indicates preflight handled
      }

      return false; // Indicates normal request processing should continue
    }
  }
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (allowedOrigins.length > 0) {
    // Fallback to first allowed origin
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0]);
  } else {
    // Final fallback - allow all (less secure, but functional)
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true; // Indicates preflight handled
  }

  return false; // Indicates normal request processing should continue
}
