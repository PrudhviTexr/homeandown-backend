# Upload Error Fix - 500 Internal Server Error

## Problem
The `/api/uploads/upload` endpoint is returning a 500 Internal Server Error when deployed on Render.

## Root Cause
The error is likely caused by:
1. **Missing Supabase Storage Bucket** - The `property-images` bucket doesn't exist in Supabase
2. **Bucket creation failing** - The code tries to auto-create buckets which requires admin privileges
3. **Environment variables** - Missing or incorrect Supabase configuration

## Fix Applied

### Code Changes
Updated `python_api/app/routes/uploads.py`:
1. Removed bucket auto-creation (requires admin privileges)
2. Added better error logging to identify exact failure point
3. Improved error messages for debugging

### What You Need to Do

#### 1. Create Supabase Storage Bucket Manually

Go to your Supabase Dashboard:
1. Visit: https://ajymffxpunxoqcmunohx.supabase.co
2. Navigate to **Storage** section
3. Click **Create a new bucket**
4. Name: `property-images`
5. **Make it PUBLIC** - Check the "Public bucket" checkbox
6. Click **Create bucket**

#### 2. Verify Environment Variables on Render

Ensure these are set in your Render service:
- `SUPABASE_URL` - https://ajymffxpunxoqcmunohx.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key
- `SUPABASE_STORAGE_BUCKET` - property-images (optional, has default)

#### 3. Test the Upload

After pushing the fix and creating the bucket:
1. The backend should auto-deploy on Render (takes 2-5 minutes)
2. Try uploading an image again
3. Check browser console and Render logs for any errors

## Deployment Status

✅ **Code Fix**: Pushed to GitHub
✅ **Render Auto-Deploy**: Should trigger automatically
⏳ **Manual Action Required**: Create bucket in Supabase dashboard

## How to Check Render Logs

1. Go to https://render.com
2. Find your `homeandown-api` service
3. Click on **Logs** tab
4. Look for upload-related errors

## Test Upload Manually

You can test the upload endpoint with:

```bash
curl -X POST https://homeandown-backend.onrender.com/api/uploads/upload \
  -H "X-API-Key: YOUR_API_KEY" \
  -F "entity_type=property" \
  -F "entity_id=test-123" \
  -F "file=@/path/to/image.jpg"
```

## Expected Behavior After Fix

1. Upload request should succeed
2. File should appear in Supabase Storage
3. API should return: `{"success": true, "id": "...", "url": "..."}`
4. Image should be accessible at the returned URL

## If Still Failing

Check for these issues:
1. **CORS errors** - Verify CORS is configured in Supabase
2. **API Key missing** - Check if X-API-Key header is being sent
3. **Bucket not public** - Bucket must be public for URLs to work
4. **File size limit** - Check Supabase storage limits
5. **Path slashes** - Ensure paths don't have double slashes

## Next Steps

After creating the bucket in Supabase:
1. Wait for Render to redeploy (2-5 minutes)
2. Test upload functionality
3. Check Render logs for any remaining errors
4. Verify images appear in Supabase Storage dashboard

---

**Last Updated**: October 28, 2025  
**Status**: Code fixed, awaiting bucket creation in Supabase

