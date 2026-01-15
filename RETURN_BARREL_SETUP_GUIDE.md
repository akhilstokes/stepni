# Return Barrel System - Setup Guide

## Quick Start

### 1. Backend Setup (Already Done ✓)

The following files have been created/updated:

**Models:**
- `server/models/returnBarrelRequestModel.js` - Database schema for return requests

**Controllers:**
- `server/controllers/fieldStaffController.js` - Updated with return barrel endpoints
- `server/controllers/adminReturnBarrelController.js` - Admin management endpoints

**Routes:**
- `server/routes/fieldStaffRoutes.js` - Updated with return barrel routes
- `server/routes/adminReturnBarrelRoutes.js` - Admin routes for managing requests
- `server/server.js` - Updated with admin return barrel routes

### 2. Frontend Setup (Already Done ✓)

**Components:**
- `client/src/pages/field-staff/ReturnBarrels.js` - Main return barrel component
- `client/src/pages/field-staff/ReturnBarrels.css` - Styling

### 3. Add to Field Staff Navigation

Update your field staff routes/navigation to include the Return Barrels page:

```javascript
// In your field staff routes file (e.g., client/src/App.js or field staff layout)
import ReturnBarrels from './pages/field-staff/ReturnBarrels';

// Add route
<Route path="/field-staff/return-barrels" element={<ReturnBarrels />} />
```

### 4. Add Navigation Link

Add a link in the field staff sidebar/navigation:

```javascript
<Link to="/field-staff/return-barrels">
  <i className="fas fa-undo-alt"></i>
  Return Barrels
</Link>
```

### 5. Test the System

#### Test Field Staff Flow (With Scanner):
1. Navigate to `/field-staff/return-barrels`
2. Select a return reason
3. Choose "Yes, I have a scanner"
4. Click "Proceed to Scanning"
5. Enter barrel IDs (e.g., BHFP1, BHFP2, BHFP3)
6. Click "Submit Return"
7. Verify confirmation screen

#### Test Field Staff Flow (Without Scanner):
1. Navigate to `/field-staff/return-barrels`
2. Select a return reason
3. Choose "No scanner available"
4. Enter number of barrels (e.g., 10)
5. Click "Request Barrel IDs from Admin"
6. Verify success message

#### Test Admin Flow:
1. Create admin dashboard view to display requests
2. Fetch requests: `GET /api/admin/return-barrels/requests`
3. Approve barrel ID request: `POST /api/admin/return-barrels/requests/:requestId/approve`
4. Verify barrels are assigned to field staff

### 6. Database Migration (Optional)

If you need to seed test data:

```javascript
// Create test return barrel requests
const ReturnBarrelRequest = require('./server/models/returnBarrelRequestModel');

// Example: Create a barrel ID request
await ReturnBarrelRequest.create({
  requestType: 'barrel_id_request',
  requestedBy: fieldStaffUserId,
  requestedByName: 'John Doe',
  numberOfBarrels: 10,
  reason: 'completed_route',
  notes: 'Need barrels for return',
  status: 'pending'
});

// Example: Create a return request
await ReturnBarrelRequest.create({
  requestType: 'return',
  requestedBy: fieldStaffUserId,
  requestedByName: 'John Doe',
  barrelIds: ['BHFP1', 'BHFP2', 'BHFP3'],
  numberOfBarrels: 3,
  reason: 'completed_route',
  notes: 'All deliveries completed',
  status: 'pending'
});
```

## API Testing with cURL

### Submit Return Barrels
```bash
curl -X POST http://localhost:5000/api/field-staff/return-barrels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "barrelIds": ["BHFP1", "BHFP2", "BHFP3"],
    "reason": "completed_route",
    "notes": "All deliveries completed",
    "returnedBy": "USER_ID",
    "returnedByName": "John Doe"
  }'
```

### Request Barrel IDs
```bash
curl -X POST http://localhost:5000/api/field-staff/request-barrel-ids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "numberOfBarrels": 10,
    "reason": "completed_route",
    "notes": "Need barrel IDs",
    "requestedBy": "USER_ID",
    "requestedByName": "John Doe"
  }'
```

### Get All Requests (Admin)
```bash
curl -X GET "http://localhost:5000/api/admin/return-barrels/requests?status=pending" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Approve Barrel ID Request (Admin)
```bash
curl -X POST http://localhost:5000/api/admin/return-barrels/requests/REQUEST_ID/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "assignedBarrelIds": ["BHFP1", "BHFP2", "BHFP3", "BHFP4", "BHFP5"]
  }'
```

## Features Implemented

✅ Three-step workflow (Form → Scan → Confirmation)
✅ Scanner availability detection
✅ Barrel ID validation (BHFP + 1-3 digits)
✅ Real-time duplicate detection
✅ Request barrel IDs from admin (no scanner flow)
✅ Return reasons dropdown
✅ Additional notes field
✅ Scanned barrels grid with remove option
✅ Success confirmation screen
✅ Admin endpoints for managing requests
✅ Database model for tracking requests
✅ Barrel status updates
✅ Responsive design
✅ Modern UI with animations

## Next Steps

### 1. Create Admin Dashboard View
Create a page to display and manage return barrel requests:

```javascript
// client/src/pages/admin/ReturnBarrelRequests.js
import React, { useState, useEffect } from 'react';

const ReturnBarrelRequests = () => {
  const [requests, setRequests] = useState([]);
  
  useEffect(() => {
    fetchRequests();
  }, []);
  
  const fetchRequests = async () => {
    const response = await fetch('/api/admin/return-barrels/requests', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    setRequests(data.requests);
  };
  
  const approveRequest = async (requestId, barrelIds) => {
    await fetch(`/api/admin/return-barrels/requests/${requestId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ assignedBarrelIds: barrelIds })
    });
    fetchRequests();
  };
  
  // Render requests and approval UI
  return (
    <div>
      {/* Display requests and approval buttons */}
    </div>
  );
};
```

### 2. Add Notifications
Integrate with your notification system to alert:
- Admin when field staff submits return request
- Field staff when admin approves/rejects barrel ID request

### 3. Add to Navigation
Update field staff sidebar to include "Return Barrels" link

### 4. Test End-to-End
Test complete workflow from field staff submission to admin approval

## Troubleshooting

### Issue: Routes not working
**Solution:** Ensure routes are registered in `server/server.js`:
```javascript
app.use('/api/field-staff', require('./routes/fieldStaffRoutes'));
app.use('/api/admin/return-barrels', require('./routes/adminReturnBarrelRoutes'));
```

### Issue: Authentication errors
**Solution:** Verify JWT token is being sent in Authorization header

### Issue: Barrel validation fails
**Solution:** Ensure barrel IDs follow format: BHFP + 1-3 digits (e.g., BHFP1, BHFP12, BHFP123)

### Issue: Database errors
**Solution:** Ensure MongoDB is running and ReturnBarrelRequest model is imported correctly

## Support

For detailed API documentation, see `FIELD_STAFF_RETURN_BARREL_SYSTEM.md`
