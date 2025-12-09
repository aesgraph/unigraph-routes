#!/bin/bash

# Test runner script for all API tests
# Usage: ./tests/run-tests.sh [test-type]
# Test types: unit, streaming, performance, integration, auth, env-check, all

set -e

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    set -a; source .env; set +a
elif [ -f ../.env ]; then
    set -a; source ../.env; set +a
fi

BASE_URL=${BASE_URL:-"http://localhost:3000"}
TEST_TYPE=${1:-"all"}

echo "🧪 API Test Suite"
echo "=================="
echo "Base URL: $BASE_URL"
echo "Test Type: $TEST_TYPE"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for required environment variables
echo "🔐 Checking authentication configuration..."
if [[ -z "$TEST_EMAIL" || -z "$TEST_PASSWORD" || -z "$APPROVED_USERS" ]]; then
    echo -e "${YELLOW}⚠️ Authentication environment variables not fully configured${NC}"
    echo -e "${YELLOW}   Required: TEST_EMAIL, TEST_PASSWORD, APPROVED_USERS${NC}"
    echo -e "${YELLOW}   Tests requiring authentication will be skipped${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Authentication credentials configured${NC}"
    echo ""
fi

# Function to run a test and capture output
run_test() {
    local test_name="$1"
    local test_file="$2"
    
    echo -e "${BLUE}Running $test_name...${NC}"
    echo "----------------------------------------"
    
    # Check if file exists
    if [ ! -f "$test_file" ]; then
        echo -e "${RED}Could not find '$test_file'${NC}"
        echo -e "${RED}❌ $test_name FAILED${NC}"
        return 1
    fi
    
    # Check if it's a TypeScript file and use tsx, otherwise use node
    if [[ "$test_file" == *.ts ]]; then
        if npx tsx --test "$test_file"; then
            echo -e "${GREEN}✅ $test_name PASSED${NC}"
        else
            echo -e "${RED}❌ $test_name FAILED${NC}"
            return 1
        fi
    else
        if node --test "$test_file"; then
            echo -e "${GREEN}✅ $test_name PASSED${NC}"
        else
            echo -e "${RED}❌ $test_name FAILED${NC}"
            return 1
        fi
    fi
    
    echo ""
}

# Check if server is running
echo "🔍 Checking if server is running..."
if curl -s "$BASE_URL/api/hello" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running at $BASE_URL${NC}"
else
    echo -e "${YELLOW}⚠️ Server doesn't seem to be running at $BASE_URL${NC}"
    echo -e "${YELLOW}Make sure to start your development server first!${NC}"
    echo -e "${YELLOW}Example: npm run dev or vercel dev${NC}"
    echo ""
fi

# Run tests based on type
case $TEST_TYPE in
    "unit")
        echo "Running Chat API Tests..."
        run_test "Chat API Tests" "tests/chat.test.ts"
        ;;
    "streaming")
        echo "Running Streaming Tests..."
        run_test "Streaming Tests" "tests/streaming.test.ts"
        ;;
    "performance")
        echo "Running Performance Tests..."
        run_test "Performance Tests" "tests/performance.test.ts"
        ;;
    "integration")
        echo "Running Integration Tests..."
        run_test "Integration Tests" "tests/integration.test.ts"
        ;;
    "auth")
        echo "Running Auth Tests..."
        run_test "Auth Tests" "tests/auth.test.ts"
        run_test "Auth Scenarios Tests" "tests/auth-scenarios.test.ts"
        ;;
    "env-check")
        echo "Running Environment Check..."
        node tests/env-check.js
        ;;
    "all")
        echo "Running All Tests..."
        
        # Track failures
        failed_tests=0
        
        run_test "Auth Tests" "tests/auth.test.ts" || ((failed_tests++))
        run_test "Auth Scenarios Tests" "tests/auth-scenarios.test.ts" || ((failed_tests++))
        run_test "Chat API Tests" "tests/chat.test.ts" || ((failed_tests++))
        run_test "Streaming Tests" "tests/streaming.test.ts" || ((failed_tests++))
        run_test "Integration Tests" "tests/integration.test.ts" || ((failed_tests++))
        run_test "Performance Tests" "tests/performance.test.ts" || ((failed_tests++))
        
        echo "========================================="
        if [ $failed_tests -eq 0 ]; then
            echo -e "${GREEN}🎉 All tests passed!${NC}"
        else
            echo -e "${RED}❌ $failed_tests test suite(s) failed${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}❌ Unknown test type: $TEST_TYPE${NC}"
        echo "Available types: unit, streaming, performance, integration, auth, env-check, all"
        exit 1
        ;;
esac

echo -e "${GREEN}🏁 Test run complete!${NC}"
