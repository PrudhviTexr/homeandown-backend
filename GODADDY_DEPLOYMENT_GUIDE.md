# GoDaddy Frontend Deployment Guide

## ✅ Frontend Build Complete

The frontend has been successfully built. The production build is located in the `dist/` directory.

## 🔗 API Configuration

The frontend is configured to connect to the Render API:
- **Production API URL**: `https://homeandown-backend.onrender.com`
- The frontend automatically uses this URL in production builds
- No additional configuration needed - the build is ready for deployment

## 📦 Deployment Steps for GoDaddy

### Option 1: Using File Manager (Recommended)

1. **Access GoDaddy File Manager**:
   - Log in to your GoDaddy account
   - Go to "My Products" → "Web Hosting" → "Manage"
   - Click on "File Manager"

2. **Navigate to public_html**:
   - Open the `public_html` folder (this is your website root)

3. **Backup Existing Files** (if any):
   - Create a backup folder: `public_html_backup_YYYYMMDD`
   - Copy all existing files to the backup folder

4. **Upload Frontend Build**:
   - Delete all files in `public_html` (except `.htaccess` if you have custom rules)
   - Upload ALL contents from the `dist/` folder to `public_html`
   - Make sure to upload:
     - `index.html`
     - `assets/` folder (with all JS, CSS, and image files)
     - Any other files/folders in `dist/`

5. **Set Permissions**:
   - Set `index.html` to 644
   - Set folders to 755
   - Set files to 644

6. **Verify Deployment**:
   - Visit your domain (e.g., `https://homeandown.com`)
   - Check browser console for any errors
   - Test API connectivity

### Option 2: Using FTP/SFTP

1. **Get FTP Credentials**:
   - GoDaddy → Web Hosting → Manage → FTP
   - Note your FTP host, username, and password

2. **Connect via FTP Client**:
   - Use FileZilla, WinSCP, or any FTP client
   - Connect to your GoDaddy server

3. **Upload Files**:
   - Navigate to `public_html` directory
   - Upload all contents from `dist/` folder
   - Maintain folder structure

### Option 3: Using cPanel File Manager

1. **Access cPanel**:
   - Log in to cPanel from GoDaddy
   - Navigate to "File Manager"

2. **Upload and Extract**:
   - Go to `public_html`
   - Upload `dist` folder as a ZIP file
   - Extract the ZIP file
   - Move all contents from `dist/` to `public_html/`
   - Delete the empty `dist` folder

## 🔧 Important Configuration Files

### .htaccess File (if needed)

Create or update `.htaccess` in `public_html` for React Router:

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

This ensures React Router works correctly with direct URL access.

## ✅ Post-Deployment Checklist

- [ ] Frontend loads correctly at your domain
- [ ] All pages are accessible
- [ ] API calls are working (check browser console)
- [ ] Images and assets load correctly
- [ ] Authentication (login/signup) works
- [ ] No CORS errors in browser console
- [ ] All routes work (try direct URL access)

## 🔍 Troubleshooting

### Issue: API calls failing
- **Check**: Browser console for CORS errors
- **Solution**: Ensure Render backend has your domain in CORS_ORIGIN

### Issue: 404 errors on direct URL access
- **Check**: `.htaccess` file exists and is configured correctly
- **Solution**: Add the `.htaccess` file mentioned above

### Issue: Assets not loading
- **Check**: File paths in browser console
- **Solution**: Ensure all files from `dist/` are uploaded, including `assets/` folder

### Issue: Blank page
- **Check**: Browser console for JavaScript errors
- **Check**: `index.html` is in the root of `public_html`
- **Solution**: Verify all files uploaded correctly

## 📝 File Structure After Deployment

```
public_html/
├── index.html
├── assets/
│   ├── index-*.js
│   ├── index-*.css
│   ├── vendor-*.js
│   └── [other asset files]
└── .htaccess (optional, for React Router)
```

## 🔗 Backend API Connection

The frontend is configured to connect to:
- **Render API**: `https://homeandown-backend.onrender.com`

This is automatically used in production builds. No additional configuration needed.

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify all files uploaded correctly
3. Check file permissions
4. Ensure `.htaccess` is configured (if using React Router)
5. Verify Render backend is running and accessible

