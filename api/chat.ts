import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import { authenticateUser } from "./middleware/auth.js";
import { configureCORS } from "./middleware/cors.js";

interface AuthenticatedRequest extends VercelRequest {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

// Type definitions
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
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

export default async function handler(
  req: AuthenticatedRequest,
  res: VercelResponse
) {
  // Configure CORS headers
  const preflightHandled = configureCORS(req, res);
  if (preflightHandled) {
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use POST to send chat messages.",
    });
  }

  // Authenticate user
  const isAuthenticated = await authenticateUser(req, res);
  if (!isAuthenticated) {
    return; // Response already sent by authenticateUser
  }

  try {
    // Check for OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({
        success: false,
        error: "OpenAI API key not configured",
      });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Parse and validate request body
    const {
      messages,
      model = "gpt-3.5-turbo",
      temperature = 0.7,
      max_tokens = 1000,
      stream = false,
    }: ChatRequest = req.body;

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Messages array is required and cannot be empty",
      });
    }

    // Validate message format
    for (const message of messages) {
      if (!message.role || !message.content) {
        return res.status(400).json({
          success: false,
          error: "Each message must have a role and content",
        });
      }
      if (!["system", "user", "assistant"].includes(message.role)) {
        return res.status(400).json({
          success: false,
          error: "Message role must be system, user, or assistant",
        });
      }
    }

    // Handle streaming response
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      try {
        const stream = await openai.chat.completions.create({
          model,
          messages,
          temperature,
          max_tokens,
          stream: true,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }

        res.write("data: [DONE]\n\n");
        res.end();
      } catch (error) {
        console.error("Streaming error:", error);
        res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
        res.end();
      }
    } else {
      // Handle non-streaming response
      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
      });

      const response: ChatResponse = {
        success: true,
        message: completion.choices[0]?.message?.content || "",
        usage: completion.usage
          ? {
              prompt_tokens: completion.usage.prompt_tokens,
              completion_tokens: completion.usage.completion_tokens,
              total_tokens: completion.usage.total_tokens,
            }
          : undefined,
      };

      return res.status(200).json(response);
    }
  } catch (error: any) {
    console.error("Chat API error:", error);

    // Handle OpenAI specific errors
    if (error?.error?.type === "insufficient_quota") {
      return res.status(429).json({
        success: false,
        error: "OpenAI API quota exceeded",
      });
    }

    if (error?.error?.type === "invalid_request_error") {
      return res.status(400).json({
        success: false,
        error: error.error.message || "Invalid request to OpenAI API",
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: "Failed to process chat request",
    });
  }
}
