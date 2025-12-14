#!/bin/bash
# Test script for the reminders endpoint
# Usage: ./test_reminders_endpoint.sh [API_URL] [API_KEY]

set -e

API_URL="${1:-http://localhost:8000}"
API_KEY="${2:-${INTERNAL_API_KEY:-test-key-12345}}"

echo "Testing reminders endpoint at: $API_URL"
echo "Using API key: ${API_KEY:0:10}***"
echo ""

# Test 1: Missing API key
echo "Test 1: Missing API key (should fail)"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/internal/run-reminders" \
  -H "Content-Type: application/json" || true)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "401" ]; then
    echo "✓ Correctly rejected missing API key"
else
    echo "✗ Expected 401, got $http_code"
    echo "Response: $body"
fi
echo ""

# Test 2: Invalid API key
echo "Test 2: Invalid API key (should fail)"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/internal/run-reminders" \
  -H "X-Internal-API-Key: wrong-key" \
  -H "Content-Type: application/json" || true)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "401" ]; then
    echo "✓ Correctly rejected invalid API key"
else
    echo "✗ Expected 401, got $http_code"
    echo "Response: $body"
fi
echo ""

# Test 3: Valid API key
echo "Test 3: Valid API key (should succeed)"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/internal/run-reminders" \
  -H "X-Internal-API-Key: $API_KEY" \
  -H "Content-Type: application/json" || true)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo "✓ Successfully processed reminders"
    echo "Response:"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo "✗ Expected 200, got $http_code"
    echo "Response: $body"
fi
echo ""

# Test 4: With within_days parameter
echo "Test 4: With within_days parameter"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/internal/run-reminders?within_days=14" \
  -H "X-Internal-API-Key: $API_KEY" \
  -H "Content-Type: application/json" || true)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo "✓ Successfully processed with within_days=14"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo "✗ Expected 200, got $http_code"
    echo "Response: $body"
fi

echo ""
echo "Tests complete!"

