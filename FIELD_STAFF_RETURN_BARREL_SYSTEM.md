# Field Staff Return Barrel System

## Overview
Complete return barrel management system for field staff to submit barrels back to admin for reassignment.

## Features

### 1. **Three-Step Workflow**
   - **Step 1: Form** - Enter return details and check scanner availability
   - **Step 2: Scan** - Scan barrel QR codes or manually enter IDs
   - **Step 3: Confirmation** - Review and confirm submission

### 2. **Scanner Detection**
   - Field staff can indicate if they have a QR scanner
   - **With Scanner**: Proceed to scan barrels directly
   - **Without Scanner**: Request barrel IDs from admin

### 3. **Barrel ID Validation**
   - Format: `BHFP` + `1-3 digits` (e.g., BHFP1, BHFP12, BHFP123)
   - Real-time validation with error messages
   - Duplicate detection

### 4. **No Scanner Workflow**
   - Field staff enters number of barrels to return
   - System sends request to admin
   - Admin assigns barrel IDs and notifies field staff
   - Field staff receives notification with assigned barrel IDs

### 5. **Return Reasons**
   - Completed Route
   - Damaged Barrels
   - Excess Barrels
   - End of Shift
   - Other (with notes)

## API Endpoints

### Field Staff Endpoints

#### Submit Return Barrels
```
POST /api/field-staff/return-barrels
Authorization: Bearer <token>

Body:
{
  "barrelIds": ["BHFP1", "BHFP2", "BHFP3"],
  "reason": "completed_route",
  "notes": "All deliveries completed",
  "returnedBy": "userId",
  "returnedByName": "John Doe"
}

Response:
{
  "success": true,
  "message": "Return request submitted successfully",
  "returnRequest": {
    "id": "requestId",
    "barrelIds": ["BHFP1", "BHFP2", "BHFP3"],
    "numberOfBarrels": 3,
    "reason": "completed_route",
    "status": "pending",
    "submittedAt": "2026-01-13T10:30:00Z"
  }
}
```

#### Request Barrel IDs (No Scanner)
```
POST /api/field-staff/request-barrel-ids
Authorization: Bearer <token>

Body:
{
  "numberOfBarrels": 10,
  "reason": "completed_route",
  "notes": "Need barrel IDs for return",
  "requestedBy": "userId",
  "requestedByName": "John Doe"
}

Response:
{
  "success": true,
  "message": "Barrel ID request sent to admin successfully",
  "request": {
    "id": "requestId",
    "numberOfBarrels": 10,
    "reason": "completed_route",
    "status": "pending",
    "requestedAt": "2026-01-13T10:30:00Z"
  }
}
```

#### Get Return Requests
```
GET /api/field-staff/return-requests?status=pending
Authorization: Bearer <token>

Response:
{
  "success": true,
  "requests": [...]
}
```

### Admin Endpoints

#### Get All Return Barrel Requests
```
GET /api/admin/return-barrels/requests?status=pending&requestType=barrel_id_request
Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 5,
  "requests": [...]
}
```

#### Approve Barrel ID Request
```
POST /api/admin/return-barrels/requests/:requestId/approve
Authorization: Bearer <token>

Body:
{
  "assignedBarrelIds": ["BHFP1", "BHFP2", "BHFP3", ...]
}

Response:
{
  "success": true,
  "message": "Barrel ID request approved and barrels assigned",
  "request": {...}
}
```

#### Reject Barrel ID Request
```
POST /api/admin/return-barrels/requests/:requestId/reject
Authorization: Bearer <token>

Body:
{
  "rejectionReason": "Insufficient barrels available"
}

Response:
{
  "success": true,
  "message": "Barrel ID request rejected",
  "request": {...}
}
```

#### Complete Return Barrel Request
```
POST /api/admin/return-barrels/requests/:requestId/complete
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Return barrel request marked as completed",
  "request": {...}
}
```

## Database Schema

### ReturnBarrelRequest Model
```javascript
{
  requestType: 'return' | 'barrel_id_request',
  requestedBy: ObjectId (User),
  requestedByName: String,
  barrelIds: [String],
  numberOfBarrels: Number,
  reason: 'completed_route' | 'damaged_barrels' | 'excess_barrels' | 'end_of_shift' | 'other',
  notes: String,
  status: 'pending' | 'approved' | 'rejected' | 'completed',
  processedBy: ObjectId (User),
  processedByName: String,
  processedAt: Date,
  assignedBarrelIds: [String],
  rejectionReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

## User Flow

### With Scanner
1. Field staff opens Return Barrels page
2. Fills in return reason and notes
3. Selects "Yes, I have a scanner"
4. Proceeds to scanning step
5. Scans barrel QR codes (or manually enters IDs)
6. Reviews scanned barrels
7. Submits return request
8. Receives confirmation
9. Admin is notified
10. Barrels are marked as returned and available for reassignment

### Without Scanner
1. Field staff opens Return Barrels page
2. Fills in return reason and notes
3. Selects "No scanner available"
4. Enters number of barrels to return
5. Submits request to admin
6. Admin receives notification
7. Admin assigns barrel IDs
8. Field staff receives notification with assigned barrel IDs
9. Field staff can view assigned barrel IDs
10. Barrels are marked as returned

## UI Components

### Step 1: Form
- Return reason dropdown
- Additional notes textarea
- Scanner availability selection
- Number of barrels input (if no scanner)

### Step 2: Scan
- Scan status indicator
- Barrel count display
- Scan input field
- Manual add button
- Scanned barrels grid with remove option
- Format hint

### Step 3: Confirmation
- Success icon
- Return summary
- Barrel IDs list
- Start new return button

## Styling
- Modern, clean design
- Responsive layout
- Step indicator with progress
- Color-coded alerts
- Smooth animations
- Mobile-friendly

## Files Created/Modified

### Frontend
- `client/src/pages/field-staff/ReturnBarrels.js` - Main component
- `client/src/pages/field-staff/ReturnBarrels.css` - Styles

### Backend
- `server/models/returnBarrelRequestModel.js` - Database model
- `server/controllers/fieldStaffController.js` - Field staff endpoints (updated)
- `server/controllers/adminReturnBarrelController.js` - Admin endpoints
- `server/routes/fieldStaffRoutes.js` - Field staff routes (updated)
- `server/routes/adminReturnBarrelRoutes.js` - Admin routes

## Integration Steps

1. **Add admin routes to server**:
   ```javascript
   // In server/index.js or server/app.js
   const adminReturnBarrelRoutes = require('./routes/adminReturnBarrelRoutes');
   app.use('/api/admin/return-barrels', adminReturnBarrelRoutes);
   ```

2. **Update field staff navigation**:
   - Add "Return Barrels" link to field staff sidebar
   - Route: `/field-staff/return-barrels`

3. **Create admin dashboard view**:
   - Display pending return barrel requests
   - Display pending barrel ID requests
   - Approve/reject functionality

4. **Add notifications**:
   - Notify admin when field staff submits return request
   - Notify field staff when admin approves/rejects barrel ID request

## Testing

### Test Cases
1. Submit return with valid barrel IDs
2. Submit return with invalid barrel IDs
3. Request barrel IDs without scanner
4. Admin approves barrel ID request
5. Admin rejects barrel ID request
6. Validate barrel ID format
7. Prevent duplicate barrel scans
8. Complete return request workflow

## Future Enhancements
- QR code generation for barrels
- Real-time notifications
- Barrel tracking history
- Analytics dashboard
- Bulk barrel operations
- Photo upload for damaged barrels
- GPS location tracking
- Offline mode support
