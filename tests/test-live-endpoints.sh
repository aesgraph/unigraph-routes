#!/bin/bash

# Test Commands for Live Vercel Endpoints
# Usage: ./test-live-endpoints.sh

# Set your live deployment URL
LIVE_URL="https://unigraph-routes-3cstv7irs-aesgraph.vercel.app"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Testing Live Endpoints at: $LIVE_URL"
echo "=================================================="

# Test 1: Hello endpoint (public)
echo -e "\n${YELLOW}1. Testing Hello Endpoint (Public)${NC}"
curl -X GET "$LIVE_URL/api/hello" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s

# Test 2: Auth endpoint - Get bearer token
echo -e "\n${YELLOW}2. Getting Bearer Token${NC}"
echo "Enter your test email (or press enter for dev@gmail.com):"
read -r TEST_EMAIL
TEST_EMAIL=${TEST_EMAIL:-dev@gmail.com}

echo "Enter your test password:"
read -s TEST_PASSWORD

TOKEN_RESPONSE=$(curl -X POST "$LIVE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  -s)

echo "Token Response: $TOKEN_RESPONSE"

# Extract the access_token from the response
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to get token. Please check credentials.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Got token: ${TOKEN:0:20}...${NC}"

# Test 3: Chat endpoint without auth (should fail)
echo -e "\n${YELLOW}3. Testing Chat Without Auth (Should Fail)${NC}"
curl -X POST "$LIVE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello without auth"}]}' \
  -w "\nStatus: %{http_code}\n" \
  -s

# Test 4: Chat endpoint with auth (should work)
echo -e "\n${YELLOW}4. Testing Chat With Auth (Should Work)${NC}"
curl -X POST "$LIVE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"messages":[{"role":"user","content":"Hello from live endpoint test!"}]}' \
  -w "\nStatus: %{http_code}\n" \
  -s

# Test 5: Chat with streaming
echo -e "\n${YELLOW}5. Testing Chat With Streaming${NC}"
curl -X POST "$LIVE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"messages":[{"role":"user","content":"Tell me a short joke"}],"stream":true}' \
  -w "\nStatus: %{http_code}\n" \
  -s

# Test 6: Invalid token
echo -e "\n${YELLOW}6. Testing With Invalid Token (Should Fail)${NC}"
curl -X POST "$LIVE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token-12345" \
  -d '{"messages":[{"role":"user","content":"This should fail"}]}' \
  -w "\nStatus: %{http_code}\n" \
  -s

# Test 7: Missing message field
echo -e "\n${YELLOW}7. Testing With Missing Message (Should Fail)${NC}"
curl -X POST "$LIVE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"stream":false}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo -e "\n${GREEN}🎉 Live endpoint testing complete!${NC}"
