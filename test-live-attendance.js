require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const axios = require('axios');

// Simple test to check live attendance endpoint
async function testLiveAttendance() {
  try {
    console.log('🔍 Testing Live Attendance Endpoint...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Import models
    const User = require('./server/models/userModel');
    const Attendance = require('./server/models/attendanceModel');

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check total staff count
    const totalStaff = await User.countDocuments({ role: { $ne: 'admin' } });
    console.log(`👥 Total Staff (excluding admin): ${totalStaff}`);

    // Check today's attendance records
    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('staff', 'name email staffId role');

    console.log(`📋 Today's Attendance Records: ${todayAttendance.length}\n`);

    if (todayAttendance.length > 0) {
      console.log('📊 Attendance Details:');
      todayAttendance.forEach((record, index) => {
        console.log(`\n${index + 1}. ${record.staff?.name || 'Unknown'}`);
        console.log(`   Staff ID: ${record.staff?.staffId || 'N/A'}`);
        console.log(`   Role: ${record.staff?.role || 'N/A'}`);
        console.log(`   Check In: ${record.checkIn ? new Date(record.checkIn).toLocaleString() : 'Not checked in'}`);
        console.log(`   Check Out: ${record.checkOut ? new Date(record.checkOut).toLocaleString() : 'Not checked out'}`);
        console.log(`   Status: ${record.status}`);
        console.log(`   Location: ${record.location || 'N/A'}`);
      });
    }

    // Check users with RFID
    const usersWithRFID = await User.countDocuments({ rfidUid: { $exists: true, $ne: null } });
    console.log(`\n\n🏷️  Users with RFID cards: ${usersWithRFID}`);

    if (usersWithRFID > 0) {
      const rfidUsers = await User.find({ rfidUid: { $exists: true, $ne: null } })
        .select('name staffId rfidUid role')
        .limit(5);

      console.log('\n📇 Sample RFID Users:');
      rfidUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.staffId}) - UID: ${user.rfidUid} - Role: ${user.role}`);
      });
    }

    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testLiveAttendance();
