# Forgot Password Flow - How Email Link Authentication Works

## Overview
The forgot password system uses a secure token-based authentication flow that validates users through email links pointing to `homeandown.com`.

## Complete Flow

### Step 1: User Requests Password Reset
**Frontend:** `src/pages/ForgotPassword.tsx`
- User enters email address
- Calls: `POST /api/auth/forgot-password`

### Step 2: Backend Generates Secure Token
**Backend:** `python_api/app/routes/auth.py` - `forgot_password()`

1. **Validates User:**
   - Checks if email exists in database
   - Verifies user type (admin/agent/seller/buyer)

2. **Generates Secure Token:**
   ```python
   reset_token = str(uuid.uuid4())  # Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   expires_at = datetime.now(UTC) + timedelta(hours=1)  # Valid for 1 hour
   ```

3. **Stores Token in Database:**
   - Table: `verification_tokens`
   - Fields:
     - `token`: The UUID token
     - `type`: "password_reset"
     - `user_id`: Links to the user
     - `expires_at`: 1 hour from creation
     - `created_at`: Timestamp
     - `used_at`: NULL (set when token is used)

### Step 3: Email Sent with Reset Link
**Email Link Format:**
```
https://homeandown.com/reset-password?token=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Role-Specific URLs:**
- Admin: `https://homeandown.com/admin/reset-password?token=...`
- Agent: `https://homeandown.com/agent/reset-password?token=...`
- Seller: `https://homeandown.com/seller/reset-password?token=...`
- Buyer: `https://homeandown.com/buyer/reset-password?token=...`
- Default: `https://homeandown.com/reset-password?token=...`

**Email Content:**
- Professional HTML email with Home & Own branding
- Button: "Reset Your Password" (links to reset URL)
- Alternative: Plain text link for copy-paste
- Security notice: Link expires in 1 hour

### Step 4: User Clicks Email Link
**What Happens:**
1. User clicks link → Browser navigates to `https://homeandown.com/reset-password?token=...`
2. React app loads (served from homeandown.com)
3. `ResetPassword.tsx` component mounts
4. Extracts token from URL query parameter:
   ```typescript
   const params = new URLSearchParams(location.search);
   const token = params.get('token');
   ```

### Step 5: User Enters New Password
**Frontend:** `src/pages/ResetPassword.tsx`
- User enters new password (min 8 characters)
- User confirms new password
- Form validates passwords match

### Step 6: Frontend Sends Token + Password to Backend
**API Call:**
```typescript
POST /api/auth/reset-password
Body: {
  token: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  password: "newSecurePassword123"
}
```

### Step 7: Backend Validates Token
**Backend:** `python_api/app/routes/auth.py` - `reset_password()`

**Validation Steps:**

1. **Token Exists Check:**
   ```python
   tokens = await db.select("verification_tokens", filters={
       "token": token,
       "type": "password_reset"
   })
   ```
   - If not found → Error: "Invalid or expired reset token"

2. **Token Expiration Check:**
   ```python
   expires_at = datetime.fromisoformat(token_data["expires_at"])
   if datetime.now(UTC) > expires_at:
       # Delete expired token
       await db.delete("verification_tokens", {"id": token_data["id"]})
       raise HTTPException(400, "Reset token has expired")
   ```
   - If expired → Error: "Reset token has expired"

3. **Token Usage Check:**
   ```python
   if token_data.get("used_at"):
       raise HTTPException(400, "Reset token has already been used")
   ```
   - If already used → Error: "Reset token has already been used"

4. **Password Validation:**
   - Must be at least 8 characters
   - If invalid → Error: "Password must be at least 8 characters long"

### Step 8: Password Reset Success
**If All Validations Pass:**

1. **Hash New Password:**
   ```python
   password_hash = get_password_hash(new_password)
   ```

2. **Update User Password:**
   ```python
   await db.update("users", {
       "password_hash": password_hash,
       "updated_at": datetime.now(UTC).isoformat()
   }, {"id": user_id})
   ```

3. **Mark Token as Used:**
   ```python
   await db.update("verification_tokens", {
       "used_at": datetime.now(UTC).isoformat()
   }, {"id": token_data["id"]})
   ```
   - Prevents token reuse

4. **Send Confirmation Email:**
   - Email confirms password was changed
   - Includes security alert if user didn't make the change
   - Provides login link

5. **Return Success:**
   ```json
   {
     "success": true,
     "message": "Password reset successful. You can now log in with your new password."
   }
   ```

### Step 9: User Can Now Login
- User navigates to login page
- Uses new password to authenticate
- Success! ✅

## Security Features

### 1. **Token Security:**
- ✅ Unique UUID (128-bit random token)
- ✅ Stored in database (not guessable)
- ✅ One-time use (marked as used after reset)
- ✅ Time-limited (expires in 1 hour)

### 2. **Domain Validation:**
- ✅ Links always point to `https://homeandown.com` (production)
- ✅ Never uses localhost in production emails
- ✅ Configurable via `SITE_URL` environment variable

### 3. **Database Validation:**
- ✅ Token must exist in `verification_tokens` table
- ✅ Token must match `type: "password_reset"`
- ✅ Token must not be expired
- ✅ Token must not be already used

### 4. **User Validation:**
- ✅ Token is linked to specific `user_id`
- ✅ Only that user's password can be reset
- ✅ User must exist in database

## Configuration

### Environment Variables:
```env
SITE_URL=https://homeandown.com  # Used for email reset links
```

### Database Table: `verification_tokens`
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- token: String (unique UUID)
- type: String ("password_reset")
- expires_at: Timestamp
- created_at: Timestamp
- used_at: Timestamp (NULL until used)
```

## Error Handling

| Error | Cause | User Message |
|-------|-------|--------------|
| Token not found | Invalid token or already used | "Invalid or expired reset token" |
| Token expired | > 1 hour since creation | "Reset token has expired" |
| Token already used | Token was used before | "Reset token has already been used" |
| Password too short | < 8 characters | "Password must be at least 8 characters long" |
| User not found | Email doesn't exist | "No user found with this email address" |

## Testing the Flow

1. **Request Reset:**
   ```
   POST /api/auth/forgot-password
   Body: { "email": "user@example.com" }
   ```

2. **Check Email:**
   - Look for email from Home & Own
   - Copy the reset link

3. **Click Link:**
   - Should navigate to `https://homeandown.com/reset-password?token=...`
   - Page should load and show password reset form

4. **Enter New Password:**
   - Enter password (min 8 chars)
   - Confirm password
   - Submit

5. **Verify:**
   - Should see success message
   - Should receive confirmation email
   - Should be able to login with new password

## Summary

The authentication flow is secure because:
1. ✅ Token is cryptographically random (UUID)
2. ✅ Token is stored in database (server-side validation)
3. ✅ Token expires after 1 hour
4. ✅ Token can only be used once
5. ✅ Link points to your domain (homeandown.com)
6. ✅ All validation happens on the backend
7. ✅ Password is hashed before storage

The email link validates to homeandown.com because:
- The link URL is `https://homeandown.com/reset-password?token=...`
- When clicked, it loads your React app from homeandown.com
- The React app extracts the token from the URL
- The token is sent to your backend API for validation
- Backend validates token against database
- If valid, password is reset and user can login

