# Sequential Agent Assignment System - Implementation Summary

## Overview
This document describes the complete implementation of the sequential agent notification system for property assignments. When an admin approves a property, the system automatically notifies agents in the property's zipcode sequentially, with a 5-minute timeout per agent and up to 3 attempts per agent.

## ✅ Completed Components

### 1. Database Schema (`supabase/migrations/20250130_agent_sequential_notifications.sql`)
- **`agent_property_notifications` table**: Tracks each notification sent to agents
  - Properties: `property_id`, `agent_id`, `notification_round` (1-3), `status`, `sent_at`, `expires_at`, `responded_at`, `response`, `rejection_reason`, `email_sent`, etc.
  
- **`property_assignment_queue` table**: Tracks the overall assignment process
  - Properties: `property_id`, `status`, `current_agent_id`, `current_notification_id`, `current_round`, `agent_list` (JSON), tracking fields
  
- **Helper functions**: `agent_contact_count()`, `get_next_agent_for_notification()`

### 2. Backend Service (`python_api/app/services/sequential_agent_notification.py`)
- `start_property_assignment_queue()`: Initiates the notification process when property is approved
- `_process_queue()`: Background task that processes notifications sequentially
- `_get_next_agent()`: Finds next agent who hasn't been contacted 3 times
- `_send_notification_to_agent()`: Sends email notification to agent
- `_wait_for_response()`: Waits 5 minutes for agent response, checking every 10 seconds
- `accept_assignment()`: Handles agent accepting assignment
- `reject_assignment()`: Handles agent rejecting assignment
- `get_assignment_tracking()`: Returns complete tracking info for admin dashboard
- `_find_agents_by_zipcode()`: Finds agents by zipcode (with city/state fallback)

### 3. Email Templates (`python_api/app/services/templates.py`)
- `get_property_assignment_email()`: Beautiful HTML email template with:
  - Property details (title, type, location, price, bedrooms, bathrooms, area)
  - Clear accept/reject buttons
  - 5-minute timeout warning
  - Benefits of accepting assignment

### 4. API Endpoints

#### Agent Endpoints (`python_api/app/routes/agent_assignments.py`)
- `POST /api/agent/property-assignments/{notification_id}/accept`: Agent accepts assignment
- `POST /api/agent/property-assignments/{notification_id}/reject`: Agent rejects assignment
- `GET /api/agent/property-assignments/{notification_id}`: Get notification details

#### Admin Endpoints (`python_api/app/routes/admin.py`)
- `GET /api/admin/property-assignments/{property_id}/tracking`: Get complete tracking info
- `GET /api/admin/property-assignments/queue`: Get all assignment queues (with filters)
- `GET /api/admin/property-assignments/unassigned`: Get all unassigned properties

### 5. Property Approval Integration (`python_api/app/routes/admin.py`)
- Modified `approve_property()` to automatically trigger `start_property_assignment_queue()` after approval

### 6. Frontend Components
- **`PropertyAssignmentTrackingModal.tsx`**: Admin modal to view complete assignment tracking
  - Shows queue status, current round, notifications sent, agents contacted
  - Lists all eligible agents with attempt counts
  - Displays full notification history with timestamps, responses, rejection reasons
  - Auto-refreshes every 10 seconds
  
- **`PropertyAssignmentManager.tsx`**: Updated with tracking button
  - Added "View Assignment Tracking" button (History icon) for each property

### 7. Frontend API Service (`src/services/pyApi.ts`)
- `AdminApi.getPropertyAssignmentTracking(propertyId)`
- `AdminApi.getAllAssignmentQueues(status?)`
- `AdminApi.getUnassignedProperties()`

## 🔄 Process Flow

1. **Property Approval**:
   - Admin approves property → `approve_property()` endpoint
   - Property status set to `active`, `verified` = `true`
   - `start_property_assignment_queue()` automatically triggered

2. **Queue Initialization**:
   - System finds all agents in property's zipcode (or city/state)
   - Creates `property_assignment_queue` entry with agent list
   - Starts background task `_process_queue()`

3. **Sequential Notification**:
   - For each agent (until someone accepts or all agents exhausted):
     - Find next agent (hasn't been contacted 3 times)
     - Send email notification with 5-minute expiration
     - Wait for response (check every 10 seconds)
     - If agent accepts: Assign property, stop queue
     - If agent rejects/timeout: Move to next agent

4. **Completion**:
   - **Success**: Agent accepts → Property assigned, queue marked `completed`
   - **Failure**: All agents contacted 3 times → Queue marked `expired`, property appears in unassigned list

## 📊 Tracking & Logging

Every action is logged:
- **Notification sent**: Timestamp, agent, round number
- **Email tracking**: Sent status, sent timestamp
- **Responses**: Accepted/rejected with timestamp, rejection reason if any
- **Timeouts**: Automatic timeout after 5 minutes if no response
- **Queue status**: Current agent, current round, total notifications, total agents contacted

## 🎯 Key Features

1. **Sequential Processing**: One agent at a time, 5 minutes each
2. **Retry Logic**: Up to 3 attempts per agent before excluding
3. **Timeout Handling**: Automatic timeout after 5 minutes
4. **Complete Audit Trail**: Every notification, response, and status change is logged
5. **Real-time Tracking**: Admin dashboard shows live status
6. **Email Integration**: Professional email templates with accept/reject links
7. **Location Matching**: Zipcode-first, city/state fallback
8. **Admin Visibility**: Complete tracking in admin panel

## 📝 Notes

### Agent Matching
- Primary: Match by `zip_code` field (if exists in users table)
- Fallback: Match by `city` and `state` if zipcode match fails
- Agents must be: `user_type='agent'`, `status='active'`, `verification_status='verified'`

### Frontend URLs
- Email links currently use: `https://homeandown.com/agent/assignments/{notification_id}/accept`
- You'll need to create frontend routes for agents to accept/reject:
  - `/agent/assignments/:notificationId/accept`
  - `/agent/assignments/:notificationId/reject`
- These routes should call the API endpoints and redirect to agent dashboard

### Environment Variables
- Ensure `PYTHON_API_KEY` is set in frontend environment for admin API calls
- Ensure email service (Gmail/SendGrid) is configured for sending notifications

### Database Migration
- Run the migration file: `supabase/migrations/20250130_agent_sequential_notifications.sql`
- Or apply via Supabase dashboard

## 🚀 Next Steps (Optional Enhancements)

1. **Agent Dashboard**: Create agent-facing pages to view pending assignments
2. **WebSocket Integration**: Real-time updates instead of polling
3. **SMS Notifications**: Send SMS in addition to email
4. **Assignment Preferences**: Let agents set preferences (e.g., property types, locations)
5. **Automatic Retry**: Option to manually retry expired queues
6. **Statistics Dashboard**: Analytics on assignment success rates, average response times, etc.

## 🔧 Testing Checklist

- [ ] Run database migration
- [ ] Test property approval triggers notification queue
- [ ] Test agent email notification (check spam folder)
- [ ] Test agent accept flow (should assign property)
- [ ] Test agent reject flow (should move to next agent)
- [ ] Test timeout after 5 minutes (should move to next agent)
- [ ] Test 3 attempts per agent (should exclude after 3)
- [ ] Test admin tracking modal (should show complete history)
- [ ] Test unassigned properties list (after all agents exhausted)
- [ ] Verify email template renders correctly

## 📞 Support

If issues arise:
1. Check backend logs for `[SEQUENTIAL_NOTIFICATION]` prefixed messages
2. Check email service logs for delivery status
3. Verify database tables are created correctly
4. Ensure agent matching logic finds agents (check zipcode/city/state fields)

