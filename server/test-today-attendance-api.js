const mongoose = require('mongoose');
require('dotenv').config();

const Attendance = require('./models/attendanceModel');
const User = require('./models/userModel'); // Need to load User model for populate
const Shift = require('./models/Shift'); // Need to load Shift model for populate

async function testTodayAttendanceAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Simulate the API query
    const targetDate = new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('\n🔍 Query parameters:');
    console.log('Start:', targetDate);
    console.log('End:', endOfDay);

    const attendance = await Attendance.find({
      date: {
        $gte: targetDate,
        $lte: endOfDay
      }
    })
    .populate('staff', 'name email role staffId')
    .populate('shift', 'name startTime endTime')
    .populate('markedBy', 'name email role')
    .sort({ checkIn: -1 });

    console.log(`\n📊 Found ${attendance.length} attendance records`);
    
    attendance.forEach((record, index) => {
      console.log(`\n${index + 1}. ${record.staff?.name || 'Unknown'}`);
      console.log(`   Staff ID: ${record.staff?.staffId || 'N/A'}`);
      console.log(`   Role: ${record.staff?.role || 'N/A'}`);
      console.log(`   Date: ${record.date}`);
      console.log(`   Check In: ${record.checkIn || 'Not checked in'}`);
      console.log(`   Check Out: ${record.checkOut || 'Not checked out'}`);
      console.log(`   Status: ${record.status}`);
      console.log(`   Shift: ${record.shift?.name || 'No shift assigned'}`);
      console.log(`   Late: ${record.isLate ? 'Yes (' + record.lateMinutes + ' min)' : 'No'}`);
    });

    // Test the response format
    const response = {
      success: true,
      attendance
    };

    console.log('\n📤 API Response structure:');
    console.log(JSON.stringify(response, null, 2).substring(0, 500) + '...');

    await mongoose.connection.close();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testTodayAttendanceAPI();
