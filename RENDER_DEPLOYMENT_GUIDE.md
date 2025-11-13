# Render Deployment Guide

## ✅ Code Pushed to GitHub

The backend code has been successfully pushed to: **https://github.com/PrudhviTexr/homeandown-backend.git**

## 🚀 Render Deployment Configuration

### 1. Service Configuration

The `render.yaml` file is configured with:
- **Service Type**: Web Service
- **Name**: homeandown-api
- **Root Directory**: `python_api`
- **Build Command**: `pip install -r requirements_render.txt`
- **Start Command**: `python run_render.py`
- **Python Version**: 3.11.0

### 2. Required Environment Variables

Configure these in Render Dashboard → Environment Variables:

#### Database & Supabase
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

#### Authentication
- `JWT_SECRET` - Secret key for JWT token generation (use a strong random string)
- `PYTHON_API_KEY` - API key for admin endpoints

#### Email Configuration (at least one required)
- `GMAIL_USERNAME` - Gmail address for SMTP
- `GMAIL_APP_PASSWORD` - Gmail app password
- `RESEND_API_KEY` - Resend API key (alternative to Gmail)

#### Site Configuration
- `SITE_URL` - Your frontend URL (e.g., `https://homeandown.com`)
- `CORS_ORIGIN` - Allowed CORS origins (e.g., `https://homeandown.com`)

#### Twilio (for OTP/SMS - optional)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

#### System Configuration
- `PORT` - Automatically set by Render (default: 8000)
- `ENVIRONMENT` - Set to `production`
- `DEBUG` - Set to `false`
- `SMTP_ALLOW_SELF_SIGNED` - Set to `false`

### 3. Deployment Steps

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Create New Web Service**:
   - Connect to GitHub repository: `PrudhviTexr/homeandown-backend`
   - Select branch: `main`
   - Render will auto-detect `render.yaml` configuration
3. **Configure Environment Variables**:
   - Add all required environment variables listed above
   - Mark sensitive variables as "Secret"
4. **Deploy**:
   - Render will automatically build and deploy
   - Monitor build logs for any issues

### 4. Post-Deployment Checklist

- [ ] Verify service is running (check health endpoint)
- [ ] Test API endpoints (use `/api/docs` for Swagger UI)
- [ ] Verify database connection
- [ ] Test email sending (forgot password, verification)
- [ ] Verify CORS is working with frontend
- [ ] Check logs for any errors

### 5. Health Check Endpoint

The API includes a root endpoint for health checks:
- `GET /api` - Returns API status

### 6. API Documentation

Once deployed, access API documentation at:
- `https://your-render-url.onrender.com/api/docs` - Swagger UI
- `https://your-render-url.onrender.com/api/redoc` - ReDoc

## 🔧 Recent Fixes Included

1. **Area Unit Display**: Fixed area unit (sqft/sqyd/acres) display across all components
2. **Forgot Password**: Fixed forgot password button and improved error handling
3. **User Endpoints**: Fixed `/api/users/{user_id}` endpoint path issue
4. **Error Handling**: Enhanced error messages for better user experience
5. **Render Configuration**: Updated `render.yaml` with correct paths and environment variables

## 📝 Notes

- The `render.yaml` file uses `rootDir: python_api` to set the working directory
- All dependencies are listed in `python_api/requirements_render.txt`
- The start command uses `run_render.py` which properly handles the PORT environment variable
- Frontend code (`src/`) is excluded from this repository (backend-only repo)

## 🐛 Troubleshooting

If deployment fails:
1. Check build logs in Render dashboard
2. Verify all environment variables are set
3. Ensure `requirements_render.txt` has all dependencies
4. Check that `run_render.py` exists in `python_api/` directory
5. Verify Python version matches (3.11.0)

## 🔗 Repository

**GitHub**: https://github.com/PrudhviTexr/homeandown-backend.git

