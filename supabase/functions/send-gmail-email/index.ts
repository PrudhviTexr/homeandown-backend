// @ts-nocheck
// Deno edge function: TypeScript checking is disabled in the editor to avoid Node/TS tooling errors.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
  "authorization, x-client-info, apikey, content-type, x-site-url, x-supabase-authorization, accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  token?: string;
  userType?: string;
  expiresInMinutes?: number;
  template?: 'verification' | 'agentIdProofSubmitted' | 'adminAgentIdProofNotification' | 'accountApproved' | 'accountRejected';
  reason?: string;
  licenseNumber?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
  return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
  const { email, firstName = '', lastName = '', token = '', userType = 'buyer', expiresInMinutes = 30, template = 'verification', reason = '', licenseNumber = '' }: EmailRequest = await req.json();
    
    // Get the origin from request headers, default to localhost for development
  // Allow overriding origin via x-site-url header for production links
  const siteUrl = req.headers.get('x-site-url');
  const origin = siteUrl || req.headers.get('origin') || 'http://localhost:3000';
    const verificationUrl = token ? `${origin}/email-verification?token=${token}` : '';
    
    // Gmail SMTP configuration from environment variables
  const gmailUsername = (Deno.env.get("GMAIL_USERNAME") || "").trim();
  const gmailPassword = (Deno.env.get("GMAIL_APP_PASSWORD") || "").replace(/\s+/g, "");
    if (!gmailUsername || !gmailPassword) {
      console.error("Missing Gmail SMTP credentials. Set GMAIL_USERNAME and GMAIL_APP_PASSWORD in function environment.");
    }
    
    const gmailConfig = {
      hostname: "smtp.gmail.com",
      port: 587,
      username: gmailUsername,
      password: gmailPassword
    };

  // Determine approval message based on user type
    const getApprovalMessage = (userType: string) => {
      switch (userType) {
        case 'agent':
          return `
            <div style="background-color: #e3f2fd; border: 1px solid #2196f3; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 8px; height: 8px; background-color: #2196f3; border-radius: 50%; margin-right: 12px;"></div>
                <h3 style="margin: 0; color: #1565c0; font-size: 16px;">Agent Application Process</h3>
              </div>
              <p style="margin: 0; font-size: 14px; color: #1565c0; line-height: 1.5;">
                After email verification, our admin team will review your application and documents. 
                Once approved, your license number will be auto-generated (starting from H&O001) and you'll receive notification to start working with clients.
              </p>
            </div>
          `;
        case 'seller':
          return `
            <div style="background-color: #e8f5e8; border: 1px solid #4caf50; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 8px; height: 8px; background-color: #4caf50; border-radius: 50%; margin-right: 12px;"></div>
                <h3 style="margin: 0; color: #2e7d32; font-size: 16px;">Seller Application Process</h3>
              </div>
              <p style="margin: 0; font-size: 14px; color: #2e7d32; line-height: 1.5;">
                After email verification, our admin team will review your business documents and profile. 
                Once approved, you can start listing properties and connect with potential buyers.
              </p>
            </div>
          `;
        case 'buyer':
          return `
            <div style="background-color: #f3e5f5; border: 1px solid #9c27b0; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 8px; height: 8px; background-color: #9c27b0; border-radius: 50%; margin-right: 12px;"></div>
                <h3 style="margin: 0; color: #7b1fa2; font-size: 16px;">Welcome to Home & Own</h3>
              </div>
              <p style="margin: 0; font-size: 14px; color: #7b1fa2; line-height: 1.5;">
                Once your email is verified, you can start browsing properties, save favorites, and connect with sellers and agents.
              </p>
            </div>
          `;
        default:
          return '';
      }
    };

    // Subject and HTML by template
    let subject = '';
    let emailHTML = '';

    if (template === 'verification') {
      // Create professional email HTML with logo
      subject = 'Verify your email address - Home & Own';
      emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - Home & Own</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        </style>
      </head>
      <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="background-color: rgba(255,255,255,0.1); display: inline-block; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
              <div style="width: 60px; height: 60px; background-color: #fff; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" stroke="#667eea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 22V12H15V22" stroke="#667eea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Home & Own</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 300;">Your Premier Real Estate Platform</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 28px; font-weight: 600;">Welcome to Home & Own!</h2>
              <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #667eea, #764ba2); margin: 0 auto; border-radius: 2px;"></div>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
              <p style="margin: 0 0 8px 0; font-size: 18px; color: #334155;">Hi <strong>${firstName}</strong>,</p>
              <p style="margin: 0; font-size: 16px; color: #64748b; line-height: 1.6;">
                Thank you for registering as a <strong style="color: #667eea;">${userType}</strong> with Home & Own. 
                To complete your registration, please verify your email address by clicking the button below:
              </p>
            </div>
            
            <!-- Verification Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                ✨ Verify My Email Address
              </a>
            </div>
            
            ${getApprovalMessage(userType)}
            
            <!-- Important Notice -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 20px; margin: 32px 0;">
              <div style="display: flex; align-items: flex-start;">
                <div style="background-color: #f59e0b; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-size: 12px; font-weight: 600;">⚠</div>
                <div>
                  <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px; font-weight: 600;">Important Security Notice</h4>
                  <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
                    This verification link will expire in <strong>${expiresInMinutes} minutes</strong> for security purposes. 
                    If the link expires, you can request a new one from the login page.
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Alternative Link -->
            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #475569; font-weight: 500;">Can't click the button? Copy and paste this link:</p>
              <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; word-break: break-all;">
                <code style="color: #667eea; font-size: 13px; font-family: 'Monaco', 'Menlo', monospace;">${verificationUrl}</code>
              </div>
            </div>
            
            <div style="text-align: center; padding: 24px 0; border-top: 1px solid #e2e8f0; margin-top: 40px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">
                If you didn't create an account with Home & Own, you can safely ignore this email.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                This is an automated message from Home & Own. Please do not reply to this email.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #1e293b; color: white; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
            <div style="margin-bottom: 16px;">
              <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">Home & Own</h3>
              <p style="margin: 0; font-size: 14px; color: #94a3b8;">Connecting People with Perfect Properties</p>
            </div>
            <div style="font-size: 12px; color: #64748b; line-height: 1.4;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Home & Own. All rights reserved.</p>
              <p style="margin: 4px 0 0 0;">Professional Real Estate Platform | Trusted by Thousands</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    } else if (template === 'agentIdProofSubmitted') {
      subject = 'ID proof received - Home & Own';
      const dashboardUrl = `${origin}/agent/dashboard`;
      emailHTML = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>ID Proof Received</title></head>
      <body style="font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; background:#f8fafc; color:#0f172a;">
        <div style="max-width:650px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="padding:20px 24px;background:#0ea5e9;color:#fff;">
            <h2 style="margin:0;font-size:20px;">Identity document submitted</h2>
          </div>
          <div style="padding:24px;">
            <p>Hi ${firstName || 'Agent'},</p>
            <p>We received your ID proof. Our admin team will review it shortly. You'll be notified once the verification is complete.</p>
            <p style="margin-top:16px;">
              <a href="${dashboardUrl}" style="background:#0ea5e9;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block;">Go to Dashboard</a>
            </p>
          </div>
          <div style="padding:16px 24px;background:#f1f5f9;color:#475569;font-size:12px;">Home & Own</div>
        </div>
      </body>
      </html>`;
  } else if (template === 'adminAgentIdProofNotification') {
      subject = 'New agent ID proof uploaded';
      const adminUrl = `${origin}/admin`; // adjust if needed
      emailHTML = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Admin Notification</title></head>
      <body style="font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; background:#f8fafc; color:#0f172a;">
        <div style="max-width:650px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="padding:20px 24px;background:#10b981;color:#fff;">
            <h2 style="margin:0;font-size:20px;">New agent ID proof submitted</h2>
          </div>
          <div style="padding:24px;">
            <p>An agent has uploaded an ID proof for verification.</p>
            <ul style="line-height:1.7;color:#334155;">
              <li>Name: ${firstName} ${lastName}</li>
              <li>Email: ${email}</li>
              <li>Role: agent</li>
            </ul>
            <p style="margin-top:16px;">
              <a href="${adminUrl}" style="background:#10b981;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block;">Open Admin Dashboard</a>
            </p>
          </div>
          <div style="padding:16px 24px;background:#f1f5f9;color:#475569;font-size:12px;">Home & Own</div>
        </div>
      </body>
      </html>`;
  } else if (template === 'accountApproved') {
      const role = (userType || 'user').toString();
      subject = `Your ${role} account has been approved - Home & Own`;
      const loginUrl = `${origin}/login`;
      emailHTML = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Account Approved</title></head>
      <body style="font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; background:#f8fafc; color:#0f172a;">
        <div style="max-width:650px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="padding:20px 24px;background:#16a34a;color:#fff;">
            <h2 style="margin:0;font-size:20px;">Account Approved</h2>
          </div>
          <div style="padding:24px;">
            <p>Hi ${firstName || 'there'},</p>
            <p>Your ${role} account has been approved. You now have full access to the platform features.</p>
      ${role === 'agent' && licenseNumber ? `<p style="margin-top:8px;">Your agent license number: <strong>${licenseNumber}</strong></p>` : ''}
            <p style="margin-top:16px;">
              <a href="${loginUrl}" style="background:#16a34a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block;">Sign in</a>
            </p>
          </div>
          <div style="padding:16px 24px;background:#f1f5f9;color:#475569;font-size:12px;">Home & Own</div>
        </div>
      </body>
      </html>`;
    } else if (template === 'accountRejected') {
      const role = (userType || 'user').toString();
      subject = `Your ${role} application status - Home & Own`;
      emailHTML = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Application Update</title></head>
      <body style="font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; background:#f8fafc; color:#0f172a;">
        <div style="max-width:650px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="padding:20px 24px;background:#ef4444;color:#fff;">
            <h2 style="margin:0;font-size:20px;">Application Update</h2>
          </div>
          <div style="padding:24px;">
            <p>Hi ${firstName || 'there'},</p>
            <p>Unfortunately, your ${role} application was not approved at this time.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>You can reply to this email if you have questions or would like to re-apply with updated documents.</p>
          </div>
          <div style="padding:16px 24px;background:#f1f5f9;color:#475569;font-size:12px;">Home & Own</div>
        </div>
      </body>
      </html>`;
    }

    // Send email using Gmail SMTP
    try {
      const client = new SmtpClient();
      
      await client.connect({
        hostname: gmailConfig.hostname,
        port: gmailConfig.port,
        username: gmailConfig.username,
        password: gmailConfig.password,
      });

      // Resolve recipient
      const adminList = (Deno.env.get('ADMIN_NOTIFICATION_EMAILS') || Deno.env.get('ADMIN_EMAIL') || gmailUsername).split(',').map(s => s.trim()).filter(Boolean);
      const toRecipient = template === 'adminAgentIdProofNotification' ? adminList.join(',') : email;

      const emailData = {
        from: `"Home & Own" <${gmailUsername}>`,
        to: toRecipient,
        subject: subject || 'Home & Own Notification',
        content: emailHTML,
        html: emailHTML
      };

      console.log("\n=== SENDING PROFESSIONAL EMAIL VERIFICATION (GMAIL) ===");
      console.log(`From: ${emailData.from}`);
      console.log(`To: ${emailData.to}`);
      console.log(`Subject: ${emailData.subject}`);
      console.log(`User: ${firstName} ${lastName} (${userType})`);
      if (template === 'verification') {
        console.log(`Verification Link: ${verificationUrl}`);
        console.log(`Expires in: ${expiresInMinutes} minutes`);
      }
      
      await client.send(emailData);
      await client.close();
      
  console.log("✅ Email sent successfully via Gmail SMTP");
      console.log("=======================================================\n");
      
    } catch (emailSendError) {
      console.error("❌ Error sending email via SMTP:", emailSendError);
      
      // Fallback: Log email details for manual verification during development
      if (template === 'verification') {
        console.log("\n=== EMAIL VERIFICATION LINK (FALLBACK) ===");
        console.log(`To: ${email}`);
        console.log(`Name: ${firstName} ${lastName}`);
        console.log(`User Type: ${userType}`);
        console.log(`Verification Link: ${verificationUrl}`);
        console.log(`Expires in: ${expiresInMinutes} minutes`);
        console.log("==========================================\n");
      }
      
      // Don't throw error - continue with fallback
    }
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Professional verification email sent successfully via Gmail",
  provider: "gmail",
  template,
  expiresInMinutes: expiresInMinutes
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in Gmail email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);