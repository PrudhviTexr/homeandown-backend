# Forgot Password - Deployment Guide

## Quick Summary
✅ Complete professional forgot password system implemented for all user types (Admin, Agent, Seller, Buyer)
✅ Role-based email templates with professional branding
✅ Secure token-based authentication with 1-hour expiration
✅ Automatic confirmation emails after password changes
✅ All login pages updated with forgot password links

## Pre-Deployment Checklist

### 1. Database Migration
Run the new migration to create the `verification_tokens` table:

```bash
# Apply the migration
cd supabase
supabase db push
```

Or manually run:
```sql
-- File: supabase/migrations/20251031_add_verification_tokens_table.sql
-- This creates the verification_tokens table with metadata support
```

### 2. Environment Variables
Ensure these are set in your production environment:

**Required:**
- `SITE_URL` - Your production domain (e.g., `https://homeandown.com`)

**Email Service (choose one):**
- **Resend** (recommended):
  - `RESEND_API_KEY`
  - `RESEND_SENDER` (e.g., `noreply@homeandown.com`)
  
- **EmailJS**:
  - `EMAILJS_SERVICE_ID`
  - `EMAILJS_TEMPLATE_ID`
  - `EMAILJS_USER_ID`
  
- **SendGrid**:
  - `SENDGRID_API_KEY`
  
- **Gmail SMTP**:
  - `GMAIL_USERNAME`
  - `GMAIL_APP_PASSWORD`

### 3. Frontend Build
```bash
npm run build
```

### 4. Backend Deployment
Ensure the updated `python_api/app/routes/auth.py` is deployed with:
- Enhanced `/api/auth/forgot-password` endpoint
- Enhanced `/api/auth/reset-password` endpoint
- New email templates

## Testing in Production

### Test Flow for Each User Type

1. **Admin Portal Test**
   ```
   1. Go to: https://yourdomain.com/admin/login
   2. Click "Forgot password?"
   3. Enter admin email
   4. Check email for reset link
   5. Click link (should redirect to /admin/reset-password)
   6. Enter new password
   7. Verify confirmation email received
   8. Login with new password at /admin/login
   ```

2. **Agent Portal Test**
   ```
   1. Go to: https://yourdomain.com/agent/login
   2. Click "Forgot your password?"
   3. Enter agent email
   4. Check email for reset link
   5. Click link (should redirect to /agent/reset-password)
   6. Enter new password
   7. Verify confirmation email received
   8. Login with new password at /agent/login
   ```

3. **Seller/Buyer Portal Test**
   ```
   1. Go to: https://yourdomain.com/login
   2. Click "Forgot password?"
   3. Enter seller/buyer email
   4. Check email for reset link
   5. Click link (should redirect to /seller or /buyer/reset-password)
   6. Enter new password
   7. Verify confirmation email received
   8. Login with new password at /login
   ```

## New Routes Available

### Public Routes (no authentication required)
- `/forgot-password` - General forgot password page
- `/reset-password` - General reset password page
- `/admin/forgot-password` - Admin-specific forgot password
- `/admin/reset-password` - Admin-specific reset password
- `/agent/forgot-password` - Agent-specific forgot password
- `/agent/reset-password` - Agent-specific reset password
- `/seller/forgot-password` - Seller-specific forgot password
- `/seller/reset-password` - Seller-specific reset password
- `/buyer/forgot-password` - Buyer-specific forgot password
- `/buyer/reset-password` - Buyer-specific reset password

## API Endpoints

### POST /api/auth/forgot-password
```json
Request:
{
  "email": "user@example.com",
  "user_type": "admin" // optional: admin, agent, seller, buyer
}

Response:
{
  "success": true,
  "message": "If an account exists for this email, a reset link has been sent."
}
```

### POST /api/auth/reset-password
```json
Request:
{
  "token": "uuid-token-from-email",
  "password": "newPassword123"
}

Response:
{
  "success": true,
  "message": "Password reset successful. You can now log in with your new password.",
  "user_type": "admin" // Used for frontend routing
}
```

