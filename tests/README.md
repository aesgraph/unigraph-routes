# API Testing Suite

This directory contains comprehensive tests for all API routes includ**Run with:**
```bash
node --test tests/integration.test.ts
```

### 7. `test-utils.ts` - Test Utilities
Helper functions for authentication and common test operations:
- `getAuthToken()` - Get valid authentication token
- `makeAuthenticatedChatRequest()` - Make authenticated API calls
- `makeUnauthenticatedChatRequest()` - Test unauthenticated scenarios
- `makeInvalidTokenChatRequest()` - Test invalid token scenarios
- `isAuthAvailable()` - Check if auth credentials are configured
- `testMessages` - Predefined test message templates

### 8. `performance-clean.test.ts` - Standalone Performance Test
Clean performance testing without test runner dependencies:

**Run with:**
```bash
npx tsx tests/performance-clean.test.ts
```

### 9. `run-tests.sh` - Test Runner Scriptthentication and authorization.

## ⚠️ Authentication Requirements

**All chat API endpoints require authentication.** Before running tests, you must configure environment variables:

```bash
# Required environment variables in .env file
TEST_EMAIL=your-test-email@example.com
TEST_PASSWORD=your-test-password
APPROVED_USERS=your-test-email@example.com
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
BASE_URL=http://localhost:3000
```

Tests will automatically skip authentication-required tests if these credentials are not provided.

## 🔍 Quick Environment Check

Before running tests, you can verify your environment configuration:

```bash
node tests/env-check.js
```

This script will:
- Check all required environment variables
- Test authentication token retrieval
- Verify token works with the API
- Provide helpful error messages if something is misconfigured

## Test Files

### 1. `auth.test.ts` - Authentication Tests
Tests the authentication endpoint:
- User signin/signup
- Token generation
- Credential validation
- Error handling for invalid credentials

**Run with:**
```bash
node --test tests/auth.test.ts
```

### 2. `auth-scenarios.test.ts` - Authentication Scenarios
Comprehensive testing of authentication edge cases:
- Valid bearer token authentication
- Missing authorization headers
- Invalid token formats
- Token refresh scenarios
- Error message validation

**Run with:**
```bash
node --test tests/auth-scenarios.test.ts
```

### 3. `chat.test.ts` - Chat API Tests
Tests chat functionality with proper authentication:
- Authenticated chat requests
- System prompt handling with auth
- Unauthenticated request rejection
- Invalid token handling
- Input validation

**Run with:**
```bash
node --test tests/chat.test.ts
```

### 4. `streaming.test.ts` - Streaming Tests
Tests streaming functionality with authentication:
- Authenticated streaming responses
- Non-streaming responses with auth
- Unauthenticated streaming rejection

**Run with:**
```bash
node --test tests/streaming.test.ts
```

### 5. `performance.test.ts` - Performance Tests
Evaluates API performance with proper authentication:
- Authenticated response time measurement
- Concurrent authenticated request testing
- Large content handling with auth
- Temperature variation performance
- Rate limiting behavior

**Run with:**
```bash
node --test tests/performance.test.ts
```

### 6. `integration.test.ts` - Integration Tests
Tests complete chat flows with authentication:
- Full conversation flows
- Multiple message types
- Cross-route functionality with auth

**Run with:**
```bash
node tests/integration.test.js
```

### 5. `run-tests.sh` - Test Runner Script
Bash script to run all tests with organized output:

**Run with:**
```bash
# Run all tests
./tests/run-tests.sh

# Run specific test type
./tests/run-tests.sh unit
./tests/run-tests.sh streaming
./tests/run-tests.sh performance
./tests/run-tests.sh integration
```

## Environment Setup

### Required Environment Variables
```bash
# For Chat API
OPENAI_API_KEY=your_openai_api_key_here

# For Auth API (optional for testing)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Test configuration
BASE_URL=http://localhost:3000  # Default development server
```

### Starting the Development Server
Before running tests, start your development server:

```bash
# Using Vercel CLI (recommended)
vercel dev

# Or using npm if you have a dev script
npm run dev
```

## Test Coverage

### Chat API Tests
- ✅ Basic message sending
- ✅ System prompt functionality
- ✅ Message validation
- ✅ Error handling
- ✅ Streaming responses
- ✅ CORS headers
- ✅ Performance metrics
- ✅ Concurrent requests
- ✅ Large content handling

### Auth API Tests
- ✅ Error response validation
- ✅ CORS headers
- ✅ Method restrictions

### Hello API Tests
- ✅ Basic functionality
- ✅ Query parameter handling

## Quick Start

1. **Set up environment variables:**
   ```bash
   export OPENAI_API_KEY="your-api-key"
   export BASE_URL="http://localhost:3000"
   ```

2. **Start your development server:**
   ```bash
   vercel dev
   ```

3. **Run all tests:**
   ```bash
   ./tests/run-tests.sh
   ```

## Test Output Examples

### Successful Test Run
```
🧪 API Test Suite
==================
Base URL: http://localhost:3000
Test Type: all

🔍 Checking if server is running...
✅ Server is running at http://localhost:3000

Running All Tests...

Running Unit Tests...
----------------------------------------
✅ Unit Tests PASSED

Running Streaming Tests...
----------------------------------------
🌊 Testing Streaming Chat API...
✅ Streaming response started...
Content: Hello! How can I help you today?
✅ Streaming complete!
✅ Streaming Tests PASSED

🎉 All tests passed!
```

### Performance Test Output
```
⚡ Performance Testing Chat API...

1️⃣ Testing response time...
✅ Response time: 1250ms
📊 Token usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
✅ Response time is acceptable (< 5s)

2️⃣ Testing concurrent requests...
✅ 3 concurrent requests completed in 2100ms
  Request 1: ✅ Success (200)
  Request 2: ✅ Success (200)
  Request 3: ✅ Success (200)
📊 Success rate: 3/3 (100.0%)
```

## Debugging Failed Tests

### Common Issues and Solutions

1. **Server not running:**
   ```
   ⚠️ Server doesn't seem to be running at http://localhost:3000
   ```
   **Solution:** Start your development server with `vercel dev`

2. **Missing OpenAI API key:**
   ```
   ❌ Chat API failed: OpenAI API key not configured
   ```
   **Solution:** Set the `OPENAI_API_KEY` environment variable

3. **Rate limiting:**
   ```
   ❌ OpenAI API quota exceeded
   ```
   **Solution:** Check your OpenAI account quota or wait before retrying

4. **Network issues:**
   ```
   ❌ Request failed: fetch failed
   ```
   **Solution:** Check internet connection and server availability

## Extending the Tests

To add new tests:

1. **Add to existing test files** for related functionality
2. **Create new test files** for new API routes
3. **Update `run-tests.sh`** to include new test files
4. **Follow the existing patterns** for consistency

### Example: Adding a new test
```javascript
test('should handle new feature', async () => {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // your test data
    })
  });

  const data = await response.json();
  assert.strictEqual(data.success, true);
  // your assertions
});
```

This testing suite provides comprehensive coverage without requiring external tools, making it easy to validate your API functionality during development and deployment.
