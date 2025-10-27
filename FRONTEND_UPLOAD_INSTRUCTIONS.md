# Frontend Upload Instructions - Fix Booking Update Error

## The Problem
Your booking update is failing with a 404 error because the frontend is still using the old code path. The server has the old build (`index-CxZoXN0P.js`) but you need the new build (`index-DskOrxFa.js`).

## The Solution
Upload the updated `homeandown-frontend.zip` file to cPanel.

---

## Step-by-Step Upload Instructions

### 1. Get the Updated File
- **Location**: `homeandown-frontend.zip` (in your project root)
- **Size**: 1.87 MB
- **Created**: Just now (with the booking fix)
- **Contains**: Fixed API URL (`/api/records/bookings` instead of `/api/bookings`)

### 2. Upload to cPanel

#### Option A: Using cPanel File Manager (Recommended)

1. Log in to your cPanel account
2. Navigate to **File Manager**
3. Go to the `public_html` directory
4. **IMPORTANT**: Before uploading, back up your current files:
   - Select all files/folders in `public_html`
   - Click "Compress" to create a backup
5. **Delete the OLD files** (or move them to a backup folder):
   - Select all files in `public_html`
   - Delete or move to `public_html_backup` folder
6. Upload `homeandown-frontend.zip`
7. **Right-click** the ZIP file → **Extract**
8. Verify the extracted files include:
   - `index.html`
   - `assets/` folder with new files
   - `.htaccess` file
9. **Delete** the ZIP file after extraction

#### Option B: Using FTP/SFTP

1. Connect to your server using FTP client (FileZilla, WinSCP, etc.)
2. Navigate to `public_html` directory
3. Back up existing files by copying to a backup folder
4. Upload `homeandown-frontend.zip`
5. Extract the zip file on the server
6. Delete the ZIP file after extraction

### 3. Clear Browser Cache

After uploading, clear your browser cache:

#### Chrome/Edge:
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"

#### Firefox:
1. Press `Ctrl + Shift + Delete`
2. Select "Cache"
3. Click "Clear Now"

#### Or Use Hard Refresh:
- Press `Ctrl + F5` to do a hard refresh

### 4. Verify the Fix

1. Visit your website
2. Go to Admin Dashboard → Bookings
3. Try to edit a booking
4. It should now work without the 404 error

---

## What Was Fixed

### Old Code (Causing 404):
```typescript
// Called: PUT /api/bookings/{id}
// Result: 404 Not Found
```

### New Code (Fixed):
```typescript
// Calls: PUT /api/records/bookings/{id}
// Result: ✅ 200 OK
```

---

## File Verification

### Old Build (on server):
- File: `index-CxZoXN0P.js` ❌
- Has wrong API URL

### New Build (in ZIP):
- File: `index-DskOrxFa.js` ✅
- Has correct API URL

---

## Still Having Issues?

If after uploading you still see the old file (`index-CxZoXN0P.js`):

1. **Check file upload**: Make sure files were actually extracted
2. **Check permissions**: Files should have 644 permissions
3. **Check .htaccess**: Ensure it's present and working
4. **Try incognito**: Test in incognito/private mode
5. **Check CDN**: If using CloudFlare, purge cache there too

---

## Quick Test

After uploading, open browser console and check:
```javascript
// Should see: index-DskOrxFa.js (new build)
// NOT: index-CxZoXN0P.js (old build)
```

---

**Last Updated**: January 2025
**Status**: Ready to Upload ✅

