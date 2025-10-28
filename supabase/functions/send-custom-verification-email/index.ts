import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailVerificationRequest {
  email: string;
  firstName: string;
  lastName: string;
  token: string;
  userType: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "re_fosAWsFh_CjpzUNsb2Px847rDEe9Ejq9L";
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not found in environment variables");
      // In development, log the verification details
      const { email, firstName, lastName, token, userType }: EmailVerificationRequest = await req.json();
      const verificationUrl = `${req.headers.get('origin') || 'https://homeandown.com'}/email-verification?token=${token}`;
      
      console.log("\n=== EMAIL VERIFICATION LINK (DEV MODE) ===");
      console.log(`To: ${email}`);
      console.log(`Name: ${firstName} ${lastName}`);
      console.log(`User Type: ${userType}`);
      console.log(`Verification Link: ${verificationUrl}`);
      console.log("=========================================\n");
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Verification email logged to console (development mode)" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { email, firstName, lastName, token, userType }: EmailVerificationRequest = await req.json();
    
    const resend = new Resend(resendApiKey);
    const verificationUrl = `${req.headers.get('origin') || 'https://homeandown.com'}/email-verification?token=${token}`;

    // Determine approval message based on user type
    const getApprovalMessage = (userType: string) => {
      switch (userType) {
        case 'agent':
          return `
            <div style="background-color: #e3f2fd; border: 1px solid #2196f3; border-radius: 6px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #1565c0;"><strong>Agent Application:</strong> After email verification, our admin team will review your application and documents. You'll receive notification once approved and your license number will be generated.</p>
            </div>
          `;
        case 'seller':
          return `
            <div style="background-color: #e8f5e8; border: 1px solid #4caf50; border-radius: 6px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #2e7d32;"><strong>Seller Application:</strong> After email verification, our admin team will review your business documents. You'll receive notification once approved and can start listing properties.</p>
            </div>
          `;
        default:
          return '';
      }
    };

    const emailResponse = await resend.emails.send({
      from: "Home & Own <noreply@homeandtown.app>",
      to: [email],
      subject: "Verify your email address - Home & Own",
      html: `
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
              
              <p style="margin: 0 0 16px 0; font-size: 16px;">Hi ${firstName},</p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px;">Thank you for registering as a <strong>${userType}</strong> with Home & Own. To complete your registration, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #0ca5e9; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                  Verify My Email Address
                </a>
              </div>
              
              ${getApprovalMessage(userType)}
              
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #0ca5e9; font-size: 14px; margin: 0 0 24px 0; background-color: #f3f4f6; padding: 12px; border-radius: 4px;">${verificationUrl}</p>
              
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
      `,
    });

    console.log("Custom verification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-custom-verification-email function:", error);
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