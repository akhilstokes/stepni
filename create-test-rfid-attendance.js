const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const Attendance = require('./server/models/attendanceModel');
const User = require('./server/models/userModel');

async function createTestRFIDAttendance() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a user with RFID UID
    console.log('🔍 Finding users with RFID UIDs...');
    const usersWithRFID = await User.find({ 
      rfidUid: { $exists: true, $ne: null } 
    }).limit(5);

    if (usersWithRFID.length === 0) {
      console.log('❌ No users found with RFID UIDs');
      console.log('   Please assign RFID UIDs to users first using:');
      console.log('   node add-rfid-to-user.js');
      await mongoose.connection.close();
      return;
    }

    console.log(`✅ Found ${usersWithRFID.length} users with RFID UIDs:\n`);
    usersWithRFID.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.name} (${user.staffId}) - RFID: ${user.rfidUid}`);
    });

    // Create test RFID attendance for the first user
    const testUser = usersWithRFID[0];
    console.log(`\n📝 Creating test RFID attendance for: ${testUser.name}`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      staff: testUser._id,
      date: { $gte: today, $lt: tomorrow }
    });

    if (existingAttendance) {
      console.log('⚠️  Attendance record already exists for today');
      console.log('   Updating to RFID Scanner location...');
      
      existingAttendance.location = 'RFID Scanner';
      existingAttendance.notes = 'Auto-marked via RFID (Test)';
      await existingAttendance.save();
      
      console.log('✅ Updated existing attendance record');
    } else {
      // Create new RFID attendance
      const checkInTime = new Date();
      checkInTime.setHours(9, 15, 0, 0); // 9:15 AM

      const newAttendance = new Attendance({
        staff: testUser._id,
        date: today,
        checkIn: checkInTime,
        status: 'present',
        location: 'RFID Scanner',
        notes: 'Auto-marked via RFID (Test)'
      });

      await newAttendance.save();
      console.log('✅ Created new RFID attendance record');
    }

    // Create a second test record with check-out
    if (usersWithRFID.length > 1) {
      const testUser2 = usersWithRFID[1];
      console.log(`\n📝 Creating completed RFID attendance for: ${testUser2.name}`);

      const existingAttendance2 = await Attendance.findOne({
        staff: testUser2._id,
        date: { $gte: today, $lt: tomorrow }
      });

      if (existingAttendance2) {
        console.log('⚠️  Attendance record already exists');
        existingAttendance2.location = 'RFID Scanner';
        existingAttendance2.notes = 'Auto-marked via RFID (Test)';
        if (!existingAttendance2.checkOut) {
          const checkOutTime = new Date();
          checkOutTime.setHours(17, 30, 0, 0); // 5:30 PM
          existingAttendance2.checkOut = checkOutTime;
        }
        await existingAttendance2.save();
        console.log('✅ Updated existing attendance record');
      } else {
        const checkInTime2 = new Date();
        checkInTime2.setHours(8, 45, 0, 0); // 8:45 AM
        
        const checkOutTime2 = new Date();
        checkOutTime2.setHours(17, 30, 0, 0); // 5:30 PM

        const newAttendance2 = new Attendance({
          staff: testUser2._id,
          date: today,
          checkIn: checkInTime2,
          checkOut: checkOutTime2,
          status: 'present',
          location: 'RFID Scanner',
          notes: 'Auto-marked via RFID (Test)'
        });

        await newAttendance2.save();
        console.log('✅ Created completed RFID attendance record');
      }
    }

    // Verify the records
    console.log('\n🔍 Verifying RFID attendance records...');
    const rfidRecords = await Attendance.find({
      location: 'RFID Scanner',
      date: { $gte: today, $lt: tomorrow }
    }).populate('staff', 'name staffId email');

    console.log(`\n✅ Total RFID attendance records for today: ${rfidRecords.length}\n`);
    
    rfidRecords.forEach((record, idx) => {
      console.log(`${idx + 1}. ${record.staff.name} (${record.staff.staffId})`);
      console.log(`   Check-in: ${record.checkIn ? record.checkIn.toLocaleString() : 'Not checked in'}`);
      console.log(`   Check-out: ${record.checkOut ? record.checkOut.toLocaleString() : 'Not checked out'}`);
      console.log(`   Status: ${record.status}`);
      console.log('');
    });

    console.log('✅ Test RFID attendance records created successfully!');
    console.log('\n📱 Next steps:');
    console.log('   1. Open the Live Check-ins page as a manager');
    console.log('   2. You should see the "RFID Attendance History" section');
    console.log('   3. The records should also appear in the main table with RFID badge');
    console.log('   4. Use the "RFID Only" filter button to view only RFID records');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
}

createTestRFIDAttendance();