## Email Templates

### Reset Request Email
- Professional gradient header (blue)
- Role-specific greeting (Administrator, Agent, Seller, Buyer)
- Prominent reset button with role-specific URL
- Security warning with 1-hour expiration
- Alternative text link
- Support information

### Confirmation Email
- Success-themed gradient header (green)
- Confirmation message with role information
- Login button with role-specific URL
- Security alert box
- Password reset details (date, account type, email)
- Support contact information

## Security Features

1. **Token Security**
   - UUID-based tokens (impossible to guess)
   - 1-hour expiration
   - One-time use (marked as used after reset)
   - Stored in separate verification_tokens table

2. **User Privacy**
   - Generic success messages (doesn't reveal if email exists)
   - No user enumeration possible

3. **Email Security**
   - Professional branded emails
   - Clear security warnings
   - Support contact in all emails

## Troubleshooting

### Issue: Emails not being sent
**Solution:** 
- Check email service credentials in environment variables
- Check backend logs for email sending errors
- Verify SMTP/API settings
- Try with Gmail SMTP as fallback (requires app password, not regular password)

### Issue: Reset link redirects to wrong page
**Solution:**
- Verify SITE_URL environment variable is set correctly
- Check that all new routes are deployed in App.tsx
- Clear browser cache

### Issue: Token expired or invalid error
**Solution:**
- Tokens expire after 1 hour for security
- User must request a new reset link
- Check verification_tokens table has proper indexes

### Issue: User type not detected correctly
**Solution:**
- Verify users table has correct user_type values
- Check verification_tokens.metadata field contains user_type
- Ensure backend is storing metadata correctly

## Database Schema

### verification_tokens table
```sql
- id: uuid (primary key)
- user_id: uuid (references users.id)
- token: text (unique)
- type: text (password_reset, email_change, etc.)
- metadata: jsonb (stores user_type and other data)
- created_at: timestamptz
- used_at: timestamptz (null until used)
- expires_at: timestamptz
```

### Indexes
- token (for fast lookups)
- user_id (for user queries)
- type (for filtering by verification type)
- expires_at (for cleanup queries)

## Maintenance

### Cleanup Expired Tokens
Consider adding a cron job to clean up old tokens:

```sql
-- Delete expired tokens older than 7 days
DELETE FROM verification_tokens
WHERE expires_at < NOW() - INTERVAL '7 days';
```

Or create a function:
```sql
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
```

## Monitoring

### Metrics to Track
- Password reset requests per day
- Successful password resets
- Expired token attempts
- Email delivery failures
- Average time from request to reset

### Logs to Monitor
- `[AUTH] Password reset requested for: {email}`
- `[AUTH] Reset token created for user: {user_id}`
- `[AUTH] Password reset email sent to: {email}`
- `[AUTH] Password reset successful for user: {user_id}`
- `[EMAIL] Email sent successfully to: {email}`

## Support

If users report issues:
1. Check if email was sent (check backend logs)
2. Verify token is valid and not expired
3. Check if user exists in database
4. Verify email service is working
5. Check SITE_URL is correct

Contact: support@homeandown.com

## Rollback Plan

If issues occur:
1. Revert backend auth.py changes
2. Revert frontend changes in App.tsx
3. Remove new forgot password pages
4. Drop verification_tokens table (optional, won't affect other features)

## Success Criteria

✅ All login pages have forgot password links
✅ Users receive emails within 30 seconds
✅ Reset links work correctly for all user types
✅ Password changes are successful
✅ Confirmation emails are received
✅ Users can login with new password
✅ No errors in logs

## Post-Deployment Verification

Run through all test flows above for each user type and verify:
- [ ] Forgot password link visible on login page
- [ ] Reset email arrives with correct branding
- [ ] Reset link redirects to correct page
- [ ] Password reset succeeds
- [ ] Confirmation email arrives
- [ ] Login works with new password
- [ ] Old password no longer works

---

**Status:** ✅ Ready for Production Deployment
**Last Updated:** October 31, 2024
**Version:** 1.0.0

