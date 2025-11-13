# Automated Testing Script

## Pre-Testing Setup
1. Ensure backend is running on http://127.0.0.1:8000
2. Ensure frontend is running
3. Check environment variables are set
4. Database is accessible

## Test Execution Order

### Phase 1: Authentication & User Management
### Phase 2: Buyer Features
### Phase 3: Seller Features
### Phase 4: Agent Features
### Phase 5: Admin Features
### Phase 6: Common Features
### Phase 7: Error Handling

---

## CRITICAL BUTTONS & ACTIONS TO TEST

### Authentication
- [ ] Sign Up Button (Buyer/Seller/Agent)
- [ ] Sign In Button
- [ ] Forgot Password Button
- [ ] Reset Password Button
- [ ] Logout Button
- [ ] Resend Verification Button

### Buyer Dashboard
- [ ] Tab Navigation (Overview/Saved/Inquiries/Bookings)
- [ ] Filter Dropdown (All/Sale/Rent)
- [ ] Remove from Favorites Button
- [ ] Cancel Booking Button
- [ ] Reschedule Booking Button
- [ ] View Property Button

### Seller Dashboard
- [ ] Tab Navigation (Overview/Properties/Inquiries/Bookings)
- [ ] Add Property Button
- [ ] Manage Property Button
- [ ] Delete Property Button
- [ ] Edit Property Button
- [ ] Filter Properties

### Agent Dashboard
- [ ] Accept Assignment Button
- [ ] Reject Assignment Button
- [ ] View Property Button
- [ ] Contact Customer Button
- [ ] Update Booking Status

### Admin Dashboard
- [ ] All Tab Buttons
- [ ] Edit User Button
- [ ] Save User Changes Button
- [ ] Approve User Button
- [ ] Reject User Button
- [ ] Edit Property Button
- [ ] Approve Property Button
- [ ] Reject Property Button
- [ ] Assign Agent Button
- [ ] Edit Booking Button
- [ ] Assign Agent to Booking
- [ ] View Details Buttons
- [ ] Delete Buttons

### Property Forms
- [ ] Save Property Button
- [ ] Cancel Button
- [ ] Image Upload
- [ ] Location Selector
- [ ] Area Unit Selection
- [ ] Property Type Selection

### Profile Pages
- [ ] Edit Profile Button
- [ ] Save Changes Button
- [ ] Cancel Button
- [ ] Upload Image Button
- [ ] Role Request Button

---

## API ENDPOINT VERIFICATION

### Authentication Endpoints
- [ ] POST /api/auth/signup
- [ ] POST /api/auth/login
- [ ] POST /api/auth/forgot-password
- [ ] POST /api/auth/reset-password
- [ ] GET /api/auth/me
- [ ] POST /api/auth/logout

### Buyer Endpoints
- [ ] GET /api/buyer/dashboard/stats
- [ ] GET /api/buyer/saved-properties
- [ ] GET /api/buyer/inquiries
- [ ] GET /api/buyer/bookings
- [ ] POST /api/buyer/bookings/{id}/cancel

### Seller Endpoints
- [ ] GET /api/seller/dashboard/stats
- [ ] GET /api/seller/properties
- [ ] GET /api/seller/inquiries
- [ ] GET /api/seller/bookings

### Agent Endpoints
- [ ] GET /api/agent/dashboard/stats
- [ ] GET /api/agent/properties
- [ ] GET /api/agent/inquiries
- [ ] GET /api/agent/bookings
- [ ] POST /api/agent/property-assignments/{id}/accept
- [ ] POST /api/agent/property-assignments/{id}/reject

### Admin Endpoints
- [ ] GET /api/admin/stats
- [ ] GET /api/admin/users
- [ ] GET /api/admin/properties
- [ ] GET /api/admin/bookings
- [ ] GET /api/admin/inquiries
- [ ] PUT /api/admin/users/{id}
- [ ] PATCH /api/admin/users/{id}
- [ ] GET /api/admin/commissions/summary
- [ ] GET /api/admin/commission-payments
- [ ] GET /api/admin/agents/earnings

### Property Endpoints
- [ ] GET /api/properties
- [ ] POST /api/properties
- [ ] PUT /api/properties/{id}
- [ ] DELETE /api/properties/{id}

### Booking Endpoints
- [ ] GET /api/records/bookings
- [ ] POST /api/records/bookings
- [ ] PUT /api/records/bookings/{id}
- [ ] DELETE /api/records/bookings/{id}

---

## FORM VALIDATION TESTS

### Sign Up Form
- [ ] Required fields validation
- [ ] Email format validation
- [ ] Password strength validation
- [ ] Phone number validation

### Property Form
- [ ] Required fields validation
- [ ] Price validation (numbers only)
- [ ] Date format validation
- [ ] UUID validation for owner_id
- [ ] Image upload validation

### Profile Form
- [ ] Required fields validation
- [ ] Email format validation
- [ ] Date format validation
- [ ] Password confirmation

### Booking Form
- [ ] Required fields validation
- [ ] Date validation
- [ ] Time validation
- [ ] Property selection validation

---

## ERROR HANDLING TESTS

### Network Errors
- [ ] Backend offline - graceful error message
- [ ] 404 errors - proper error display
- [ ] 401 errors - redirect to login
- [ ] 500 errors - user-friendly message

### Form Errors
- [ ] Validation errors display
- [ ] API errors display
- [ ] Success messages display
- [ ] Loading states work

### Data Errors
- [ ] Empty states display
- [ ] No data messages
- [ ] Null/undefined handling

---

## INTEGRATION TESTS

### User Flow: Buyer
1. Sign up → Email verification → Login → Browse properties → Save property → Make inquiry → Book tour → Cancel booking

### User Flow: Seller
1. Sign up → Email verification → Login → Add property → Property approval → View inquiries → View bookings

### User Flow: Agent
1. Sign up → Email verification → Admin approval → Login → View assignments → Accept assignment → View properties → View bookings

### User Flow: Admin
1. Login → View dashboard → Approve user → Approve property → Assign agent → View bookings → Edit booking → View reports

---

## PERFORMANCE TESTS

- [ ] Page load times < 3 seconds
- [ ] API response times < 2 seconds
- [ ] Image loading optimization
- [ ] No memory leaks
- [ ] Smooth scrolling
- [ ] No console errors

---

## BROWSER COMPATIBILITY

- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari (if applicable)

---

## MOBILE RESPONSIVENESS

- [ ] Mobile view (< 768px)
- [ ] Tablet view (768px - 1024px)
- [ ] Desktop view (> 1024px)
- [ ] Touch interactions work
- [ ] Forms are usable on mobile

---

## SECURITY TESTS

- [ ] JWT tokens work
- [ ] API keys are secure
- [ ] Password hashing
- [ ] XSS protection
- [ ] CSRF protection
- [ ] SQL injection protection

---

## ACCESSIBILITY TESTS

- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast
- [ ] Focus indicators
- [ ] Alt text for images

