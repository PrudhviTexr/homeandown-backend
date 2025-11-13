# Deployment Checklist

## ✅ Backend Deployment (Render)

- [x] Code pushed to GitHub: `https://github.com/PrudhviTexr/homeandown-backend.git`
- [x] `render.yaml` configured correctly
- [x] `requirements_render.txt` includes all dependencies
- [x] `run_render.py` exists and is configured
- [ ] **Action Required**: Deploy on Render Dashboard
  - Go to https://dashboard.render.com
  - Create new Web Service
  - Connect to GitHub repository
  - Configure environment variables (see RENDER_DEPLOYMENT_GUIDE.md)
  - Deploy and verify service is running

## ✅ Frontend Build

- [x] Frontend build completed successfully
- [x] Build output in `dist/` directory
- [x] API URL configured to Render: `https://homeandown-backend.onrender.com`
- [x] Production build ready for deployment

## 📋 Frontend Deployment (GoDaddy) - Action Required

### Step 1: Prepare Files
- [x] Build completed (`npm run build`)
- [ ] **Action Required**: Review `dist/` folder contents
- [ ] **Action Required**: Create `.htaccess` file (see `public_html_htaccess`)

### Step 2: Upload to GoDaddy
- [ ] Access GoDaddy File Manager or FTP
- [ ] Navigate to `public_html` directory
- [ ] Backup existing files (if any)
- [ ] Upload all contents from `dist/` folder
- [ ] Upload `.htaccess` file to root
- [ ] Set correct file permissions

### Step 3: Verify Deployment
- [ ] Visit your domain (e.g., `https://homeandown.com`)
- [ ] Check browser console for errors
- [ ] Test login/signup functionality
- [ ] Verify API calls are working
- [ ] Test all major features

## 🔧 Configuration Required

### Render Backend Environment Variables
Set these in Render Dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `PYTHON_API_KEY`
- `GMAIL_USERNAME` (or `RESEND_API_KEY`)
- `GMAIL_APP_PASSWORD` (if using Gmail)
- `SITE_URL` = `https://homeandown.com` (your frontend URL)
- `CORS_ORIGIN` = `https://homeandown.com` (your frontend URL)
- `TWILIO_ACCOUNT_SID` (optional, for SMS)
- `TWILIO_AUTH_TOKEN` (optional)
- `TWILIO_FROM_NUMBER` (optional)

### Frontend Configuration
- ✅ Already configured to use Render API
- ✅ No additional environment variables needed
- ✅ Production build uses: `https://homeandown-backend.onrender.com`

## 📝 Important Notes

1. **Backend URL**: The frontend is hardcoded to use `https://homeandown-backend.onrender.com` in production
2. **CORS**: Make sure Render backend has your GoDaddy domain in `CORS_ORIGIN`
3. **React Router**: Add `.htaccess` file for proper routing (see `public_html_htaccess`)
4. **File Permissions**: Set folders to 755, files to 644

## 🚀 Quick Deployment Commands

### Build Frontend (Already Done)
```bash
npm run build
```

### Upload to GoDaddy
1. Use File Manager or FTP
2. Upload `dist/` contents to `public_html/`
3. Upload `.htaccess` file

## 📞 Next Steps

1. **Deploy Backend on Render**:
   - Follow `RENDER_DEPLOYMENT_GUIDE.md`
   - Configure all environment variables
   - Verify backend is running

2. **Deploy Frontend on GoDaddy**:
   - Follow `GODADDY_DEPLOYMENT_GUIDE.md`
   - Upload `dist/` contents
   - Add `.htaccess` file
   - Test the deployment

3. **Verify Everything Works**:
   - Test authentication
   - Test property listings
   - Test all user roles (buyer, seller, agent, admin)
   - Check email notifications

