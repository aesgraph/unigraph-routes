import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Configure CORS headers based on environment variables
 * Environment variables:
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins
 * - CORS_ALLOW_ALL: Set to 'true' to allow all origins
 */
export function configureCORS(req: VercelRequest, res: VercelResponse) {
  // Get allowed origins from environment variable
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  const corsAllowAll = process.env.CORS_ALLOW_ALL === "true";

  let allowedOrigins: string[] = [];

  if (corsAllowAll) {
    // Allow all origins
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (allowedOriginsEnv) {
    // Use environment variable origins
    allowedOrigins = allowedOriginsEnv
      .split(",")
      .map((origin) => origin.trim());

    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      // Fallback to first allowed origin or wildcard
      res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0] || "*");
    }
  } else {
    // Default fallback - allow all (less secure, but functional)
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
