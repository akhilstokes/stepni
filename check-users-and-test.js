const mongoose = require('mongoose');
const User = require('./server/models/userModel');
const Attendance = require('./server/models/attendanceModel');
require('dotenv').config({ path: './server/.env' });

async function checkUsersAndAttendance() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check users with manager/admin/accountant roles
    console.log('📋 Users with access to attendance:');
    const users = await User.find({ 
      role: { $in: ['admin', 'manager', 'accountant'] } 
    }).select('name email role staffId');
    
    users.forEach(user => {
      console.log(`- ${user.name} (${user.role}) - ${user.email} - ${user.staffId || 'No staffId'}`);
    });

    // Check today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('\n📅 Today\'s attendance records:');
    const attendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('staff', 'name email staffId role');

    console.log(`Found ${attendance.length} records`);
    attendance.forEach(record => {
      console.log(`- ${record.staff?.name || 'Unknown'} (${record.staff?.role || 'N/A'})`);
      console.log(`  Check In: ${record.checkIn || 'N/A'}`);
      console.log(`  Check Out: ${record.checkOut || 'N/A'}`);
      console.log(`  Status: ${record.status || 'N/A'}`);
    });

    // Check all staff
    console.log('\n👥 All staff members:');
    const allStaff = await User.find({ role: { $ne: 'admin' } }).select('name email role staffId');
    console.log(`Total staff: ${allStaff.length}`);

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsersAndAttendance();
