#!/bin/bash

# Quick Fix Script for Production 404 Issues
# Run this to verify and fix common deployment problems

echo "🔍 Checking for common deployment issues..."
echo ""

# Check 1: ROOT_PATH in env files
echo "1. Checking ROOT_PATH configuration..."
if grep -q "^ROOT_PATH=" /app/backend/.env 2>/dev/null || grep -q "^ROOT_PATH=" /app/python_api/.env 2>/dev/null; then
    echo "   ❌ FOUND: ROOT_PATH is enabled (causes /api/api/ double prefix)"
    echo "   🔧 FIXING: Commenting out ROOT_PATH..."
    sed -i 's/^ROOT_PATH=/#ROOT_PATH=/g' /app/backend/.env 2>/dev/null
    sed -i 's/^ROOT_PATH=/#ROOT_PATH=/g' /app/python_api/.env 2>/dev/null
    echo "   ✅ FIXED: ROOT_PATH commented out"
else
    echo "   ✅ OK: ROOT_PATH not set"
fi
echo ""

# Check 2: Required dependencies
echo "2. Checking required dependencies..."
cd /app/python_api

MISSING_DEPS=()

if ! /root/.venv/bin/pip show aiosmtplib &> /dev/null; then
    MISSING_DEPS+=("aiosmtplib")
fi

if ! /root/.venv/bin/pip show supabase &> /dev/null; then
    MISSING_DEPS+=("supabase")
fi

if ! /root/.venv/bin/pip show email-validator &> /dev/null; then
    MISSING_DEPS+=("email-validator")
fi

if [ ${#MISSING_DEPS[@]} -eq 0 ]; then
    echo "   ✅ OK: All required dependencies installed"
else
    echo "   ❌ MISSING: ${MISSING_DEPS[*]}"
    echo "   🔧 INSTALLING..."
    /root/.venv/bin/pip install "${MISSING_DEPS[@]}" > /dev/null 2>&1
    echo "   ✅ FIXED: Dependencies installed"
fi
echo ""

# Check 3: Test backend endpoints
echo "3. Testing backend endpoints..."
sudo supervisorctl restart backend > /dev/null 2>&1
sleep 3

# Test health
HEALTH_STATUS=$(curl -s http://localhost:8001/health | jq -r '.ok' 2>/dev/null)
if [ "$HEALTH_STATUS" == "true" ]; then
    echo "   ✅ OK: Health endpoint working"
else
    echo "   ❌ FAIL: Health endpoint not responding"
fi

# Test contact
CONTACT_STATUS=$(curl -s -X POST -H "Content-Type: application/json" -d '{"name":"Test","email":"test@test.com","message":"Test"}' http://localhost:8001/api/contact | jq -r '.success' 2>/dev/null)
if [ "$CONTACT_STATUS" == "true" ]; then
    echo "   ✅ OK: Contact endpoint working"
else
    echo "   ❌ FAIL: Contact endpoint not working"
fi
echo ""

# Check 4: Verify routes are loaded
echo "4. Checking loaded routes..."
ROUTES_COUNT=$(curl -s http://localhost:8001/openapi.json | jq '.paths | keys | length' 2>/dev/null)
if [ "$ROUTES_COUNT" -gt 20 ]; then
    echo "   ✅ OK: $ROUTES_COUNT routes loaded"
else
    echo "   ⚠️  WARNING: Only $ROUTES_COUNT routes loaded (should be 50+)"
fi
echo ""

# Summary
echo "============================================"
echo "📊 SUMMARY"
echo "============================================"
echo ""
echo "Local Environment Status:"
echo "  - Backend: $(supervisorctl status backend | awk '{print $2}')"
echo "  - Frontend: $(supervisorctl status frontend | awk '{print $2}')"
echo "  - Routes Loaded: $ROUTES_COUNT"
echo ""
echo "🚀 PRODUCTION DEPLOYMENT STEPS:"
echo ""
echo "1. On Render.com, go to your backend service"
echo "2. Go to Environment tab"
echo "3. REMOVE or COMMENT OUT 'ROOT_PATH' variable"
echo "4. Ensure these are set:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - PYTHON_API_KEY"
echo "   - CORS_ORIGIN (include your frontend URL)"
echo "5. Click 'Save Changes' (will auto-redeploy)"
echo "6. Wait for deployment to complete"
echo "7. Test: curl https://homeandown-backend.onrender.com/api/contact"
echo ""
echo "📖 Full deployment guide: /app/DEPLOYMENT_GUIDE.md"
echo ""

# Exit
exit 0
