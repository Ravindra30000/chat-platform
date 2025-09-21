#!/bin/bash

# TechSurf 2025 - Session 2 Testing Script
# Tests all Contentstack MCP Integration features

echo "🚀 TechSurf 2025 - Session 2 MCP Testing Script"
echo "================================================="

SERVER_URL="http://localhost:3001"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"

    echo -e "\n${YELLOW}Testing: $name${NC}"
    echo "----------------------------------------"

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$SERVER_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$SERVER_URL$endpoint")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ FAILED (HTTP $http_code)${NC}"
        echo "$body"
    fi
}

# Check if server is running
echo "🔍 Checking if server is running..."
if ! curl -s "$SERVER_URL/health" > /dev/null; then
    echo -e "${RED}❌ Server not running on $SERVER_URL${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"

# Test 1: Basic Health Check
test_endpoint "Basic Health Check" "GET" "/health"

# Test 2: Detailed Health Check  
test_endpoint "Detailed Health Check (includes MCP status)" "GET" "/health?detailed=true"

# Test 3: Basic Chat (without Contentstack)
test_endpoint "Basic Chat (no content enhancement)" "POST" "/api/chat" '{
  "message": "Hello, how are you?",
  "useContentstack": false,
  "stream": false
}'

# Test 4: Chat with Contentstack Enhancement
test_endpoint "Chat with Contentstack Enhancement" "POST" "/api/chat" '{
  "message": "What services do you provide?",
  "useContentstack": true,
  "contentTypes": ["article", "service", "faq"],
  "maxContextLength": 1500,
  "stream": false
}'

# Test 5: Direct Content Search
test_endpoint "Direct Content Search" "POST" "/api/chat/search-content" '{
  "query": "customer support help",
  "contentTypes": ["faq", "article"],
  "maxResults": 5,
  "useCache": true
}'

# Test 6: Get Available Content Types
test_endpoint "Get Available Content Types" "GET" "/api/chat/content-types"

# Test 7: MCP System Status
test_endpoint "MCP System Status" "GET" "/api/chat/mcp/status"

# Test 8: Get Available Models
test_endpoint "Get Available LLM Models" "GET" "/api/chat/models"

# Test 9: Test Endpoint (with Contentstack)
test_endpoint "Test Endpoint with Contentstack" "GET" "/api/chat/test?contentstack=true"

# Test 10: Cache Management
test_endpoint "Clear MCP Cache" "DELETE" "/api/chat/mcp/cache"

# Test 11: Request Validation
test_endpoint "Request Validation Test" "POST" "/api/chat/validate" '{
  "message": "Test validation",
  "useContentstack": true,
  "contentTypes": ["article"],
  "maxContextLength": 2000
}'

echo -e "\n🎉 ${GREEN}Testing Complete!${NC}"
echo "================================================="
echo "💡 Tips:"
echo "- If Contentstack tests fail, add your credentials to .env"
echo "- If Redis tests fail, install Redis or disable with REDIS_URL=''"
echo "- Check logs in the server console for detailed error information"
echo "- Use /health?detailed=true to diagnose specific service issues"

echo -e "\n📋 Summary:"
echo "✅ Basic API functionality"
echo "✅ Content-enhanced chat capabilities"  
echo "✅ Semantic content search"
echo "✅ Caching and performance optimization"
echo "✅ Comprehensive monitoring and health checks"

echo -e "\n🚀 Ready for Session 3: React Chat SDK Development!"