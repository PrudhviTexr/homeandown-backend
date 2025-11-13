# User Flows - Visual Diagrams
## HomeAndOwn Platform

This document provides visual flow diagrams for all major user interactions in the platform.

---

## 1. Buyer Flow

```
┌─────────────────┐
│   Registration  │
│   / Login       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Browse         │
│  Properties     │
│  - Search       │
│  - Filter       │
│  - View List    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  View Property  │
│  Details        │
│  - Images       │
│  - Map          │
│  - Pricing      │
│  - Area (sqft/  │
│    sqyd/acres)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│ Save   │ │  Action  │
│ to     │ │  - Inquiry│
│ Favs   │ │  - Book  │
└────────┘ └────┬─────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌──────────────┐ ┌──────────────┐
│  Inquiry     │ │  Booking     │
│  Created     │ │  Created     │
│  - Email     │ │  - Email     │
│    sent      │ │    sent      │
└──────┬───────┘ └──────┬───────┘
       │                │
       ▼                ▼
┌──────────────┐ ┌──────────────┐
│  Track       │ │  Manage      │
│  Inquiry     │ │  Booking     │
│  Status      │ │  - View      │
│              │ │  - Cancel    │
│              │ │  - Reschedule│
└──────────────┘ └──────────────┘
```

---

## 2. Seller Flow

```
┌─────────────────┐
│   Registration  │
│   / Login       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Submit         │
│  Documents      │
│  - ID Proof     │
│  - Address      │
│  - Business     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Wait for       │
│  Admin          │
│  Approval       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│Approved│ │ Rejected │
│        │ │          │
│Email   │ │ Email    │
│sent    │ │ sent     │
└───┬────┘ └────┬─────┘
    │           │
    │           └──► Resubmit Documents
    │
    ▼
┌─────────────────┐
│  Add Property   │
│  - Fill Form    │
│  - Upload Images│
│  - Select Area  │
│    Unit         │
│  - Submit       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Property       │
│  Pending        │
│  Approval       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│Approved│ │ Rejected │
│        │ │          │
│Email   │ │ Email    │
│sent    │ │ sent     │
└───┬────┘ └────┬─────┘
    │           │
    │           └──► Edit & Resubmit
    │
    ▼
┌─────────────────┐
│  Property Live  │
│  - View         │
│  - Edit         │
│  - Manage       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Track          │
│  - Inquiries    │
│  - Bookings     │
│  - Performance  │
└─────────────────┘
```

---

## 3. Agent Flow

```
┌─────────────────┐
│   Registration  │
│   / Login       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Submit         │
│  License        │
│  Documents      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Wait for       │
│  Admin          │
│  Approval       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│Approved│ │ Rejected │
│        │ │          │
│Email   │ │ Email    │
│sent    │ │ sent     │
└───┬────┘ └────┬─────┘
    │           │
    │           └──► Resubmit License
    │
    ▼
┌─────────────────┐
│  Agent          │
│  Dashboard      │
│  - Stats        │
│  - Properties   │
│  - Inquiries    │
│  - Bookings     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Receive        │
│  Property       │
│  Assignment     │
│  Email          │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│ Accept │ │  Reject  │
│        │ │          │
│Email   │ │ Email    │
│sent    │ │ sent     │
└───┬────┘ └──────────┘
    │
    ▼
┌─────────────────┐
│  Manage         │
│  Assigned       │
│  Properties     │
│  - View         │
│  - Inquiries    │
│  - Bookings     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Contact        │
│  Customers      │
│  - Email        │
│  - Phone        │
│  - Update       │
│    Status       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Track          │
│  Earnings       │
│  - Commissions  │
│  - Pending      │
│  - Paid         │
└─────────────────┘
```

---

## 4. Admin Flow

