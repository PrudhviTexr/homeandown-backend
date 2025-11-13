# GoDaddy Deployment Instructions - Quick Guide

## 📦 Deployment Package

**File**: `homeandown-frontend-production.zip` (1.91 MB)

This zip file contains everything you need to deploy the frontend to GoDaddy.

## 🚀 Quick Deployment Steps

### Step 1: Access GoDaddy File Manager
1. Log in to your GoDaddy account
2. Go to **My Products** → **Web Hosting** → **Manage**
3. Click on **File Manager**

### Step 2: Navigate to public_html
1. Open the `public_html` folder (this is your website root directory)

### Step 3: Backup Existing Files (Optional but Recommended)
1. If you have existing files, create a backup:
   - Create a new folder: `backup_YYYYMMDD` (e.g., `backup_20250112`)
   - Move all existing files to this backup folder

### Step 4: Upload and Extract
1. **Upload the ZIP file**:
   - Click "Upload" in File Manager
   - Select `homeandown-frontend-production.zip`
   - Wait for upload to complete

2. **Extract the ZIP file**:
   - Right-click on `homeandown-frontend-production.zip`
   - Select "Extract"
   - Choose extraction location: `public_html`
   - Click "Extract Files"

3. **Move files to root** (if extracted to a subfolder):
   - If files are in `public_html/homeandown-frontend-production/`
   - Select all files and folders
   - Move them to `public_html/` (root)

4. **Delete the ZIP file**:
   - Delete `homeandown-frontend-production.zip` after extraction

### Step 5: Verify File Structure
Your `public_html` should contain:
```
public_html/
├── index.html
├── .htaccess
├── favicon.png
├── assets/
│   ├── index-*.js
│   ├── index-*.css
│   └── [other asset files]
├── images/
└── [other files]
```

### Step 6: Set Permissions (if needed)
- Folders: **755**
- Files: **644**
- `.htaccess`: **644**

### Step 7: Test Your Website
1. Visit your domain (e.g., `https://homeandown.com`)
2. Check browser console (F12) for any errors
3. Test login/signup functionality
4. Verify API connectivity

## ✅ What's Included in the ZIP

- ✅ All production build files from `dist/`
- ✅ `.htaccess` file for React Router support
- ✅ All assets (JS, CSS, images)
- ✅ Configured to connect to Render API: `https://homeandown-backend.onrender.com`

## 🔧 Important Notes

1. **API Connection**: The frontend is already configured to connect to your Render backend at `https://homeandown-backend.onrender.com`

2. **React Router**: The `.htaccess` file ensures all routes work correctly (prevents 404 errors on direct URL access)

3. **CORS**: Make sure your Render backend has your GoDaddy domain in the `CORS_ORIGIN` environment variable

4. **File Permissions**: GoDaddy usually sets permissions automatically, but if you have issues, set:
   - Folders: 755
   - Files: 644

## 🐛 Troubleshooting

### Issue: Blank page or 404 errors
- **Solution**: Check that `index.html` is in the root of `public_html`
- **Solution**: Verify `.htaccess` file exists and has correct content

### Issue: API calls failing
- **Check**: Browser console for CORS errors
- **Solution**: Ensure Render backend has your domain in `CORS_ORIGIN` environment variable

### Issue: Assets not loading
- **Check**: Verify `assets/` folder exists and contains all files
- **Solution**: Re-upload if files are missing

## 📞 Next Steps

After deployment:
1. ✅ Test the website on your domain
2. ✅ Verify all features work
3. ✅ Check browser console for errors
4. ✅ Test authentication (login/signup)
5. ✅ Test property listings and details

## 🔗 Backend Connection

The frontend automatically connects to:
- **Render API**: `https://homeandown-backend.onrender.com`

No additional configuration needed - it's already built into the production build!

