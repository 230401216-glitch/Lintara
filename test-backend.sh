#!/bin/bash
# Test Lintara Backend Connection

echo "🔍 Lintara Backend Connection Test"
echo "=================================="
echo ""

# Test 1: Check if backend is running
echo "✓ Test 1: Checking backend..."
if curl -s http://localhost:5000/ > /dev/null 2>&1; then
  echo "✅ Backend is running on port 5000"
  BACKEND_OK=true
else
  echo "❌ Backend is NOT running on port 5000"
  echo "   Run: cd backend && npm run dev"
  BACKEND_OK=false
fi
echo ""

# Test 2: Check MySQL connection
if [ "$BACKEND_OK" = true ]; then
  echo "✓ Test 2: Checking MySQL connection..."
  
  # Try to connect to MySQL
  if mysql -u root -p"" -e "SELECT 1" > /dev/null 2>&1; then
    echo "✅ MySQL is running"
    
    # Check if lintara database exists
    if mysql -u root -p"" -e "USE lintara; SHOW TABLES;" > /dev/null 2>&1; then
      echo "✅ Database 'lintara' exists and has tables"
    else
      echo "❌ Database 'lintara' not found or no tables"
      echo "   Run: mysql -u root -p lintara < 'lintara (2).sql'"
    fi
  else
    echo "❌ MySQL is NOT running or password is wrong"
    echo "   Check .env DB_PASSWORD setting"
  fi
fi
echo ""

# Test 3: Test API endpoints
if [ "$BACKEND_OK" = true ]; then
  echo "✓ Test 3: Testing API endpoints..."
  
  # Test GET /api/travels
  RESPONSE=$(curl -s http://localhost:5000/api/travels)
  if echo "$RESPONSE" | grep -q "success"; then
    echo "✅ GET /api/travels is working"
  else
    echo "❌ GET /api/travels failed"
    echo "   Response: $RESPONSE"
  fi
fi
echo ""

echo "=================================="
echo "🎉 Test complete!"
echo ""
echo "Next steps:"
echo "1. If all tests pass, run frontend: npx expo start"
echo "2. Update API_BASE_URL in constants/api.ts if needed"
echo "3. Try login/register in the app"