```
┌─────────────────┐
│   Login         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Admin          │
│  Dashboard      │
│  - Overview     │
│  - Stats        │
│  - Notifications│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│ User   │ │ Property │
│ Mgmt   │ │ Mgmt     │
└───┬────┘ └────┬─────┘
    │           │
    │           │
    ▼           ▼
┌────────┐ ┌──────────┐
│ Review │ │ Review   │
│ Users  │ │ Property │
│        │ │          │
│ - View │ │ - View   │
│ - Docs │ │ - Images │
│ - Info │ │ - Details│
└───┬────┘ └────┬─────┘
    │           │
    │           │
    ▼           ▼
┌────────┐ ┌──────────┐
│ Approve│ │ Approve  │
│ /      │ │ /        │
│ Reject │ │ Reject   │
└───┬────┘ └────┬─────┘
    │           │
    │           │
    ▼           ▼
┌────────┐ ┌──────────┐
│ Email  │ │ Email    │
│ Sent   │ │ Sent     │
└────────┘ └────┬─────┘
                 │
                 ▼
         ┌──────────────┐
         │  Assign      │
         │  Agent       │
         │  (Optional)  │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │  Email       │
         │  Sent to     │
         │  Agent &     │
         │  Seller      │
         └──────────────┘
```

---

## 5. Property Creation Flow

```
┌─────────────────┐
│  User Clicks    │
│  "Add Property" │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Select         │
│  Property Type  │
│  - Residential  │
│  - Commercial   │
│  - Land/Plot    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Fill Basic     │
│  Information    │
│  - Title        │
│  - Description  │
│  - Location     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Fill Pricing   │
│  - Price/Rent   │
│  - Area Input   │
│  - Select Unit  │
│    (sqft/sqyd/  │
│     acres)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auto-Calculate │
│  Rate per Unit  │
│  - Based on     │
│    selected     │
│    unit         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Fill Property  │
│  Details        │
│  - Bedrooms     │
│  - Bathrooms    │
│  - Type-specific│
│    fields       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Upload Images  │
│  - Multiple     │
│  - Drag & Drop  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Submit         │
│  Property       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Property       │
│  Saved          │
│  - Status:      │
│    Pending      │
│  - Email sent   │
│    to admin     │
└─────────────────┘
```

---

## 6. Booking Flow

```
┌─────────────────┐
│  Buyer Views    │
│  Property       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Clicks         │
│  "Book Tour"    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Fill Booking   │
│  Form           │
│  - Date         │
│  - Time         │
│  - Contact Info │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Submit         │
│  Booking        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  System Checks  │
│  - Property has │
│    agent?       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│  Yes   │ │   No     │
│        │ │          │
└───┬────┘ └────┬─────┘
    │           │
    │           │
    ▼           ▼
┌────────┐ ┌──────────┐
│ Email  │ │ Email    │
│ to     │ │ to       │
│ Agent  │ │ Seller   │
└───┬────┘ └────┬─────┘
    │           │
    │           │
    ▼           ▼
┌────────┐ ┌──────────┐
│ Email  │ │ Email    │
│ to     │ │ to       │
│ Buyer  │ │ Buyer    │
│ (Conf) │ │ (Conf)   │
└────────┘ └──────────┘
```

---

## 7. Agent Assignment Flow

```
┌─────────────────┐
│  Admin Views    │
│  Property       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Admin Selects  │
│  Agent          │
│  - From List    │
│  - Based on     │
│    Location     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Admin Assigns  │
│  Agent          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  System Sends   │
│  Notification   │
│  to Agent       │
│  - Email        │
│  - In-app       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent Receives │
│  Notification   │
│  - Property     │
│    Details      │
│  - Contact Info │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│ Accept │ │  Reject  │
│        │ │          │
└───┬────┘ └────┬─────┘
    │           │
    │           │
    ▼           ▼
┌────────┐ ┌──────────┐
│ Email  │ │ Email    │
│ to     │ │ to       │
│ Seller │ │ Admin    │
│ (Agent │ │ (Agent   │
│  Info) │ │  Rejected│
└────────┘ └──────────┘
```

---

## 8. Commission Calculation Flow

```
┌─────────────────┐
│  Booking        │
│  Confirmed      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  System Checks  │
│  - Has Agent?   │
│  - Property     │
│    Price?       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│  Yes   │ │   No     │
│        │ │          │
└───┬────┘ └──────────┘
    │
    ▼
┌─────────────────┐
│  Calculate      │
│  Commission     │
│  - Rate: 2%     │
│    (default)    │
│  - Amount =     │
│    Price * Rate │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Create         │
│  Commission     │
│  Record         │
│  - Status:      │
│    Pending      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Update Agent   │
│  Earnings       │
│  - Add to       │
│    Pending      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Admin Marks    │
│  as Paid        │
│  (Future)       │
└─────────────────┘
```

---

## 9. Email Notification Flow

