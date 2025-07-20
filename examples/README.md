# API Examples

This directory contains example code demonstrating how to use the API endpoints.

## Files

### `chat-examples.ts`

Contains TypeScript examples for using the Chat API (`/api/chat`):

- **Basic chat request** - Simple message sending
- **Chat with system prompt** - Using system messages to set AI behavior
- **Streaming chat** - Real-time streaming responses
- **Multi-turn conversation** - Maintaining conversation context

## Usage

To run the examples:

1. Make sure your development server is running:

   ```bash
   vercel dev
   ```

2. Import and run the examples in your code:

   ```typescript
   import {
     basicChatExample,
     streamingChatExample,
   } from "./examples/chat-examples";

   // Run basic example
   await basicChatExample();

   // Run streaming example
   await streamingChatExample();
   ```

3. Or uncomment the function calls at the bottom of `chat-examples.ts` and run:
   ```bash
   npx tsx examples/chat-examples.ts
   ```

## Environment Setup

Make sure you have the required environment variables set:

- `OPENAI_API_KEY` - Your OpenAI API key
- `BASE_URL` - Your API base URL (defaults to `http://localhost:3000`)

## Notes

- These examples are for demonstration purposes
- They assume the API server is running on `http://localhost:3000`
- Error handling is included for robustness
- The examples show both synchronous and streaming API usage patterns
