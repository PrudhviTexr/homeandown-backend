# Deployment Guide - Home & Own Platform

This guide explains how to deploy the Home & Own platform, including the backend to Render and the frontend to cPanel.

## Table of Contents
1. [Backend Deployment (Render)](#backend-deployment-render)
2. [Frontend Deployment (cPanel)](#frontend-deployment-cpanel)
3. [Environment Configuration](#environment-configuration)
4. [Troubleshooting](#troubleshooting)

---

## Backend Deployment (Render)

### Prerequisites
- GitHub account with access to the repository
- Render account
- Required environment variables

### Step 1: Connect Repository to Render

1. Log in to your [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** and select **"Web Service"**
3. Connect your GitHub repository: `homeandown-backend`
4. Render will automatically detect the `render.yaml` configuration

### Step 2: Configure Service

The service is already configured via `python_api/render.yaml`:

- **Name**: homeandown-api
- **Environment**: Python 3.11
- **Root Directory**: python_api
- **Build Command**: `pip install -r requirements_render.txt`
- **Start Command**: `python run_render.py`

### Step 3: Set Environment Variables

In your Render dashboard, navigate to your service's **Environment** tab and add the following variables:

#### Required Environment Variables

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security
JWT_SECRET=your_jwt_secret
PYTHON_API_KEY=your_python_api_key

# Email Configuration
GMAIL_USERNAME=your_gmail_username
GMAIL_APP_PASSWORD=your_gmail_app_password

# Optional: Twilio (for SMS/OTP)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=your_twilio_from_number

# Optional: Resend (alternative email service)
RESEND_API_KEY=your_resend_api_key

# Application URLs
FRONTEND_URL=https://homeandown.com
CORS_ORIGIN=https://homeandown.com

# Admin Defaults
DEFAULT_ADMIN_EMAIL=admin@homeandown.com
DEFAULT_ADMIN_PASSWORD=Frisco@2025

# Environment Settings
ENVIRONMENT=production
DEBUG=false
SMTP_ALLOW_SELF_SIGNED=false
```

### Step 4: Deploy

1. Click **"Manual Deploy"** or wait for automatic deployment
2. Monitor the build logs in the Render dashboard
3. Wait for the deployment to complete successfully

### Step 5: Get Your Backend URL

Once deployed, Render will provide a URL like:
```
https://homeandown-api.onrender.com
```

**Important**: Update your frontend environment variables to point to this URL.

---

## Frontend Deployment (cPanel)

### Prerequisites
- cPanel hosting account
- FTP/SFTP access or cPanel File Manager access
- Domain configured (e.g., homeandown.com)

### Step 1: Upload Frontend Files

#### Option A: Using cPanel File Manager

1. Log in to your cPanel account
2. Navigate to **File Manager**
3. Go to **public_html** directory (or your domain's root directory)
4. Upload the contents of `homeandown-frontend.zip`
5. Extract the zip file in the `public_html` directory

#### Option B: Using FTP/SFTP

1. Connect to your server using FTP client (FileZilla, WinSCP, etc.)
2. Navigate to `public_html` directory
3. Upload all files from the `dist` folder (after extracting `homeandown-frontend.zip`)
4. Ensure files are uploaded maintaining directory structure

### Step 2: Configure Frontend Environment

1. In cPanel File Manager, locate your uploaded frontend files
2. Create a `.env` file in the root directory with the following content:

```env
# Backend API URL (from Render deployment)
VITE_PY_API_URL=https://homeandown-api.onrender.com

# API Key (optional, for protected endpoints)
VITE_PYTHON_API_KEY=your_python_api_key

# Site Configuration
VITE_SITE_URL=https://homeandown.com
```

3. Save the file

### Step 3: Test the Deployment

1. Visit your domain (e.g., `https://homeandown.com`)
2. Test the following:
   - Homepage loads correctly
   - Login functionality
   - Property search and viewing
   - User registration
   - Admin panel access

---

## Environment Configuration

### Backend Environment Variables (Render)

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase database URL | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ Yes |
| `JWT_SECRET` | Secret for JWT tokens | ✅ Yes |
| `PYTHON_API_KEY` | API key for protected endpoints | ✅ Yes |
| `GMAIL_USERNAME` | Gmail address for email | ✅ Yes |
| `GMAIL_APP_PASSWORD` | Gmail app password | ✅ Yes |
| `FRONTEND_URL` | Frontend URL for CORS | ✅ Yes |
| `CORS_ORIGIN` | Allowed CORS origins | ✅ Yes |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | ❌ Optional |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | ❌ Optional |
| `TWILIO_FROM_NUMBER` | Twilio from number | ❌ Optional |
| `RESEND_API_KEY` | Resend API key | ❌ Optional |

### Frontend Environment Variables (cPanel)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_PY_API_URL` | Backend API URL | ✅ Yes |
| `VITE_PYTHON_API_KEY` | API key for protected endpoints | ❌ Optional |
| `VITE_SITE_URL` | Site URL | ❌ Optional |

---

## Testing the Deployment

### Backend API Tests

Test the deployed backend by visiting:
```
https://homeandown-api.onrender.com/api
```

You should receive a JSON response:
```json
{
  "message": "Welcome to Home & Own API - <timestamp>"
}
```

### Frontend Tests

1. **Homepage**: Visit `https://homeandown.com`
2. **User Registration**: Create a new user account
3. **User Login**: Log in with existing credentials
4. **Property Search**: Search for properties
5. **Admin Panel**: Access admin features
6. **API Connectivity**: Verify frontend connects to backend

---

## Troubleshooting

### Backend Issues (Render)

#### Build Fails
- Check build logs in Render dashboard
- Verify `requirements_render.txt` is correct
- Ensure Python version is compatible

#### Database Connection Errors
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check Supabase project status
- Review Render logs for connection errors

#### Email Not Sending
- Verify Gmail credentials are correct
- Check `GMAIL_USERNAME` and `GMAIL_APP_PASSWORD`
- Review email logs in Render dashboard

### Frontend Issues (cPanel)

#### Files Not Loading
- Check file permissions in cPanel
- Ensure files are in correct directory (`public_html`)
- Verify `.htaccess` file is present (if needed)

#### API Connection Errors
- Verify `VITE_PY_API_URL` in `.env` file
- Check CORS configuration in backend
- Review browser console for errors

#### 404 Errors on Routes
- Configure rewrite rules in `.htaccess`
- Ensure single-page application (SPA) routing is configured
- Add the following to `.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### General Issues

#### CORS Errors
- Add frontend URL to `CORS_ORIGIN` in backend
- Verify protocol matches (http vs https)
- Check domain configuration

#### Authentication Issues
- Verify JWT_SECRET matches between environments
- Check session cookies are enabled
- Review authentication flow in logs

#### Missing Assets/Images
- Verify all files uploaded correctly
- Check file paths are relative in frontend code
- Ensure images are in correct directories

---

## Security Considerations

### Backend (Render)
- ✅ Use strong JWT_SECRET (32+ characters)
- ✅ Use strong PYTHON_API_KEY
- ✅ Keep SUPABASE_SERVICE_ROLE_KEY secure
- ✅ Enable HTTPS only
- ✅ Regular dependency updates

### Frontend (cPanel)
- ✅ Use HTTPS
- ✅ Keep API keys secure
- ✅ Implement rate limiting
- ✅ Regular security updates
- ✅ Use strong password for admin account

---

## Post-Deployment Checklist

- [ ] Backend deployed successfully on Render
- [ ] Backend URL tested and accessible
- [ ] Frontend files uploaded to cPanel
- [ ] Frontend accessible via domain
- [ ] Environment variables configured
- [ ] User registration tested
- [ ] User login tested
- [ ] Property search tested
- [ ] Admin panel accessible
- [ ] Email functionality tested
- [ ] Mobile responsiveness verified
- [ ] SSL certificate installed
- [ ] Backup strategy implemented

---

## Support

For deployment issues:
1. Check logs in Render dashboard
2. Review cPanel error logs
3. Check browser console for frontend errors
4. Verify environment variables are correct
5. Contact support if issues persist

---

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [cPanel Documentation](https://docs.cpanel.net)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)

---

**Last Updated**: January 2025
**Version**: 1.0.0