```
┌─────────────────┐
│  Action         │
│  Triggered      │
│  (User Approve, │
│   Booking, etc) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  System         │
│  Determines     │
│  Recipients     │
│  - User         │
│  - Agent        │
│  - Seller       │
│  - Admin        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Select Email   │
│  Template       │
│  - Approval     │
│  - Rejection    │
│  - Assignment   │
│  - Booking      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Try Resend     │
│  (Primary)      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│Success │ │  Failed  │
│        │ │          │
└───┬────┘ └────┬─────┘
    │           │
    │           ▼
    │    ┌──────────────┐
    │    │ Try EmailJS  │
    │    │ (Fallback 1) │
    │    └──────┬───────┘
    │           │
    │      ┌────┴────┐
    │      │         │
    │      ▼         ▼
    │  ┌────────┐ ┌──────────┐
    │  │Success │ │  Failed  │
    │  └───┬────┘ └────┬─────┘
    │      │           │
    │      │           ▼
    │      │    ┌──────────────┐
    │      │    │ Try SendGrid │
    │      │    │ (Fallback 2) │
    │      │    └──────┬───────┘
    │      │           │
    │      │      ┌────┴────┐
    │      │      │         │
    │      │      ▼         ▼
    │      │  ┌────────┐ ┌──────────┐
    │      │  │Success │ │  Failed  │
    │      │  └───┬────┘ └────┬─────┘
    │      │      │           │
    │      │      │           ▼
    │      │      │    ┌──────────────┐
    │      │      │    │ Try Gmail    │
    │      │      │    │ SMTP         │
    │      │      │    │ (Fallback 3) │
    │      │      │    └──────────────┘
    │      │      │
    │      │      │
    └──────┴──────┴───────► Log Result
```

---

## 10. Area Unit Selection Flow

```
┌─────────────────┐
│  User Fills     │
│  Property Form  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Enters    │
│  Area Value     │
│  - Input Field  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Selects   │
│  Area Unit      │
│  - sqft         │
│  - sqyd         │
│  - acres        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  System         │
│  Auto-Converts  │
│  - Calculates   │
│    all 3 units  │
│  - Stores all   │
│    in database  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  System         │
│  Stores         │
│  Selected Unit  │
│  - area_unit    │
│    field        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Enters    │
│  Price          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  System         │
│  Auto-Calculates│
│  Rate per Unit  │
│  - Based on     │
│    selected     │
│    unit         │
│  - Stores       │
│    rate_per_sqft│
│    &            │
│    rate_per_sqyd│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Property       │
│  Saved          │
│  - All units    │
│    stored       │
│  - Selected     │
│    unit saved   │
└─────────────────┘
```

---

## 11. Property Display Flow

```
┌─────────────────┐
│  User Views     │
│  Property       │
│  Details        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  System Checks  │
│  area_unit      │
│  Field          │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│Exists  │ │  Missing│
│        │ │          │
└───┬────┘ └────┬─────┘
    │           │
    │           ▼
    │    ┌──────────────┐
    │    │ Infer from   │
    │    │ Data         │
    │    │ - Check      │
    │    │   area_acres │
    │    │ - Check      │
    │    │   area_sqyd  │
    │    │ - Default    │
    │    │   to sqft    │
    │    └──────┬───────┘
    │           │
    └───────────┘
         │
         ▼
┌─────────────────┐
│  Display Area   │
│  in Correct     │
│  Unit           │
│  - sqft →       │
│    area_sqft    │
│  - sqyd →       │
│    area_sqyd    │
│  - acres →      │
│    area_acres   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Display Rate   │
│  in Matching    │
│  Unit           │
│  - sqft →       │
│    rate_per_sqft│
│  - sqyd →       │
│    rate_per_sqyd│
│  - acres →      │
│    Calculate    │
│    from sqft    │
└─────────────────┘
```

---

## Summary

These flow diagrams illustrate:

1. **User Registration & Approval** - How users get verified
2. **Property Creation** - How properties are added and approved
3. **Booking System** - How tours are booked and managed
4. **Agent Assignment** - How agents are assigned to properties
5. **Commission Tracking** - How earnings are calculated
6. **Email Notifications** - How notifications are sent
7. **Area Unit Handling** - How area units are selected and displayed

All flows include email notifications at key steps to keep all parties informed.

