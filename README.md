# Unigraph API Routes

Node.js + Vercel API routes for the Unigraph project, including authentication and AI chat capabilities.

## Available APIs

### `/api/hello` - Hello World

Simple example endpoint that returns a greeting message.

### `/api/login` - Authentication

Handles user authentication using Supabase, supporting both sign-in and sign-up operations.

### `/api/chat` - ChatGPT Integration

Interface to interact with OpenAI's ChatGPT models. Supports both streaming and non-streaming responses.

## Setup

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

### Installation

```bash
npm install
```

## Documentation

- [Chat API Documentation](./api/CHAT_API.md) - Detailed guide for using the ChatGPT integration

## How to Use

You can choose from one of the following two methods to use this repository:

### One-Click Deploy

Deploy the example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=vercel-examples):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/vercel/examples/tree/main/solutions/node-hello-world&project-name=node-hello-world&repository-name=node-hello-world)

### Clone and Deploy

```bash
git clone https://github.com/vercel/examples/tree/main/solutions/node-hello-world
```

Install the Vercel CLI:

```bash
npm i -g vercel
```

Then run the app at the root of the repository:

```bash
vercel dev
```
