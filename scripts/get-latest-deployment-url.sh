#!/bin/bash

# Get the most recent "Ready" Vercel deployment URL for this project

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check for Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo -e "${RED}❌ Vercel CLI not found. Please install it with: npm install -g vercel${NC}"
  exit 1
fi

# Get the latest deployment URL (ignoring headers and errors)
LATEST_URL=$(vercel ls 2>&1 | tail -n +4 | grep "● Ready" | head -n 1 | awk '{print $2}')

if [ -z "$LATEST_URL" ]; then
  echo -e "${RED}❌ No ready deployments found.${NC}"
  exit 1
fi

echo -e "${GREEN}Latest deployment URL:${NC} $LATEST_URL"
echo "$LATEST_URL"