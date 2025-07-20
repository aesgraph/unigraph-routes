# Environment Variables Configuration

This document describes all the environment variables needed for the Unigraph Routes API project.

## Quick Setup

1. Copy the example below to a new `.env` file in your project root
2. Fill in your actual values
3. Never commit your `.env` file to version control

## Required Environment Variables

### OpenAI Configuration

```bash
# Your OpenAI API key for ChatGPT integration
# Get one at: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here
```

### Supabase Configuration

```bash
# Your Supabase project URL and anonymous key
# Get these from your Supabase project dashboard
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Authentication & User Management

```bash
# Test user credentials for development and testing
TEST_EMAIL=user@email.com
TEST_PASSWORD=password123

# Comma-separated list of approved users (emails)
# Only these users can access the API
APPROVED_USERS=user@email.com
```

### CORS Configuration

```bash
# Comma-separated list of allowed origins for CORS requests
# Include all domains that will make requests to your API
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Set to 'true' to allow all origins (for development only)
# WARNING: This is less secure and should not be used in production
CORS_ALLOW_ALL=false
```

### Development & Testing

```bash
# Base URL for API requests (used by tests and examples)
# Defaults to localhost for development
BASE_URL=http://localhost:3000
```
