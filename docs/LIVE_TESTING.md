# Manual Test Commands for Live Endpoints

## Base URL
```bash
export LIVE_URL="https://unigraph-routes-bahfci1ve-aesgraph.vercel.app"
```

## 1. Test Hello Endpoint (Public)
```bash
curl -X GET "$LIVE_URL/api/hello" \
  -H "Content-Type: application/json" \
  -v
```

## 2. Get Authentication Token
```bash
# Replace with your actual credentials
curl -X POST "$LIVE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@gmail.com","password":"YOUR_PASSWORD"}' \
  -v
```

## 3. Test Chat Without Auth (Should Return 401)
```bash
curl -X POST "$LIVE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello without auth","stream":false}' \
  -v
```

## 4. Test Chat With Auth (Should Work)
```bash
# Replace YOUR_TOKEN with the token from step 2
export TOKEN="YOUR_TOKEN_HERE"

curl -X POST "$LIVE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"Hello from live endpoint!","stream":false}' \
  -v
```

## 5. Test Streaming Chat
```bash
curl -X POST "$LIVE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"Tell me a short joke","stream":true}' \
  -v
```

## 6. Test Invalid Token (Should Return 401)
```bash
curl -X POST "$LIVE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token-12345" \
  -d '{"message":"This should fail","stream":false}' \
  -v
```

## 7. Test Missing Authorization Header (Should Return 401)
```bash
curl -X POST "$LIVE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"No auth header","stream":false}' \
  -v
```

## 8. Test Invalid JSON (Should Return 400)
```bash
curl -X POST "$LIVE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"Test","stream":false' \
  -v
```

## 9. Test OPTIONS Request (CORS)
```bash
curl -X OPTIONS "$LIVE_URL/api/chat" \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v
```

## 10. Quick Health Check All Endpoints
```bash
# Hello endpoint
echo "Testing Hello..."
curl -s "$LIVE_URL/api/hello" | head -c 100

# Auth endpoint (with dummy data - will fail but should return proper error)
echo -e "\n\nTesting Auth..."
curl -s -X POST "$LIVE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' | head -c 100

# Chat endpoint (without auth - should return 401)
echo -e "\n\nTesting Chat..."
curl -s -X POST "$LIVE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"test","stream":false}' | head -c 100

echo -e "\n\nDone!"
```

## Expected Responses

### Hello Endpoint
- **Status**: 200 OK
- **Response**: `{"message":"Hello World!"}`

### Auth Endpoint (Valid Credentials)
- **Status**: 200 OK  
- **Response**: `{"token":"eyJ..."}`

### Auth Endpoint (Invalid Credentials)
- **Status**: 401 Unauthorized
- **Response**: Error message about invalid credentials

### Chat Endpoint (Valid Auth)
- **Status**: 200 OK
- **Response**: `{"response":"AI response here"}`

### Chat Endpoint (No Auth)
- **Status**: 401 Unauthorized
- **Response**: `{"error":"Authorization header required"}`

### Chat Endpoint (Invalid Token)
- **Status**: 401 Unauthorized  
- **Response**: `{"error":"Invalid token"}`

## Troubleshooting

### Common Issues:
1. **404 Not Found**: Check if the endpoint URL is correct
2. **500 Internal Server Error**: Check Vercel function logs
3. **401 Unauthorized**: Verify token is valid and not expired
4. **400 Bad Request**: Check JSON formatting and required fields

### Check Vercel Logs:
```bash
vercel logs https://unigraph-routes-bahfci1ve-aesgraph.vercel.app
```
