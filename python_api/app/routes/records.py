from fastapi import APIRouter, HTTPException, Depends, Request
from ..models.schemas import InquiryRequest, BookingRequest, PropertyRequest, BookingUpdateRequest, InquiryUpdateRequest
from ..core.security import require_api_key
from ..services.email import send_email
from ..services.templates import inquiry_email, booking_email, booking_status_email, inquiry_status_email, notify_info
from ..db.supabase_client import db
import datetime as dt
import uuid

router = APIRouter()


@router.post("/contact")
async def create_contact_message(data: dict):
    """Handle contact form submissions from website"""
    try:
        print(f"[RECORDS] Received contact form submission")
        
        name = data.get("name", "")
        email = data.get("email", "")
        message = data.get("message", "")
        form_type = data.get("form_type", "general")  # general, property_management, consultation
        
        if not name or not email or not message:
            raise HTTPException(status_code=400, detail="Name, email, and message are required")
        
        # Store in database (optional - create contacts table if needed)
        contact_data = {
            "id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "message": message,
            "form_type": form_type,
            "status": "new",
            "created_at": dt.datetime.now(dt.timezone.utc).isoformat()
        }
        
        # Try to save to database (if table exists)
        try:
            await db.insert("contacts", contact_data)
            print(f"[RECORDS] Contact saved to database")
        except Exception as db_error:
            print(f"[RECORDS] Database save failed (table may not exist): {db_error}")
            # Continue anyway - email is more important
        
        # Send email to admin
        admin_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                    New Contact Form Submission
                </h2>
                
                <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 5px;">
                    <p><strong style="color: #162e5a;">Form Type:</strong> {form_type.replace('_', ' ').title()}</p>
                    <p><strong style="color: #162e5a;">Name:</strong> {name}</p>
                    <p><strong style="color: #162e5a;">Email:</strong> {email}</p>
                </div>
                
                <div style="margin: 20px 0; padding: 15px; background-color: #fff; border: 1px solid #e5e7eb; border-radius: 5px;">
                    <h3 style="color: #162e5a; margin-top: 0;">Message:</h3>
                    <p style="white-space: pre-wrap;">{message}</p>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 5px;">
                    <p style="margin: 0;"><strong>Action Required:</strong> Please respond to this inquiry at your earliest convenience.</p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    © 2025 Home & Own. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        """
        
        await send_email(
            to="info@homeandown.com",
            subject=f"New Contact Form Submission from {name}",
            html=admin_html
        )
        print(f"[RECORDS] Contact form email sent to admin")
        
        # Send confirmation email to user
        user_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #2563eb; margin: 0;">Thank You for Contacting Us!</h2>
                </div>
                
                <p>Dear {name},</p>
                
                <p>We have received your message and appreciate you reaching out to Home & Own.</p>
                
                <div style="margin: 20px 0; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #2563eb; border-radius: 5px;">
                    <p style="margin: 0;"><strong>Your message:</strong></p>
                    <p style="margin: 10px 0 0 0; white-space: pre-wrap;">{message}</p>
                </div>
                
                <p>Our team will review your inquiry and get back to you within 24-48 hours.</p>
                
                <p>In the meantime, feel free to explore our platform:</p>
                <ul>
                    <li><a href="https://homeandown.com/buy" style="color: #2563eb;">Browse Properties for Sale</a></li>
                    <li><a href="https://homeandown.com/rent" style="color: #2563eb;">Find Rental Properties</a></li>
                    <li><a href="https://homeandown.com/sell" style="color: #2563eb;">List Your Property</a></li>
                </ul>
                
                <p>Best regards,<br>
                <strong>The Home & Own Team</strong></p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    © 2025 Home & Own. All rights reserved.<br>
                    If you have any questions, reply to this email or visit our website.
                </p>
            </div>
        </body>
        </html>
        """
        
        await send_email(
            to=email,
            subject="We've Received Your Message - Home & Own",
            html=user_html
        )
        print(f"[RECORDS] Confirmation email sent to: {email}")
        
        return {
            "success": True,
            "message": "Thank you for your message! We'll get back to you soon."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[RECORDS] Contact form error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process contact form: {str(e)}")


@router.get("/bookings")
async def get_bookings():
    try:
        print(f"[RECORDS] Fetching all bookings")
        bookings = await db.select("bookings")
        print(f"[RECORDS] Found {len(bookings)} bookings")
        return bookings
    except Exception as e:
        print(f"[RECORDS] Get bookings error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch bookings: {str(e)}")

@router.post("/inquiries")
async def create_inquiry(inquiry: InquiryRequest):
    try:
        print(f"[RECORDS] Creating inquiry for property: {inquiry.property_id}")
        print(f"[RECORDS] Inquiry data: {inquiry.model_dump()}")
        
        inquiry_data = {
            "id": str(uuid.uuid4()),
            "property_id": inquiry.property_id,
            "name": inquiry.name,
            "email": inquiry.email,
            "phone": inquiry.phone,
            "message": inquiry.message,
            "inquiry_type": inquiry.inquiry_type,
            "status": "new",
            "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
            "updated_at": dt.datetime.now(dt.timezone.utc).isoformat()
        }
        
        print(f"[RECORDS] Prepared inquiry data: {inquiry_data}")
        created = await db.insert("inquiries", inquiry_data)
        print(f"[RECORDS] Inquiry created successfully: {created}")
        
        # Get property details to find the owner/agent
        property_details = None
        try:
            properties = await db.select("properties", filters={"id": inquiry.property_id})
            if properties:
                property_details = properties[0]
                # Assign agent to inquiry if property has an agent
                if property_details.get("agent_id"):
                    inquiry_data["agent_id"] = property_details["agent_id"]
        except Exception as prop_error:
            print(f"[RECORDS] Error fetching property details: {prop_error}")
        
        # Auto-assign agent based on property
        try:
            from ..services.agent_assignment import AgentAssignmentService
            inquiry_id = created[0]["id"] if created and len(created) > 0 else inquiry_data["id"]
            assignment_result = await AgentAssignmentService.assign_agent_to_inquiry(inquiry_id, inquiry.property_id)
            if assignment_result.get('success'):
                print(f"[RECORDS] Agent assigned to inquiry: {assignment_result.get('message')}")
            else:
                print(f"[RECORDS] Agent assignment failed: {assignment_result.get('error')}")
        except Exception as assignment_error:
            print(f"[RECORDS] Agent assignment error: {assignment_error}")
        
        # Send email notifications
        try:
            # Send to admin
            subject_admin, html_admin = inquiry_email(True, inquiry.name or "", property_details, inquiry.property_id)
            await send_email("info@homeandown.com", subject_admin, html_admin)
            
            # Send to property owner/agent if available
            recipients = []
            if property_details:
                if property_details.get("owner_id"):
                    recipients.append(property_details["owner_id"])
                if property_details.get("agent_id"):
                    recipients.append(property_details["agent_id"])
            
            for recipient_id in recipients:
                try:
                    # Get recipient details
                    users = await db.select("users", filters={"id": recipient_id})
                    if users and users[0].get("email"):
                        recipient_email = users[0]["email"]
                        recipient_name = f"{users[0].get('first_name', '')} {users[0].get('last_name', '')}".strip()
                        subject_recipient, html_recipient = inquiry_email(True, inquiry.name or "", property_details, inquiry.property_id, is_owner=True)
                        await send_email(recipient_email, subject_recipient, html_recipient)
                        print(f"[RECORDS] ✅ Sent inquiry notification to {recipient_name}: {recipient_email}")
                except Exception as recipient_error:
                    print(f"[RECORDS] Error sending email to recipient {recipient_id}: {recipient_error}")
            
            # Send confirmation to user
            if inquiry.email:
                subject_user, html_user = inquiry_email(False, inquiry.name or "", property_details, inquiry.property_id)
                await send_email(inquiry.email, subject_user, html_user)
        except Exception as email_error:
            print(f"[RECORDS] Email notification error: {email_error}")
        
        # Get additional details for response
        response_data = {
            "success": True,
            "id": created[0]["id"] if created else inquiry_data["id"],
            "property_name": property_details.get("title", f"Property #{inquiry.property_id}") if property_details else f"Property #{inquiry.property_id}",
            "agent_name": None,
            "agent_email": None
        }
        
        # Get agent details if assigned
        if inquiry_data.get("agent_id"):
            try:
                agent_users = await db.select("users", filters={"id": inquiry_data["agent_id"]})
                if agent_users:
                    agent = agent_users[0]
                    response_data["agent_name"] = f"{agent.get('first_name', '')} {agent.get('last_name', '')}".strip()
                    response_data["agent_email"] = agent.get("email")
            except Exception as agent_error:
                print(f"[RECORDS] Error fetching agent details: {agent_error}")
        
        print("[RECORDS] Inquiry created successfully")
        return response_data
        
    except Exception as e:
        print(f"[RECORDS] Create inquiry error: {e}")
        import traceback
        print(f"[RECORDS] Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to create inquiry: {str(e)}")

@router.post("/bookings")
async def create_booking(booking_data: dict, request: Request):
    try:
        print(f"[RECORDS] Creating booking for property: {booking_data.get('property_id')}")
        print(f"[RECORDS] Received booking data: {booking_data}")
        
        # Validate required fields
        required_fields = ['property_id', 'name', 'email', 'booking_date', 'booking_time']
        missing_fields = []
        
        for field in required_fields:
            if not booking_data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            print(f"[RECORDS] Missing required fields: {missing_fields}")
            raise HTTPException(status_code=400, detail=f"Missing required fields: {', '.join(missing_fields)}")
        
        # Handle preferred_time field (frontend sends this instead of booking_time)
        if 'preferred_time' in booking_data and not booking_data.get('booking_time'):
            booking_data['booking_time'] = booking_data['preferred_time']
            print(f"[RECORDS] Mapped preferred_time to booking_time: {booking_data['booking_time']}")
        
        # Try to get user_id from authentication if available
        user_id = None
        try:
            # Check if there's an Authorization header
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                # Decode JWT token to get user_id
                from ..core.security import decode_jwt_token
                payload = decode_jwt_token(token)
                if payload and "user_id" in payload:
                    user_id = payload["user_id"]
                    print(f"[RECORDS] Found authenticated user: {user_id}")
        except Exception as auth_error:
            print(f"[RECORDS] No authentication found, creating anonymous booking: {auth_error}")
        
        # If no user_id, check if user exists by email, otherwise create a temporary user record for anonymous bookings
        if not user_id:
            try:
                # Check if user already exists with this email
                existing_users = await db.select("users", filters={"email": booking_data['email']})
                if existing_users:
                    user_id = existing_users[0]["id"]
                    print(f"[RECORDS] Found existing user for email: {booking_data['email']}")
                else:
                    # Create a temporary user record for anonymous bookings
                    temp_user_data = {
                        "id": str(uuid.uuid4()),
                        "email": booking_data['email'],
                        "first_name": booking_data['name'].split()[0] if booking_data['name'] else "Guest",
                        "last_name": " ".join(booking_data['name'].split()[1:]) if booking_data['name'] and len(booking_data['name'].split()) > 1 else "",
                        "user_type": "buyer",
                        "status": "active",
                        "verification_status": "verified",
                        "email_verified": False,
                        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
                        "updated_at": dt.datetime.now(dt.timezone.utc).isoformat()
                    }
                    
                    temp_user = await db.insert("users", temp_user_data)
                    user_id = temp_user_data["id"]
                    print(f"[RECORDS] Created temporary user for anonymous booking: {user_id}")
            except Exception as user_error:
                print(f"[RECORDS] Failed to handle user creation/lookup: {user_error}")
                # Fallback: use a default UUID
                user_id = "00000000-0000-0000-0000-000000000000"
        
        booking_record = {
            "id": str(uuid.uuid4()),
            "property_id": booking_data['property_id'],
            "user_id": user_id,
            "name": booking_data['name'],
            "email": booking_data['email'],
            "phone": booking_data.get('phone', ''),
            "booking_date": booking_data['booking_date'],
            "booking_time": booking_data['booking_time'],
            "notes": booking_data.get('notes', ''),
            "status": "pending",
            "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
            "updated_at": dt.datetime.now(dt.timezone.utc).isoformat()
        }
        
        created = await db.insert("bookings", booking_record)
        
        # Get property details to find the owner/agent
        property_details = None
        try:
            properties = await db.select("properties", filters={"id": booking_data['property_id']})
            if properties:
                property_details = properties[0]
                # Assign agent to booking if property has an agent
                if property_details.get("agent_id"):
                    booking_record["agent_id"] = property_details["agent_id"]
        except Exception as prop_error:
            print(f"[RECORDS] Error fetching property details: {prop_error}")
        
        # Send email notifications
        try:
            from ..services.email import send_email
            from ..services.templates import booking_confirmation_email, booking_notification_email
            
            if property_details:
                property_title = property_details.get('title', 'Property')
                booker_name = booking_data['name'] or "Guest User"
                booker_email = booking_data['email'] or "guest@example.com"
                
                # Send confirmation email to booker
                confirmation_html = booking_confirmation_email(
                    booker_name,
                    property_title,
                    booking_data['booking_date'],
                    booking_data['booking_time']
                )
                await send_email(
                    to=booker_email,
                    subject="Tour Booking Confirmed - Home & Own",
                    html=confirmation_html
                )
                print(f"[RECORDS] Confirmation email sent to: {booker_email}")
                
                # Send notification email to property owner
                owner_data = await db.select("users", filters={"id": property_details.get('owner_id')})
                if owner_data:
                    owner_info = owner_data[0]
                    owner_name = f"{owner_info.get('first_name', '')} {owner_info.get('last_name', '')}".strip()
                    owner_email = owner_info.get('email')
                    
                    if owner_email:
                        notification_html = booking_notification_email(
                            owner_name,
                            booker_name,
                            booker_email,
                            property_title,
                            booking_data['booking_date'],
                            booking_data['booking_time']
                        )
                        await send_email(
                            to=owner_email,
                            subject=f"New Tour Booking for {property_title} - Home & Own",
                            html=notification_html
                        )
                        print(f"[RECORDS] Notification email sent to property owner: {owner_email}")
        except Exception as email_error:
            print(f"[RECORDS] Email sending failed: {email_error}")
            # Don't fail the booking creation if email fails
        
        # Get additional details for response
        response_data = {
            "success": True,
            "id": created[0]["id"] if created else booking_record["id"],
            "property_name": property_details.get("title", f"Property #{booking_data['property_id']}") if property_details else f"Property #{booking_data['property_id']}",
            "agent_name": None,
            "agent_email": None
        }
        
        # Get agent details if assigned
        if booking_record.get("agent_id"):
            try:
                agent_users = await db.select("users", filters={"id": booking_record["agent_id"]})
                if agent_users:
                    agent = agent_users[0]
                    response_data["agent_name"] = f"{agent.get('first_name', '')} {agent.get('last_name', '')}".strip()
                    response_data["agent_email"] = agent.get("email")
            except Exception as agent_error:
                print(f"[RECORDS] Error fetching agent details: {agent_error}")
        
        print("[RECORDS] Booking created successfully")
        return response_data
        
    except Exception as e:
        print(f"[RECORDS] Create booking error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create booking")

@router.post("/properties")
async def create_property(prop: dict, _=Depends(require_api_key)):
    import time
    try:
        title = getattr(prop, 'title', '<no-title>')
        print(f"[RECORDS] Creating property: {title}")
        start_ts = time.perf_counter()

        property_data = {
            "id": str(uuid.uuid4()),
            "title": getattr(prop, 'title', '') if getattr(prop, 'title', None) is not None else '',
            "description": getattr(prop, 'description', ''),
            "price": getattr(prop, 'price', None),
            "monthly_rent": getattr(prop, 'monthly_rent', None),
            "security_deposit": getattr(prop, 'security_deposit', None),
            "property_type": getattr(prop, 'property_type', ''),
            "bedrooms": getattr(prop, 'bedrooms', None),
            "bathrooms": getattr(prop, 'bathrooms', None),
            "area_sqft": getattr(prop, 'area_sqft', None),
            "address": getattr(prop, 'address', ''),
            # Accept either name or id fields from frontend
            "city": getattr(prop, 'city', None),
            "state": getattr(prop, 'state', None),
            "state_id": getattr(prop, 'state_id', None),
            "district_id": getattr(prop, 'district_id', None),
            "mandal_id": getattr(prop, 'mandal_id', None),
            "zip_code": getattr(prop, 'zip_code', ''),
            "latitude": getattr(prop, 'latitude', None),
            "longitude": getattr(prop, 'longitude', None),
            "listing_type": getattr(prop, 'listing_type', ''),
            "furnishing_status": getattr(prop, 'furnishing_status', None),
            "available_from": getattr(prop, 'available_from', None),
            "status": "active",
            "featured": False,
            "verified": False,
            "amenities": getattr(prop, 'amenities', []) or [],
            "images": getattr(prop, 'images', []) or [],
            "created_at": dt.datetime.now(dt.timezone.utc).isoformat()
        }

        # Diagnostic: which client and service-role validity
        try:
            print(f"[RECORDS] DB admin_client present: {bool(getattr(db, 'admin_client', None))}")
            print(f"[RECORDS] Supabase service-role probe valid: {getattr(db, '_service_role_valid', None)}")
        except Exception:
            pass

        created = None
        insert_err = None
        try:
            created = await db.insert("properties", property_data)
            print(f"[RECORDS] db.insert returned rows: {len(created) if created else 0}")
        except Exception as e:
            insert_err = e
            print(f"[RECORDS] db.insert exception: {e}")

        elapsed = time.perf_counter() - start_ts
        print(f"[RECORDS] Insert elapsed time: {elapsed:.3f}s")

        # Send notification (best-effort)
        try:
            subject, html = notify_info("New property created", [f"Title: {title}", f"City: {getattr(prop,'city', '')}"])
            await send_email("info@homeandown.com", subject, html)
        except Exception as email_error:
            print(f"[RECORDS] Notification email error: {email_error}")

        if insert_err:
            # Fail fast and return a clear error to the client — avoids confusing optimistic success
            print(f"[RECORDS] Insert failed: {insert_err}")
            raise HTTPException(status_code=502, detail={
                "message": "Database insert failed",
                "hint": str(insert_err)
            })

        # Persist any provided sections (if sent by frontend)
        try:
            sections = getattr(prop, 'sections', None) or []
            if sections and created:
                # created can be a list with inserted row
                created_id = created[0]["id"] if isinstance(created, list) and created else property_data["id"]
                to_insert = []
                for idx, s in enumerate(sections):
                    to_insert.append({
                        "id": str(uuid.uuid4()),
                        "property_id": created_id,
                        "title": s.get('title') or '',
                        "content": s.get('content') or '',
                        "sort_order": idx,
                        "created_at": dt.datetime.now(dt.timezone.utc).isoformat()
                    })
                if to_insert:
                    await db.insert("property_sections", to_insert[0] if len(to_insert) == 1 else to_insert)
                    print(f"[RECORDS] ✅ Inserted {len(to_insert)} sections for property {created_id}")
        except Exception as sec_err:
            print(f"[RECORDS] ⚠️ Failed to persist sections: {sec_err}")

        print("[RECORDS] Property created successfully")
        return {"success": True, "id": created[0]["id"] if created else property_data["id"], "created_rows": created or []}

    except Exception as e:
        print(f"[RECORDS] Create property error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create property")


@router.get("/inquiries")
async def list_user_inquiries(user_id: str | None = None, property_id: str | None = None):
    try:
        print(f"[RECORDS] Fetching inquiries user_id={user_id} property_id={property_id}")
        filters = {}
        if user_id:
            filters["user_id"] = user_id
        if property_id:
            filters["property_id"] = property_id

        inquiries = await db.select("inquiries") if not filters else await db.select("inquiries", filters=filters)
        return inquiries or []
    except Exception as e:
        print(f"[RECORDS] List user inquiries error: {e}")
        raise HTTPException(status_code=500, detail="Failed to list inquiries")


@router.put("/bookings/{booking_id}")
async def update_booking(booking_id: str, update: BookingUpdateRequest):
    try:
        print(f"[RECORDS] Updating booking {booking_id} to status: {update.status}")

        # Get current booking
        bookings = await db.select("bookings", filters={"id": booking_id})
        if not bookings:
            raise HTTPException(status_code=404, detail="Booking not found")

        booking = bookings[0]
        update_data = {
            "status": update.status,
            "updated_at": dt.datetime.now(dt.timezone.utc).isoformat()
        }

        # Note: Database doesn't have status-specific timestamp fields
        # We'll just update the status and updated_at timestamp

        # Add agent notes if provided (store in notes field since agent_notes doesn't exist in DB)
        if update.agent_notes:
            update_data["notes"] = update.agent_notes

        # Update booking date/time if provided
        if update.booking_date:
            update_data["booking_date"] = update.booking_date
        if update.booking_time:
            update_data["booking_time"] = update.booking_time

        await db.update("bookings", update_data, filters={"id": booking_id})

        # Send email notifications
        property_details = None
        try:
            # Get property details
            properties = await db.select("properties", filters={"id": booking.get("property_id")})
            property_details = properties[0] if properties else None

            # Get customer details from user_id
            customer = None
            if booking.get("user_id"):
                users = await db.select("users", filters={"id": booking.get("user_id")})
                customer = users[0] if users else None

            # Send status update email to customer if we have their email
            if customer and customer.get("email"):
                subject, html = booking_status_email(
                    booking, property_details, update.status, update.agent_notes
                )
                await send_email(customer.get("email"), subject, html)

            # Send notification to agent if status changed
            if booking.get("agent_id"):
                agent_users = await db.select("users", filters={"id": booking.get("agent_id")})
                if agent_users and agent_users[0].get("email"):
                    agent_email = agent_users[0]["email"]
                    agent_subject, agent_html = booking_status_email(
                        booking, property_details, update.status, update.agent_notes, is_agent=True
                    )
                    await send_email(agent_email, agent_subject, agent_html)

        except Exception as email_error:
            print(f"[RECORDS] Email notification error: {email_error}")

        # Enhanced response with names
        customer_name = "Unknown"
        if customer:
            customer_name = f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip() or customer.get('email', 'Unknown')
        
        response_data = {
            "success": True,
            "message": f"Booking {update.status}",
            "booking_id": booking_id,
            "customer_name": customer_name,
            "property_name": property_details.get("title", f"Property #{booking.get('property_id')}") if property_details else f"Property #{booking.get('property_id')}",
            "agent_name": None
        }
        
        # Add agent name if assigned
        if booking.get("agent_id"):
            try:
                agent_users = await db.select("users", filters={"id": booking.get("agent_id")})
                if agent_users:
                    agent = agent_users[0]
                    response_data["agent_name"] = f"{agent.get('first_name', '')} {agent.get('last_name', '')}".strip()
            except Exception as agent_error:
                print(f"[RECORDS] Error fetching agent details: {agent_error}")
        
        return response_data
    except Exception as e:
        print(f"[RECORDS] Update booking error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update booking")


@router.put("/inquiries/{inquiry_id}")
async def update_inquiry(inquiry_id: str, update: InquiryUpdateRequest):
    try:
        print(f"[RECORDS] Updating inquiry {inquiry_id} to status: {update.status}")

        # Get current inquiry
        inquiries = await db.select("inquiries", filters={"id": inquiry_id})
        if not inquiries:
            raise HTTPException(status_code=404, detail="Inquiry not found")

        inquiry = inquiries[0]
        update_data = {
            "status": update.status,
            "updated_at": dt.datetime.now(dt.timezone.utc).isoformat()
        }

        # Add status-specific timestamps
        if update.status == "contacted":
            update_data["contacted_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
        elif update.status == "confirmed":
            update_data["confirmed_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
        elif update.status == "cancelled":
            update_data["cancelled_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
        elif update.status == "completed":
            update_data["completed_at"] = dt.datetime.now(dt.timezone.utc).isoformat()

        # Add agent notes if provided
        if update.agent_notes:
            update_data["agent_notes"] = update.agent_notes

        await db.update("inquiries", update_data, filters={"id": inquiry_id})

        # Send email notifications
        property_details = None
        try:
            # Get property details
            properties = await db.select("properties", filters={"id": inquiry.get("property_id")})
            property_details = properties[0] if properties else None

            # Send status update email to customer
            subject, html = inquiry_status_email(
                inquiry, property_details, update.status, update.agent_notes
            )
            await send_email(inquiry.get("email"), subject, html)

            # Send notification to agent if status changed
            if inquiry.get("agent_id"):
                agent_users = await db.select("users", filters={"id": inquiry.get("agent_id")})
                if agent_users and agent_users[0].get("email"):
                    agent_email = agent_users[0]["email"]
                    agent_subject, agent_html = inquiry_status_email(
                        inquiry, property_details, update.status, update.agent_notes, is_agent=True
                    )
                    await send_email(agent_email, agent_subject, agent_html)

        except Exception as email_error:
            print(f"[RECORDS] Email notification error: {email_error}")

        # Enhanced response with names
        response_data = {
            "success": True,
            "message": f"Inquiry {update.status}",
            "inquiry_id": inquiry_id,
            "customer_name": inquiry.get("name", "Unknown"),
            "property_name": property_details.get("title", f"Property #{inquiry.get('property_id')}") if property_details else f"Property #{inquiry.get('property_id')}",
            "agent_name": None
        }
        
        # Add agent name if assigned
        if inquiry.get("agent_id"):
            try:
                agent_users = await db.select("users", filters={"id": inquiry.get("agent_id")})
                if agent_users:
                    agent = agent_users[0]
                    response_data["agent_name"] = f"{agent.get('first_name', '')} {agent.get('last_name', '')}".strip()
            except Exception as agent_error:
                print(f"[RECORDS] Error fetching agent details: {agent_error}")
        
        return response_data
    except Exception as e:
        print(f"[RECORDS] Update inquiry error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update inquiry")


@router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str, _=Depends(require_api_key)):
    """Delete a booking (hard delete)"""
    try:
        print(f"[RECORDS] Deleting booking: {booking_id}")
        
        # Check if booking exists
        bookings = await db.select("bookings", filters={"id": booking_id})
        if not bookings:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Delete booking
        await db.delete("bookings", {"id": booking_id})
        
        print(f"[RECORDS] Booking deleted successfully: {booking_id}")
        return {"success": True, "message": "Booking deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[RECORDS] Delete booking error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete booking: {str(e)}")


@router.delete("/inquiries/{inquiry_id}")
async def delete_inquiry(inquiry_id: str, _=Depends(require_api_key)):
    """Delete an inquiry (hard delete)"""
    try:
        print(f"[RECORDS] Deleting inquiry: {inquiry_id}")
        
        # Check if inquiry exists
        inquiries = await db.select("inquiries", filters={"id": inquiry_id})
        if not inquiries:
            raise HTTPException(status_code=404, detail="Inquiry not found")
        
        # Delete inquiry
        await db.delete("inquiries", {"id": inquiry_id})
        
        print(f"[RECORDS] Inquiry deleted successfully: {inquiry_id}")
        return {"success": True, "message": "Inquiry deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[RECORDS] Delete inquiry error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete inquiry: {str(e)}")


@router.get("/notifications")
async def get_user_notifications(user_id: str, read: bool | None = None):
    """Get notifications for a specific user"""
    try:
        print(f"[RECORDS] Fetching notifications for user: {user_id}")
        
        filters = {"user_id": user_id}
        if read is not None:
            filters["read"] = read
        
        notifications = await db.select("notifications", filters=filters)
        
        # Sort by created_at descending (newest first)
        if notifications:
            notifications.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return notifications or []
        
    except Exception as e:
        print(f"[RECORDS] Get notifications error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")


@router.post("/notifications/{notification_id}/mark-read")
async def mark_notification_read(notification_id: str, user_id: str):
    """Mark a notification as read for a specific user"""
    try:
        print(f"[RECORDS] Marking notification as read: {notification_id} for user: {user_id}")
        
        # Verify the notification belongs to the user
        notifications = await db.select("notifications", filters={"id": notification_id, "user_id": user_id})
        if not notifications:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        await db.update("notifications", {
            "read": True,
            "updated_at": dt.datetime.now(dt.timezone.utc).isoformat()
        }, {"id": notification_id})
        
        return {"success": True, "message": "Notification marked as read"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[RECORDS] Mark notification read error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to mark notification as read: {str(e)}")


@router.post("/notifications/mark-all-read")
async def mark_all_notifications_read(user_id: str):
    """Mark all notifications as read for a specific user"""
    try:
        print(f"[RECORDS] Marking all notifications as read for user: {user_id}")
        
        await db.update("notifications", {
            "read": True,
            "updated_at": dt.datetime.now(dt.timezone.utc).isoformat()
        }, {"user_id": user_id, "read": False})
        
        return {"success": True, "message": "All notifications marked as read"}
        
    except Exception as e:
        print(f"[RECORDS] Mark all notifications read error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to mark all notifications as read: {str(e)}")


@router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, user_id: str):
    """Delete a notification for a specific user"""
    try:
        print(f"[RECORDS] Deleting notification: {notification_id} for user: {user_id}")
        
        # Verify the notification belongs to the user
        notifications = await db.select("notifications", filters={"id": notification_id, "user_id": user_id})
        if not notifications:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        await db.delete("notifications", {"id": notification_id})
        
        return {"success": True, "message": "Notification deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[RECORDS] Delete notification error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete notification: {str(e)}")
