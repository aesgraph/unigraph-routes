# Vercel Deployment Checklist

## Required Environment Variables for Production

Before deploying, make sure these environment variables are configured in your Vercel dashboard:

### 🔑 Authentication & Database

```
SUPABASE_URL=your-production-supabase-url
SUPABASE_ANON_KEY=your-production-supabase-anon-key
APPROVED_USERS=comma-separated-list-of-approved-emails
```

### 🤖 OpenAI Integration

```
OPENAI_API_KEY=your-openai-api-key
```

### 🧪 Testing (Optional for production)

```
BASE_URL=https://your-vercel-domain.vercel.app
TEST_EMAIL=your-test-email@example.com
TEST_PASSWORD=your-test-password
```

## Deployment Steps

1. **Set Environment Variables in Vercel**:

   ```bash
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_ANON_KEY
   vercel env add APPROVED_USERS
   vercel env add OPENAI_API_KEY
   ```

2. **Deploy to Vercel**:

   ```bash
   vercel --prod
   ```

3. **Test the Deployed Endpoints**:
   - Auth endpoint: `https://your-domain.vercel.app/api/auth`
   - Chat endpoint: `https://your-domain.vercel.app/api/chat`
   - Hello endpoint: `https://your-domain.vercel.app/api/hello`

## Available API Endpoints

### 📡 `/api/hello` (GET)

- **Purpose**: Health check endpoint
- **Authentication**: None required
- **Usage**: Test if the API is running

### 🔐 `/api/auth` (POST)

- **Purpose**: User authentication (signin/signup)
- **Authentication**: None required for this endpoint
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "action": "signin" // or "signup"
  }
  ```
- **Response**: Returns JWT tokens for authenticated requests

### 💬 `/api/chat` (POST)

- **Purpose**: Chat with OpenAI
- **Authentication**: Bearer token required
- **Headers**:
  ```
  Authorization: Bearer <jwt-token-from-auth>
  Content-Type: application/json
  ```
- **Body**:
  ```json
  {
    "messages": [{ "role": "user", "content": "Hello!" }],
    "max_tokens": 100,
    "temperature": 0.7
  }
  ```

## Testing After Deployment

Use the test scripts with your production URL:

```bash
# Update BASE_URL in your .env or set it temporarily
export BASE_URL=https://your-domain.vercel.app

# Run tests against production
npm test
```

## Security Notes

- ✅ All chat endpoints require authentication
- ✅ Only approved users (APPROVED_USERS) can access chat API
- ✅ JWT tokens are validated with Supabase
- ✅ CORS headers are properly configured
- ✅ Input validation is implemented

## Troubleshooting

If deployment fails:

1. Check Vercel function logs
2. Verify all environment variables are set
3. Ensure your Supabase project is accessible from Vercel
4. Check that your OpenAI API key has sufficient credits
