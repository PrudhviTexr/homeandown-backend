# Profile & Role Request Fixes - Deployment Guide

## Quick Summary
✅ Profile editing works for all user roles (Admin, Agent, Seller, Buyer)
✅ Role requests now send emails to users and admins
✅ Role approvals/rejections send notification emails
✅ Profile updates send confirmation emails
✅ All emails are professional and branded

## Files Changed

### Backend Files:
1. `python_api/app/routes/users.py` - Enhanced profile update endpoint
2. `python_api/app/routes/auth.py` - Enhanced role request endpoint
3. `python_api/app/routes/admin.py` - Added role approval/rejection endpoints
4. `python_api/app/models/schemas.py` - Updated UpdateProfileRequest schema

### Documentation Files Created:
1. `PROFILE_AND_ROLE_FIXES.md` - Implementation notes
2. `PROFILE_ROLE_FIXES_SUMMARY.md` - Complete summary
3. `PROFILE_ROLE_DEPLOYMENT.md` - This file

## Deployment Steps

### 1. No Database Changes Required
✅ Uses existing `users` and `user_roles` tables
✅ No migrations needed

### 2. Environment Variables
Ensure email service is configured (same as forgot password):
- `GMAIL_USERNAME` and `GMAIL_APP_PASSWORD` (or)
- `RESEND_API_KEY` and `RESEND_SENDER` (or)
- `EMAILJS_*` or `SENDGRID_API_KEY`
- `SITE_URL` - Your domain (e.g., `https://homeandown.com`)

### 3. Deploy Backend
```bash
# No special deployment needed
# Just deploy updated Python files as usual
```

### 4. Test Immediately After Deployment

#### Test Profile Update:
```bash
# As any authenticated user
curl -X PATCH https://yourdomain.com/api/users/profile \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "city": "Hyderabad"
  }'

# Check email inbox for confirmation
```

#### Test Role Request:
```bash
# As any authenticated user
curl -X POST https://yourdomain.com/api/auth/request-role \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "seller"
  }'

# Check:
# - User email inbox for confirmation
# - All admin emails for notification
```

#### Test Role Approval (Admin):
```bash
curl -X POST https://yourdomain.com/api/admin/roles/approve \
  -H "X-API-Key: {admin_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "{user_uuid}",
    "role": "seller"
  }'

# Check user email inbox for approval email
```

#### Test Role Rejection (Admin):
```bash
curl -X POST https://yourdomain.com/api/admin/roles/reject \
  -H "X-API-Key: {admin_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "{user_uuid}",
    "role": "seller",
    "reason": "Please provide more details"
  }'

# Check user email inbox for rejection email
```

## New Admin Endpoints

### Approve Role Request
```
POST /api/admin/roles/approve
X-API-Key: {admin_key}

Body:
{
  "user_id": "uuid",
  "role": "seller|buyer|agent|admin",
  "site_url": "https://homeandown.com" // optional
}

Response:
{
  "success": true,
  "message": "Role 'seller' approved for user {user_id}"
}
```

### Reject Role Request
```
POST /api/admin/roles/reject
X-API-Key: {admin_key}

Body:
{
  "user_id": "uuid",
  "role": "seller|buyer|agent|admin",
  "reason": "Optional rejection reason"
}

Response:
{
  "success": true,
  "message": "Role 'seller' rejected for user {user_id}"
}
```

## Email Notifications Summary

### When User Updates Profile:
✅ User receives: "Profile Updated" email (green theme)
- Confirms update successful
- Security alert if email/phone changed
- Update timestamp

### When User Requests Role:
✅ User receives: "Role Request Submitted" email (blue theme)
- Confirms request received
- Explains next steps
- Typical review time: 1-2 business days

✅ All Admins receive: "New Role Request" email (orange theme)
- User details
- Requested role
- Link to admin dashboard

### When Admin Approves Role:
✅ User receives: "Role Request Approved!" email (green theme)
- Congratulations message
- Dashboard access button
- New capabilities explained

### When Admin Rejects Role:
✅ User receives: "Role Request Update" email (red theme)
- Professional rejection message
- Reason for rejection
- Next steps and support contact

## Troubleshooting

### Issue: Profile updates not saving
**Check:**
- User is authenticated (valid Bearer token)
- All field names match schema (first_name, not firstName)
- Check backend logs for errors

### Issue: Emails not sending
**Check:**
- Email service credentials configured
- Backend logs show email send attempts
- Check spam folder
- Verify SITE_URL is set correctly

### Issue: Role requests failing
**Check:**
- User is authenticated
- Role name is lowercase (buyer, seller, agent, admin)
- user_roles table exists
- Backend logs for errors

### Issue: Admin can't approve/reject roles
**Check:**
- X-API-Key header is correct
- user_id is valid UUID
- user_roles table has the pending role entry

## Monitoring

### Success Logs to Watch For:
```
[USERS] Profile updated successfully
[USERS] Profile update confirmation email sent to: {email}
[AUTH] Role request confirmation email sent to user: {email}
[AUTH] Role request notification sent to admin: {email}
[ADMIN] Role '{role}' approved for user: {user_id}
[ADMIN] Role approval email sent to: {email}
[ADMIN] Role '{role}' rejected for user: {user_id}
[ADMIN] Role rejection email sent to: {email}
```

### Error Logs to Watch For:
```
[USERS] Update profile error: {error}
[USERS] Failed to send profile update email: {error}
[AUTH] Role request error: {error}
[AUTH] Failed to send role request email to user: {error}
[ADMIN] Role approval error: {error}
[ADMIN] Role rejection error: {error}
```

## Rollback Plan

If issues occur:
1. Revert `python_api/app/routes/users.py`
2. Revert `python_api/app/routes/auth.py`
3. Revert `python_api/app/routes/admin.py`
4. Revert `python_api/app/models/schemas.py`

Note: Email failures won't break functionality - updates still work, just no emails sent.

## User Experience Improvements

1. **Profile Updates**
   - ✅ Now save all fields correctly
   - ✅ Users get immediate email confirmation
   - ✅ Security alerts for sensitive changes

2. **Role Requests**
   - ✅ Users get instant confirmation
   - ✅ Admins notified immediately
   - ✅ Clear next steps communicated

3. **Role Approvals**
   - ✅ Users receive congratulations email
   - ✅ Dashboard link provided
   - ✅ Clear capability explanation

4. **Role Rejections**
   - ✅ Professional rejection messaging
   - ✅ Reason provided
   - ✅ Next steps explained

## Production Checklist

Before deploying:
- [ ] Email service is configured and tested
- [ ] SITE_URL environment variable is set
- [ ] Backend tests pass
- [ ] Admin API key is secure

After deploying:
- [ ] Test profile update as each role
- [ ] Test role request as regular user
- [ ] Test role approval as admin
- [ ] Test role rejection as admin
- [ ] Verify all emails arrive
- [ ] Check email formatting in various clients

## Success Criteria

✅ All user roles can update their profiles
✅ All profile fields save correctly
✅ Profile update emails arrive within 30 seconds
✅ Role requests trigger user and admin emails
✅ Role approvals trigger congratulations email
✅ Role rejections trigger professional feedback email
✅ No errors in backend logs
✅ All emails display correctly in Gmail, Outlook, etc.

---

**Status:** ✅ READY FOR PRODUCTION DEPLOYMENT
**Last Updated:** October 31, 2024
**Version:** 1.0.0

