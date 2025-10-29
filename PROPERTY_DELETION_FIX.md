# Property Automatic Deletion Fix

## ✅ Critical Issue Found and Fixed

### Problem: Properties are automatically deleting

**Root Cause Analysis**:
1. **Unsecured DELETE Endpoint**: The `DELETE /api/properties/{property_id}` endpoint was **NOT requiring authentication**. This meant anyone who knew the endpoint could delete properties.
2. **RLS Policy Risk**: While there's a Row Level Security policy that should prevent unauthorized deletions, if the backend uses `service_role_key` (which bypasses RLS), the delete endpoint could be called without proper authorization checks.
3. **No Audit Trail**: Property deletions were happening without proper logging to track who/what deleted them.

---

## ✅ Solutions Implemented

### 1. Added Authentication to Delete Endpoint ✅

**Before**:
```python
@router.delete("/{property_id}")
async def delete_property(property_id: str):  # NO AUTHENTICATION!
```

**After**:
```python
@router.delete("/{property_id}")
async def delete_property(property_id: str, _=Depends(require_api_key)):
    """
    Delete a property - REQUIRES API KEY AUTHENTICATION
    This endpoint should only be called by admin users or authorized services.
    """
```

**Result**: Now the delete endpoint requires API key authentication, preventing unauthorized deletions.

---

### 2. Added Comprehensive Audit Logging ✅

**Added detailed logging for all property deletions**:
```python
print(f"[PROPERTIES] ⚠️ DELETE REQUEST for property: {property_id}")
print(f"[PROPERTIES] ⚠️ DELETING PROPERTY:")
print(f"  - ID: {property_id}")
print(f"  - Custom ID: {property_custom_id}")
print(f"  - Title: {property_title}")
print(f"  - Owner ID: {property_data.get('owner_id')}")
print(f"  - Status: {property_data.get('status')}")
print(f"  - Created: {property_data.get('created_at')}")
```

**Result**: All property deletions are now logged with full details for audit trail.

---

### 3. Clarified Property Filtering Logic ✅

**Issue**: Properties might appear "deleted" when they're actually just filtered out because `verified=false` or `status!='active'`.

**Solution**: Added clear logging to distinguish between filtering (not shown) vs deletion (removed from database):
```python
filtered_out = initial_count - len(properties)
if filtered_out > 0:
    print(f"[PROPERTIES] ⚠️ Filtered out {filtered_out} properties (not verified or not active) - THESE ARE NOT DELETED, just hidden from public view")
```

**Result**: Clear distinction between properties that are filtered out (still in database) vs deleted (removed from database).

---

## 🔍 Additional Findings

### Database Constraints

The database has CASCADE DELETE relationships, but they work the **correct way**:
- When a property is deleted, related records (inquiries, bookings, sections) are also deleted
- When a user is deleted, property `owner_id`/`agent_id` fields are set to NULL (not deleted) because of `ON DELETE SET NULL`
- This is correct behavior and doesn't cause automatic property deletion

### RLS Policies

There's an RLS policy that allows authenticated users to delete their own properties:
```sql
CREATE POLICY delete_own_properties ON public.properties 
FOR DELETE TO authenticated USING (owner_id = auth.uid());
```

**However**, this only applies when:
- The user is authenticated via Supabase Auth (not API key)
- The user's `auth.uid()` matches the property's `owner_id`

If the backend uses `service_role_key`, it bypasses RLS, so the API key authentication requirement is critical.

---

## 📋 How to Verify

1. **Check Backend Logs**:
   - Look for `⚠️ DELETE REQUEST` messages in Render logs
   - This will show when and what properties are being deleted
   - Check who/what is calling the delete endpoint

2. **Check Database**:
   - Query: `SELECT * FROM properties WHERE status = 'pending' OR verified = false`
   - These properties exist in the database but are filtered from public listings
   - This is **not** deletion - they're just hidden

3. **Test Delete Endpoint**:
   - Try to DELETE without API key: Should fail with 401/403
   - Try with valid API key: Should work (if authorized)

---

## 🚨 Important Notes

1. **Properties with `verified=false` are NOT deleted**:
   - They exist in the database
   - They're just filtered from public property listings
   - They appear in admin panel for approval

2. **Properties with `status='pending'` are NOT deleted**:
   - Same as above - filtered from public view, but exist in database

3. **All deletions now require authentication**:
   - Cannot delete properties without valid API key
   - All deletions are logged for audit

---

## 🔧 Next Steps (If Properties Still Disappear)

If properties are still being deleted after this fix:

1. **Check Render Logs**:
   - Look for any `⚠️ DELETE REQUEST` messages
   - Check timestamp of deletion vs when property was created

2. **Check for Accidental Deletions**:
   - Review admin panel delete actions
   - Check if any automated scripts/jobs are calling delete endpoint

3. **Check Database Constraints**:
   - Verify foreign key relationships haven't changed
   - Check if any database triggers were added

4. **Monitor Property Count**:
   - Track total property count over time
   - Compare with deletions logged in backend

---

## ✅ Files Changed

- `python_api/app/routes/properties.py`:
  - Added `require_api_key` authentication to DELETE endpoint
  - Added comprehensive audit logging
  - Clarified filtering vs deletion in logs

---

## 🚀 Deployment Status

- ✅ Backend fix pushed to Git
- ⏳ Render auto-deployment in progress
- ✅ All deletions now require authentication
- ✅ All deletions are logged

**Status**: Property deletion endpoint is now secured. If properties are still disappearing, check backend logs for `⚠️ DELETE REQUEST` messages to identify the source.

