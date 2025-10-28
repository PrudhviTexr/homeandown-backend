# Document Status Display Fix

## Summary
Enhanced the document display in ViewUserModal to clearly show document status with visual indicators.

## Changes Made

### 1. Visual Status Indicators
- **Status Badge**: Added colored status badge next to each document name showing APPROVED, REJECTED, or PENDING
- **Color-Coded Backgrounds**:
  - Green background for approved documents
  - Red background for rejected documents  
  - Gray/yellow background for pending documents
- **Icon Colors**: Document icons change color based on status
- **Status Text**: Large visible status text showing APPROVED or REJECTED

### 2. Rejection Reasons
- Shows rejection reason below rejected documents (if provided)
- Displayed in red text for visibility

### 3. Toggle for Rejected Documents
- Added checkbox "Show rejected documents"
- By default, rejected documents are hidden
- Check the box to show all documents including rejected ones
- Improves clarity by focusing on actionable documents

### 4. Enhanced Filtering
- Filters documents by status
- Shows only non-rejected documents by default
- Option to show/hide rejected documents

## User Benefits

1. **Clear Status Indication**: Users can immediately see if documents are approved, rejected, or pending
2. **Better Organization**: Rejected documents are hidden by default, keeping the focus on actionable items
3. **Rejection Feedback**: Shows why documents were rejected
4. **Visual Hierarchy**: Color coding makes it easy to scan document statuses at a glance

## How It Works

```typescript
// Filter logic
documents
  .filter(d => showRejected || d.status !== 'rejected')
  .map((doc) => {
    // Status-based styling
    const bgColor = doc.status === 'rejected' ? 'bg-red-50' : 
                    doc.status === 'approved' ? 'bg-green-50' : 
                    'bg-gray-50';
    
    const borderColor = doc.status === 'rejected' ? 'border-red-200' : 
                         doc.status === 'approved' ? 'border-green-200' : 
                         'border-gray-200';
    
    // Render with status badges and color-coded backgrounds
  })
```

## Status Display Hierarchy

1. **Document Card Background**: Changes color based on status
2. **Document Icon**: Changes color (red, green, or gray)
3. **Status Badge**: Colored badge next to filename
4. **Status Text**: Large "Approved" or "Rejected" text
5. **Rejection Reason**: Shown below rejected documents

