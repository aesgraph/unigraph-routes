// Example usage of the Chat API
// This file demonstrates how to interact with the /api/chat endpoint

// Load environment variables from .env
import dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Helper function to get authentication token
async function getAuthToken(): Promise<string | null> {
  const testEmail = process.env.TEST_EMAIL;
  const testPassword = process.env.TEST_PASSWORD;

  if (!testEmail || !testPassword) {
    console.error("❌ TEST_EMAIL and TEST_PASSWORD not set in .env");
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/auth`, {
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

    const data = await response.json();

    if (data.success && data.tokens?.access_token) {
      console.log("✅ Authentication successful");
      return data.tokens.access_token;
    } else {
      console.error("❌ Authentication failed:", data.error);
      return null;
    }
  } catch (error) {
    console.error("❌ Auth request failed:", error);
    return null;
  }
}

// Example 1: Basic chat request
async function basicChatExample() {
  try {
    // Get authentication token
    const token = await getAuthToken();
    if (!token) {
      console.error("❌ Cannot proceed without authentication token");
      return;
    }

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "What is the capital of France?",
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("AI Response:", data.message);
      console.log("Token Usage:", data.usage);
    } else {
      console.error("Error:", data.error);
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
}

// Example 2: Chat with system prompt
async function chatWithSystemPrompt() {
  try {
    // Get authentication token
    const token = await getAuthToken();
    if (!token) {
      console.error("❌ Cannot proceed without authentication token");
      return;
    }

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are a helpful coding assistant. Provide clear, concise answers about programming.",
          },
          {
            role: "user",
            content: "How do I create a React component?",
          },
        ],
        model: "gpt-3.5-turbo",
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("AI Response:", data.message);
    } else {
      console.error("Error:", data.error);
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
}

// Example 3: Streaming chat
async function streamingChatExample() {
  try {
    // Get authentication token
    const token = await getAuthToken();
    if (!token) {
      console.error("❌ Cannot proceed without authentication token");
      return;
    }

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "Tell me a short story about space exploration",
          },
        ],
        stream: true,
      }),
    });

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    console.log("Streaming response:");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // Keep the last line in the buffer (might be incomplete)
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            console.log("\nStreaming complete");
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              process.stdout.write(parsed.content);
            }
            if (parsed.error) {
              console.error("\nStreaming error:", parsed.error);
              return;
            }
          } catch (e) {
            // Ignore JSON parsing errors for incomplete chunks
          }
        }
      }
    }
  } catch (error) {
    console.error("Streaming request failed:", error);
  }
}

// Example 4: Multi-turn conversation
async function multiTurnConversation() {
  const conversation = [
    {
      role: "system",
      content:
        "You are a helpful assistant that remembers the conversation context.",
    },
    {
      role: "user",
      content: "My name is Alice and I like programming.",
    },
  ];

  try {
    // Get authentication token
    const token = await getAuthToken();
    if (!token) {
      console.error("❌ Cannot proceed without authentication token");
      return;
    }

    // First message
    let response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: conversation,
      }),
    });

    let data = await response.json();
    console.log("AI:", data.message);

    // Add AI response to conversation
    conversation.push({
      role: "assistant",
      content: data.message,
    });

    // Continue conversation
    conversation.push({
      role: "user",
      content: "What programming languages should I learn?",
    });

    response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: conversation,
      }),
    });

    data = await response.json();
    console.log("AI:", data.message);
  } catch (error) {
    console.error("Conversation failed:", error);
  }
}

// Export functions for use in other modules
export {
  basicChatExample,
  chatWithSystemPrompt,
  streamingChatExample,
  multiTurnConversation,
};

// Uncomment to run examples
basicChatExample();
// chatWithSystemPrompt();
// streamingChatExample();
// multiTurnConversation();
