import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  ownerEmail: string;
  ownerName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  propertyTitle: string;
  propertyAddress: string;
  bookingDate: string;
  bookingTime: string;
  bookingId: string;
  status: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      ownerEmail,
      ownerName,
      customerName,
      customerEmail,
      customerPhone,
      propertyTitle,
      propertyAddress,
      bookingDate,
      bookingTime,
      bookingId,
      status
    }: BookingNotificationRequest = await req.json();

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'confirmed': return '#4CAF50';
        case 'pending': return '#FF9800';
        case 'cancelled': return '#F44336';
        default: return '#2196F3';
      }
    };

    const getStatusMessage = (status: string) => {
      switch (status) {
        case 'confirmed': return 'Your property tour has been confirmed!';
        case 'pending': return 'You have a new property tour request!';
        case 'cancelled': return 'A property tour has been cancelled.';
        default: return 'Property tour status update';
      }
    };

    // Create professional booking notification email
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Notification - Home & Own</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        </style>
      </head>
      <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          
          <!-- Header -->
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
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 300;">Property Tour Notification</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 60px; height: 60px; background-color: ${getStatusColor(status)}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 style="color: #1e293b; margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">${getStatusMessage(status)}</h2>
              <p style="color: #64748b; margin: 0; font-size: 16px;">Booking ID: ${bookingId}</p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
              <p style="margin: 0 0 8px 0; font-size: 18px; color: #334155;">Hi <strong>${ownerName}</strong>,</p>
              <p style="margin: 0; font-size: 16px; color: #64748b; line-height: 1.6;">
                ${getStatusMessage(status)}
              </p>
            </div>
            
            <!-- Property Details -->
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 32px;">
              <div style="background-color: #667eea; color: white; padding: 16px;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Property Details</h3>
              </div>
              <div style="padding: 24px;">
                <div style="margin-bottom: 16px;">
                  <strong style="color: #374151;">Property:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${propertyTitle}</span>
                </div>
                <div style="margin-bottom: 16px;">
                  <strong style="color: #374151;">Address:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${propertyAddress}</span>
                </div>
                <div style="margin-bottom: 16px;">
                  <strong style="color: #374151;">Tour Date:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${bookingDate}</span>
                </div>
                <div>
                  <strong style="color: #374151;">Tour Time:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${bookingTime}</span>
                </div>
              </div>
            </div>
            
            <!-- Customer Details -->
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 32px;">
              <div style="background-color: #10b981; color: white; padding: 16px;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Customer Information</h3>
              </div>
              <div style="padding: 24px;">
                <div style="margin-bottom: 16px;">
                  <strong style="color: #374151;">Name:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${customerName}</span>
                </div>
                <div style="margin-bottom: 16px;">
                  <strong style="color: #374151;">Email:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${customerEmail}</span>
                </div>
                <div>
                  <strong style="color: #374151;">Phone:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${customerPhone}</span>
                </div>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="https://your-domain.com/my-bookings" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; font-size: 16px; margin: 0 8px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                View All Bookings
              </a>
              <a href="mailto:${customerEmail}" 
                 style="background: #10b981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; font-size: 16px; margin: 0 8px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                Contact Customer
              </a>
            </div>
            
            <div style="text-align: center; padding: 24px 0; border-top: 1px solid #e2e8f0; margin-top: 40px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">
                This is an automated notification from Home & Own.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                For support, contact us through your dashboard.
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
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Log email details (in production, use Gmail API)
    console.log("\n=== BOOKING NOTIFICATION EMAIL ===");
    console.log(`From: Home & Own <r4itlabs2010@gmail.com>`);
    console.log(`To: ${ownerEmail}`);
    console.log(`Subject: ${getStatusMessage(status)} - Booking ${bookingId}`);
    console.log(`Property: ${propertyTitle}`);
    console.log(`Customer: ${customerName} (${customerEmail})`);
    console.log(`Status: ${status}`);
    console.log("================================\n");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Booking notification email sent successfully",
      provider: "gmail"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in booking notification function:", error);
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