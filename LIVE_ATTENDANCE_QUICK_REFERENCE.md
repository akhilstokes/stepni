# Live Attendance - Quick Reference Card

## 🔗 Access
```
http://localhost:3000/manager/live
```
**Login Required:** Manager, Admin, or Accountant role

## 📊 Dashboard Overview

### Statistics Cards
| Card | Shows | Color |
|------|-------|-------|
| Total Staff | All staff count | Blue |
| Present | Checked in, not out | Green |
| Late | Late arrivals | Orange |
| Completed | Checked in & out | Purple |
| Absent | No check-in | Red |

### Status Badges
| Badge | Meaning | Color |
|-------|---------|-------|
| On Time ✓ | Checked in on time | Green |
| Late ⏰ | Late by X minutes | Yellow |
| Completed ✓✓ | Checked in & out | Purple |
| Absent ✗ | No attendance | Red |

## 🎛️ Controls

### Date Picker
- Select any date to view attendance
- Default: Today's date
- Shows historical data

### Search Box
Search by:
- Staff name
- Staff ID
- Email address

### Filter Buttons
- **All** - Show everyone
- **Present** - Only checked in
- **Late** - Only late arrivals
- **Completed** - Only checked out
- **Absent** - Only absent staff

### Refresh Button
- Manual refresh
- Auto-refresh: Every 30 seconds
- Green pulsing dot = Live updates

## 📋 Table Columns

| Column | Shows |
|--------|-------|
| Staff Name | Avatar + Name + Email |
| Staff ID | Employee ID |
| Role | staff/delivery/lab/etc |
| Shift | Shift name + time |
| Check In | Time of check-in |
| Check Out | Time of check-out |
| Duration | Working hours |
| Status | Status badge |
| Location | Check-in location |

## 🏷️ RFID Quick Commands

### Add RFID to User
```bash
node quick-add-rfid.js user@example.com 54081705
```

### Test RFID Endpoint
```bash
node test-rfid-endpoint.js
```

### Check Attendance Data
```bash
node test-live-attendance.js
```

## 🔄 RFID Flow

1. **First Scan** → Check-in
   - Creates attendance record
   - Status: Present/Late
   - Records check-in time

2. **Second Scan** → Check-out
   - Updates attendance record
   - Status: Completed
   - Records check-out time
   - Calculates duration

3. **Third Scan** → Error
   - "Already checked out today"

## 🎯 Common Tasks

### View Today's Attendance
1. Go to live attendance page
2. Default shows today
3. See all staff with status

### Check Absent Staff
1. Click "Absent" filter
2. See all absent staff
3. Red badges indicate absent

### Search for Staff
1. Type in search box
2. Search name/ID/email
3. Results filter instantly

### View Past Attendance
1. Click date picker
2. Select past date
3. View historical data

### Export Data (Future)
- Currently: Manual copy
- Coming: Excel/CSV export

## 🐛 Troubleshooting

### No Data Showing
- ✓ Check server is running
- ✓ Verify login as manager
- ✓ Check browser console
- ✓ Refresh page (Ctrl+R)

### RFID Not Working
- ✓ Verify user has rfidUid
- ✓ Check UID matches
- ✓ Test endpoint manually
- ✓ Check server logs

### Stats Not Updating
- ✓ Wait 30s for auto-refresh
- ✓ Click manual refresh
- ✓ Check network tab
- ✓ Re-login if needed

## 📱 Mobile View

- Responsive design
- 2-column stat cards
- Horizontal scroll table
- Touch-friendly buttons
- Optimized for tablets

## ⌨️ Keyboard Shortcuts

- **Ctrl+R** - Refresh page
- **Ctrl+F** - Browser search
- **Tab** - Navigate controls
- **Enter** - Activate button

## 🔐 Permissions

| Role | Access |
|------|--------|
| Admin | ✅ Full access |
| Manager | ✅ Full access |
| Accountant | ✅ Full access |
| Staff | ❌ No access |
| Delivery | ❌ No access |
| Lab | ❌ No access |

## 📈 Performance

- **Load Time:** < 2 seconds
- **Auto-Refresh:** 30 seconds
- **Search:** Instant (client-side)
- **Filter:** Instant (client-side)
- **Scalability:** 1000+ staff

## 🎨 Color Scheme

| Element | Color | Hex |
|---------|-------|-----|
| Primary | Blue | #3498db |
| Success | Green | #27ae60 |
| Warning | Yellow | #f39c12 |
| Danger | Red | #e74c3c |
| Info | Purple | #9b59b6 |
| Gray | Gray | #7f8c8d |

## 📞 Support

### Check Logs
```bash
# Server logs
cd server
npm start

# Browser console
F12 → Console tab
```

### Common Errors

**401 Unauthorized**
- Re-login required
- Token expired

**404 Not Found**
- Check URL is correct
- Verify route exists

**500 Server Error**
- Check server logs
- Verify database connection

## ✅ Quick Checklist

Before reporting issues:
- [ ] Server is running
- [ ] Logged in as manager
- [ ] Browser cache cleared
- [ ] Network connection stable
- [ ] Database connected
- [ ] No console errors

## 🚀 Quick Start

```bash
# 1. Start server
cd server
npm start

# 2. Open browser
http://localhost:3000/manager/live

# 3. Login as manager

# 4. View live attendance!
```

---

**Need Help?** Check the full documentation:
- LIVE_ATTENDANCE_RFID_FIXED.md
- QUICK_TEST_LIVE_ATTENDANCE.md
- LIVE_ATTENDANCE_IMPLEMENTATION_SUMMARY.md
