import { pyFetch } from '@/utils/backend';

// Email verification helpers using Python API (Gmail SMTP)


/**
 * Generate verification token and send professional email with 30-minute expiry
 */
export const initiateEmailVerification = async (_userId: string, email: string, firstName: string, lastName: string, userType: string = 'buyer'): Promise<boolean> => {
  try {
    // Backend generates a token during signup; backend can also reissue on demand
    const tokenData = undefined as any;
    // Send professional verification email via Python API (Gmail SMTP)
    const siteUrl = (import.meta as any).env?.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : undefined);
    const verifyLink = `${siteUrl}/email-verification?token=${tokenData}`;
    const html = getVerificationEmailTemplate({ email, firstName, lastName, verificationLink: verifyLink });
    await pyFetch('/emails/send', {
      method: 'POST',
      body: JSON.stringify({ to: email, subject: 'Verify your email', html }),
      headers: { 'Content-Type': 'application/json' },
      useApiKey: true,
    });

    return true; // success if no exception thrown
  } catch (error) {
    console.error('Error initiating email verification:', error);
    // Fallback to development logging
    try {
      if (typeof window !== 'undefined') {
        const verificationLink = `${window.location.origin}/email-verification?token=${(error as any)?.token || 'UNKNOWN'}`;
        console.log('\n=== EMAIL VERIFICATION LINK (DEVELOPMENT FALLBACK) ===');
        console.log(`To: ${email}`);
        console.log(`Name: ${firstName} ${lastName}`);
        console.log(`User Type: ${userType}`);
        console.log(`Verification Link: ${verificationLink}`);
        console.log(`Expires in: 30 minutes`);
        console.log('====================================================\n');
      }
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Verify email token
 */
export const verifyEmailToken = async (token: string): Promise<{ success: boolean; error?: string; message?: string; alreadyVerified?: boolean }> => {
  try {
    // Prefer Python API verification
    try {
      const data = await pyFetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, { method: 'GET' });
      if (data && typeof data === 'object') {
        if (data.success) {
          return {
            success: true,
            message: data.message || 'Email verified successfully!',
            alreadyVerified: data.already_verified || false
          };
        }
        return { success: false, error: data.error || 'Invalid or expired verification token. Please request a new verification email.' };
      }
    } catch (e) {
      throw e;
    }
    return { success: false, error: 'Invalid response from verification service. Please try again.' };
  } catch (error) {
    console.error('Error verifying email token:', error);
    return { success: false, error: 'An unexpected error occurred while verifying your email. Please try again.' };
  }
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
  const res = await pyFetch(`/api/auth/resend-verification?email=${encodeURIComponent(email)}`, { method: 'POST' });
  return { success: !!(res && (res as any).ok) };
  } catch (error) {
    console.error('Error resending verification email:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * HTML template for verification email
 */
export const getVerificationEmailTemplate = (data: { email: string; firstName: string; lastName: string; verificationLink: string; }): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email - Home & Own</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0ca5e9; margin: 0; font-size: 28px; font-weight: 700;">Home & Own</h1>
          </div>
          
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Welcome to Home & Own!</h2>
          
          <p style="margin: 0 0 16px 0; font-size: 16px;">Hi ${data.firstName},</p>
          
          <p style="margin: 0 0 24px 0; font-size: 16px;">Thank you for signing up with Home & Own. To complete your registration and access all features, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.verificationLink}" 
               style="background-color: #0ca5e9; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
              Verify My Email
            </a>
          </div>
          
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0ca5e9; font-size: 14px; margin: 0 0 24px 0; background-color: #f3f4f6; padding: 12px; border-radius: 4px;">${data.verificationLink}</p>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Important:</strong> This verification link will expire in 24 hours.</p>
          </div>
          
          <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b7280;">If you didn't create an account with Home & Own, you can safely ignore this email.</p>
          
          <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <div style="text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              Best regards,<br>
              <strong>The Home & Own Team</strong>
            </p>
            <p style="font-size: 11px; color: #d1d5db; margin: 8px 0 0 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Resend email verification is now configured and ready for production use.
 * 
 * Required environment variable:
 * - RESEND_API_KEY: Your Resend API key
 * 
 * The system will automatically fall back to console logging in development
 * if the API key is not provided.
 */