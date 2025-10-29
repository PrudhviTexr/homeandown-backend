# GoDaddy Deployment Guide

## 📦 Frontend Build Ready

The frontend has been successfully built and is ready for deployment to GoDaddy.
**Build Location**: `dist/` folder

### Frontend Backend Connection ✅

The frontend is configured to connect to Render backend:
- **Production URL**: `https://homeandown-backend.onrender.com`
- The `src/utils/backend.ts` file ensures that:
  - Development: Uses `localhost:8000` when running locally
  - Production: Always connects to Render backend (`https://homeandown-backend.onrender.com`)
  - Environment variables are ignored if they contain `localhost`

---

## 🚀 Deployment Steps for GoDaddy

### Step 1: Upload Frontend Files

1. **Access GoDaddy cPanel** or File Manager
2. Navigate to `public_html/` directory (or your domain's root directory)
3. **Backup existing files** (if any) before proceeding
4. **Upload all contents** from the `dist/` folder to `public_html/`:
   - `index.html`
   - `assets/` folder (all CSS and JS files)
   - Any other files in `dist/`

### Step 2: Verify File Structure

Your `public_html/` should have:
```
public_html/
├── index.html
├── assets/
│   ├── index-*.css
│   ├── index-*.js
│   ├── vendor-*.js
│   └── ... (other assets)
└── ... (other static files)
```

### Step 3: Configure Environment (if needed)

If you need to override the backend URL, create a `.env` file in `public_html/`:
```env
VITE_PY_API_URL=https://homeandown-backend.onrender.com
VITE_PYTHON_API_KEY=your_api_key_here
```

**Note**: Since we're deploying a built frontend, environment variables should be set at build time. The current build already defaults to Render backend.

### Step 4: Test Deployment

1. Visit your domain in a browser
2. Open browser console (F12)
3. Check for any CORS or connection errors
4. Verify that API calls go to `https://homeandown-backend.onrender.com`

### Step 5: Configure .htaccess (Optional - for React Router)

If you're using React Router and need SPA routing, create/update `.htaccess` in `public_html/`:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QR,L]
```

This ensures that all routes are handled by your React app.

---

## 🔧 Backend Status

### ✅ Backend Code Pushed to Git

All backend changes have been committed and pushed to:
- **Repository**: `https://github.com/PrudhviTexr/homeandown-backend.git`
- **Branch**: `main`
- **Render Auto-Deploy**: Render should automatically detect the push and redeploy

### Backend Changes Included:
- ✅ Push notification routes (`python_api/app/routes/push_notifications.py`)
- ✅ Advanced analytics routes (`python_api/app/routes/advanced_analytics.py`)
- ✅ Agent assignment routes (`python_api/app/routes/agent_assignments.py`)
- ✅ Sequential agent notification service
- ✅ All API integrations updated
- ✅ Updated main.py with new routers

### Verify Render Deployment:
1. Go to Render Dashboard
2. Check if deployment is in progress or completed
3. Verify the service is running
4. Test the API endpoint: `https://homeandown-backend.onrender.com/api`

---

## 🗄️ Database Migration Required

### Push Notifications Table

Run this migration in your Supabase SQL Editor:
**File**: `supabase/migrations/20250131_push_notifications.sql`

This creates the `push_subscriptions` table for storing browser push notification subscriptions.

---

## ✅ Verification Checklist

### Frontend:
- [ ] `dist/` folder contains build files
- [ ] Upload files to `public_html/` on GoDaddy
- [ ] Test website loads correctly
- [ ] Verify API calls go to Render backend
- [ ] Check browser console for errors

### Backend:
- [ ] Git push completed successfully
- [ ] Render deployment triggered/in-progress
- [ ] Render service is running
- [ ] API endpoints accessible
- [ ] Database migration run (push notifications)

### Connection:
- [ ] Frontend connects to `https://homeandown-backend.onrender.com`
- [ ] No CORS errors in browser console
- [ ] API responses successful
- [ ] Authentication working

---

## 📝 Important Notes

1. **Backend Connection**: The frontend is hardcoded to use Render backend URL in production builds. This is intentional and ensures reliable connection.

2. **Service Worker**: The `service-worker.js` file must be in the root of your `public_html/` directory for push notifications to work.

3. **HTTPS Required**: Push notifications require HTTPS. Ensure your GoDaddy domain has SSL certificate enabled.

4. **Environment Variables**: For production, you may want to set:
   - `VITE_VAPID_PUBLIC_KEY` (for push notifications) - Set at build time
   - `VITE_PYTHON_API_KEY` - Set at build time (optional, only for admin features)

5. **Build Optimization**: The current build is optimized but has some large chunks. Consider code splitting for better performance in future builds.

---

## 🔗 Quick Links

- **Backend API**: `https://homeandown-backend.onrender.com/api`
- **API Docs**: `https://homeandown-backend.onrender.com/docs`
- **Git Repository**: `https://github.com/PrudhviTexr/homeandown-backend.git`
- **Render Dashboard**: Check your Render account

---

## 🆘 Troubleshooting

### Frontend not connecting to backend:
- Verify Render backend is running
- Check browser console for CORS errors
- Verify API URL in network tab
- Check `.htaccess` configuration

### Build errors:
- Clear `dist/` folder and rebuild
- Check `node_modules` are up to date
- Verify all environment variables are set

### Backend deployment issues:
- Check Render logs for errors
- Verify environment variables in Render dashboard
- Check database connection
- Verify all dependencies installed

---

**Deployment Date**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Build Status**: ✅ Ready for Deployment
**Backend Status**: ✅ Pushed to Git
