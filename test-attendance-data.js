const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const Attendance = require(path.join(__dirname, 'server', 'models', 'attendanceModel'));
const User = require(path.join(__dirname, 'server', 'models', 'userModel'));

async function testAttendanceData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check total attendance records
    const totalCount = await Attendance.countDocuments();
    console.log(`\n📊 Total attendance records: ${totalCount}`);

    // Check today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });
    console.log(`📅 Today's attendance records: ${todayCount}`);

    // Get recent attendance records
    const recentRecords = await Attendance.find()
      .populate('staff', 'name email staffId rfidUid')
      .sort({ createdAt: -1 })
      .limit(5);

    console.log('\n📋 Recent 5 attendance records:');
    recentRecords.forEach((record, index) => {
      console.log(`\n${index + 1}. ${record.staff?.name || 'Unknown'} (${record.staff?.staffId || 'N/A'})`);
      console.log(`   Date: ${record.date?.toLocaleDateString()}`);
      console.log(`   Check In: ${record.checkIn ? new Date(record.checkIn).toLocaleString() : 'Not checked in'}`);
      console.log(`   Check Out: ${record.checkOut ? new Date(record.checkOut).toLocaleString() : 'Not checked out'}`);
      console.log(`   Status: ${record.status}`);
      console.log(`   RFID UID: ${record.staff?.rfidUid || 'Not set'}`);
    });

    // Check users with RFID
    const usersWithRFID = await User.countDocuments({ rfidUid: { $exists: true, $ne: null } });
    console.log(`\n👥 Users with RFID cards: ${usersWithRFID}`);

    const rfidUsers = await User.find({ rfidUid: { $exists: true, $ne: null } })
      .select('name staffId rfidUid role')
      .limit(10);

    console.log('\n🏷️  Users with RFID UIDs:');
    rfidUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.staffId}) - UID: ${user.rfidUid} - Role: ${user.role}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAttendanceData();
