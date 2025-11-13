# API Quick Reference Guide
## For Mobile App Development

This is a quick reference guide for the most commonly used API endpoints in the HomeAndOwn platform.

---

## Base URL
```
Development: http://127.0.0.1:8000
Production: [Your Production URL]
```

---

## Authentication Endpoints

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_type": "buyer",
    ...
  }
}
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "user_type": "buyer",
  "phone_number": "+1234567890"
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {access_token}
```

### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com",
  "user_type": "buyer"
}
```

### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "password": "new_password",
  "confirm_password": "new_password"
}
```

---

## Property Endpoints

### List Properties
```http
GET /api/properties?city=Hyderabad&property_type=villa&min_price=1000000&max_price=5000000
```

**Query Parameters:**
- `city`, `state`, `mandal` (location)
- `property_type` (villa, apartment, commercial, land, plot, etc.)
- `listing_type` (SALE, RENT)
- `min_price`, `max_price` (for sale)
- `min_rent`, `max_rent` (for rent)
- `bedrooms`, `bathrooms` (numbers)
- `featured` (true/false)

### Get Property Details
```http
GET /api/properties/{property_id}
```

### Create Property (Seller/Admin)
```http
POST /api/properties
Authorization: Bearer {access_token}
X-API-Key: {api_key}
Content-Type: application/json

{
  "title": "Beautiful Villa",
  "description": "Spacious 3BHK villa",
  "property_type": "villa",
  "listing_type": "SALE",
  "price": 5000000,
  "area_sqft": 2000,
  "area_sqyd": 222.22,
  "area_acres": 0.0459,
  "area_unit": "sqft",
  "bedrooms": 3,
  "bathrooms": 2,
  "address": "123 Main St",
  "city": "Hyderabad",
  "state": "Telangana",
  "zip_code": "500001",
  "latitude": 17.3850,
  "longitude": 78.4867,
  "images": ["url1", "url2"],
  "amenities": ["parking", "lift"]
}
```

### Update Property
```http
PUT /api/properties/{property_id}
Authorization: Bearer {access_token}
X-API-Key: {api_key}
Content-Type: application/json

{ ... property data ... }
```

---

## Booking Endpoints

### List Bookings
```http
GET /api/records/bookings?user_id={user_id}&property_id={property_id}
Authorization: Bearer {access_token}
```

### Create Booking
```http
POST /api/records/bookings
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "property_id": "uuid",
  "booking_date": "2025-01-20",
  "booking_time": "14:00:00",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "notes": "Optional notes"
}
```

### Update Booking
```http
PUT /api/records/bookings/{booking_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "status": "confirmed",
  "agent_id": "uuid",
  "booking_date": "2025-01-21",
  "booking_time": "15:00:00"
}
```

### Cancel Booking (Buyer)
```http
POST /api/buyer/bookings/{booking_id}/cancel
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "reason": "Cancellation reason"
}
```

---

## Inquiry Endpoints

### Create Inquiry
```http
POST /api/records/inquiries
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "property_id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "I'm interested in this property"
}
```

### List Inquiries (Buyer)
```http
GET /api/buyer/inquiries
Authorization: Bearer {access_token}
```

### List Inquiries (Seller)
```http
GET /api/seller/inquiries
Authorization: Bearer {access_token}
```

### List Inquiries (Agent)
```http
GET /api/agent/inquiries
Authorization: Bearer {access_token}
```

---

## Agent Endpoints

### Dashboard Stats
```http
GET /api/agent/dashboard/stats
Authorization: Bearer {access_token}

Response:
{
  "total_properties": 10,
  "total_inquiries": 5,
  "total_bookings": 3,
  "pending_assignments": 2
}
```

### Assigned Properties
```http
GET /api/agent/properties
Authorization: Bearer {access_token}
```

### Agent Bookings
```http
GET /api/agent/bookings
Authorization: Bearer {access_token}
```

### Accept Property Assignment
```http
POST /api/agent/property-assignments/{notification_id}/accept
Authorization: Bearer {access_token}
```

### Reject Property Assignment
```http
POST /api/agent/property-assignments/{notification_id}/reject
Authorization: Bearer {access_token}
```

---

## Seller Endpoints

### Dashboard Stats
```http
GET /api/seller/dashboard/stats
Authorization: Bearer {access_token}
```

### My Properties
```http
GET /api/seller/properties
Authorization: Bearer {access_token}
```

### Seller Inquiries
```http
GET /api/seller/inquiries
Authorization: Bearer {access_token}
```

### Seller Bookings
```http
GET /api/seller/bookings
Authorization: Bearer {access_token}
```

---

## Buyer Endpoints

### Dashboard Stats
```http
GET /api/buyer/dashboard/stats
Authorization: Bearer {access_token}
```

### Saved Properties
```http
GET /api/buyer/saved-properties
Authorization: Bearer {access_token}
```

### Save Property
```http
POST /api/buyer/saved-properties
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "property_id": "uuid"
}
```

### Remove Saved Property
```http
DELETE /api/buyer/saved-properties/{property_id}
Authorization: Bearer {access_token}
```

---

## Admin Endpoints

### List Users
```http
GET /api/admin/users?user_type=agent&status=active
Authorization: Bearer {access_token}
X-API-Key: {api_key}
```

### Update User
```http
PUT /api/admin/users/{user_id}
Authorization: Bearer {access_token}
X-API-Key: {api_key}
Content-Type: application/json

{
  "status": "active",
  "verification_status": "verified"
}
```

### Approve User
```http
POST /api/admin/users/{user_id}/approve
Authorization: Bearer {access_token}
X-API-Key: {api_key}
```

### List All Properties
```http
GET /api/admin/properties
Authorization: Bearer {access_token}
X-API-Key: {api_key}
```

### Approve Property
```http
POST /api/admin/properties/{property_id}/approve
Authorization: Bearer {access_token}
X-API-Key: {api_key}
```

### Assign Agent to Property
```http
PUT /api/admin/properties/{property_id}
Authorization: Bearer {access_token}
X-API-Key: {api_key}
Content-Type: application/json

{
  "assigned_agent_id": "agent_uuid"
}
```

### Commission Summary
```http
GET /api/admin/commissions/summary
Authorization: Bearer {access_token}
X-API-Key: {api_key}
```

### Agent Earnings
```http
GET /api/admin/agents/earnings
Authorization: Bearer {access_token}
X-API-Key: {api_key}
```

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "detail": "Error message here"
}
```

### List Response
```json
[
  { ... item 1 ... },
  { ... item 2 ... },
  ...
]
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Important Notes

1. **Always include Authorization header** for protected endpoints:
   ```
   Authorization: Bearer {access_token}
   ```

2. **Include X-API-Key header** for admin endpoints:
   ```
   X-API-Key: {api_key}
   ```

3. **Area Unit Display:** Always check `area_unit` field to display area and rate in the correct unit:
   - `area_unit: "sqft"` → Show `area_sqft` and `rate_per_sqft`
   - `area_unit: "sqyd"` → Show `area_sqyd` and `rate_per_sqyd`
   - `area_unit: "acres"` → Show `area_acres` and calculate rate per acre

4. **Token Refresh:** If you get 401, use refresh token to get new access token

5. **Pagination:** Most list endpoints support pagination (check Swagger docs)

---

## Testing

Use Swagger UI for interactive API testing:
```
http://127.0.0.1:8000/docs
```

