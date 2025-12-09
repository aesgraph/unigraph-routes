# Chat API Documentation

## Overview

The Chat API provides an interface to interact with OpenAI's ChatGPT models. This API endpoint allows you to send messages and receive AI-generated responses.

## Configuration

### Environment Variables

Make sure to set the following environment variable:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

## API Endpoint

**URL:** `/api/chat`  
**Method:** `POST`  
**Content-Type:** `application/json`

## Request Format

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

### Parameters

- `messages` (required): Array of message objects
  - `role`: "system", "user", or "assistant"
  - `content`: The message content
- `model` (optional): OpenAI model to use (default: "gpt-3.5-turbo")
- `temperature` (optional): Controls randomness (0-2, default: 0.7)
- `max_tokens` (optional): Maximum tokens in response (default: 1000)
- `stream` (optional): Enable streaming response (default: false)

## Response Format

### Non-streaming Response

```json
{
  "success": true,
  "message": "Hello! I'm doing well, thank you for asking. How can I help you today?",
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 20,
    "total_tokens": 35
  }
}
```

### Streaming Response

When `stream: true`, the response is sent as Server-Sent Events:

```
data: {"content": "Hello"}
data: {"content": "! I'm"}
data: {"content": " doing"}
data: {"content": " well"}
...
data: [DONE]
```

### Error Response

```json
{
  "success": false,
  "error": "Error message description"
}
```

## Usage Examples

### Basic Chat

```javascript
const response = await fetch("/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
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
console.log(data.message);
```

### Streaming Chat

```javascript
const response = await fetch("/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: [
      {
        role: "user",
        content: "Tell me a story",
      },
    ],
    stream: true,
  }),
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = new TextDecoder().decode(value);
  const lines = chunk.split("\n");

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6);
      if (data === "[DONE]") break;

      try {
        const parsed = JSON.parse(data);
        if (parsed.content) {
          console.log(parsed.content);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }
}
```

### With System Prompt

```javascript
const response = await fetch("/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
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
    model: "gpt-4",
    temperature: 0.5,
  }),
});
```

## Error Handling

Common error codes and their meanings:

- `400 Bad Request`: Invalid request format or missing required fields
- `405 Method Not Allowed`: Only POST requests are supported
- `429 Too Many Requests`: OpenAI API quota exceeded
- `500 Internal Server Error`: Server error or OpenAI API key not configured

## Rate Limits

Rate limits are determined by your OpenAI API plan. The API will return appropriate error messages when limits are exceeded.

## Models

Supported models include:

- `gpt-3.5-turbo` (default)
- `gpt-4`
- `gpt-4-turbo-preview`
- Other OpenAI chat models

Check the OpenAI documentation for the latest available models and their capabilities.

## Authentication

All requests to the Chat API require authentication. Include a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Get a token by calling the `/api/auth` endpoint with your credentials and `"action": "signin"`.

> **Note:** Signup is **not** available via the API. All user registration must be done through the Unigraph app UI. If you attempt to use `"action": "signup"`, the API will return a 403 error:
>
> ```json
> {
>   "success": false,
>   "error": "Signup is only allowed through the Unigraph app. Programmatic signup is disabled."
> }
> ```
