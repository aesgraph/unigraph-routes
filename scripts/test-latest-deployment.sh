#!/bin/bash

# Test Latest Vercel Deployment
# Usage: ./test-latest-deployment.sh
# This script automatically finds the most recent deployment and runs the TypeScript tests

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Finding Latest Vercel Deployment...${NC}"

# Check if Vercel CLI is installed and user is logged in
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Please install it first:${NC}"
    echo "npm install -g vercel"
    exit 1
fi

# Get the latest deployment URL
echo -e "${YELLOW}Fetching deployment list...${NC}"

# Get deployments and extract the most recent one that's ready
LATEST_URL=$(vercel ls 2>&1 | \
    tail -n +4 | \
    grep "● Ready" | \
    head -n 1 | \
    awk '{print $2}')

if [ -z "$LATEST_URL" ]; then
    echo -e "${RED}❌ Could not find any deployments.${NC}"
    echo -e "${YELLOW}Please make sure:${NC}"
    echo "1. You're logged in to Vercel (vercel login)"
    echo "2. You have at least one deployment"
    echo "3. You're in the correct project directory"
    exit 1
fi

echo -e "${GREEN}✅ Found latest deployment: ${LATEST_URL}${NC}"

# Check if the TypeScript test script exists
if [ ! -f "scripts/test-live-endpoints.ts" ]; then
    echo -e "${RED}❌ test-live-endpoints.ts not found in scripts directory${NC}"
    exit 1
fi

# Check if tsx is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx not found. Please install Node.js${NC}"
    exit 1
fi

# Run the TypeScript test script with the latest deployment URL
echo -e "${BLUE}🚀 Running tests against latest deployment...${NC}"
echo -e "${YELLOW}URL: ${LATEST_URL}${NC}"
echo "=" | tr '\n' '=' | head -c 50; echo

npx tsx scripts/test-live-endpoints.ts "$LATEST_URL"

# Check the exit code
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}🎉 Tests completed successfully!${NC}"
else
    echo -e "\n${RED}❌ Some tests failed. Check the output above.${NC}"
    exit 1
fi 