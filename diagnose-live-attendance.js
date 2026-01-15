const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const User = require('./server/models/userModel');
const Attendance = require('./server/models/attendanceModel');

async function diagnose() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check attendance records
    console.log('📊 STEP 1: Checking Attendance Records');
    console.log('═'.repeat(50));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRecords = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('staff', 'name email role staffId');

    console.log(`Found ${todayRecords.length} attendance records for today`);
    todayRecords.forEach((record, i) => {
      console.log(`\n${i + 1}. ${record.staff?.name || 'Unknown'}`);
      console.log(`   Email: ${record.staff?.email}`);
      console.log(`   Role: ${record.staff?.role}`);
      console.log(`   Check In: ${record.checkIn}`);
      console.log(`   Check Out: ${record.checkOut}`);
    });

    // 2. Check user "pushyajain"
    console.log('\n\n👤 STEP 2: Checking User "pushyajain"');
    console.log('═'.repeat(50));
    
    const user = await User.findOne({ 
      $or: [
        { name: /pushyajain/i },
        { email: /pushyajain/i }
      ]
    });

    if (user) {
      console.log('✅ User found:');
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Staff ID: ${user.staffId || 'Not set'}`);
      
      // Check if role has access
      const allowedRoles = ['manager', 'admin', 'accountant'];
      const hasAccess = allowedRoles.includes(user.role);
      console.log(`   Has Access: ${hasAccess ? '✅ YES' : '❌ NO'}`);
      
      if (!hasAccess) {
        console.log(`   ⚠️  User role "${user.role}" is not in allowed roles: ${allowedRoles.join(', ')}`);
      }
    } else {
      console.log('❌ User "pushyajain" not found');
    }

    // 3. Test API endpoint directly
    console.log('\n\n🔌 STEP 3: Testing API Endpoint');
    console.log('═'.repeat(50));
    
    try {
      const response = await axios.get('http://localhost:5000/api/attendance/today-all');
      console.log('❌ Unexpected: Request succeeded without auth');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint requires authentication (401)');
      } else {
        console.log(`⚠️  Unexpected error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    // 4. Check all users with manager/admin/accountant roles
    console.log('\n\n👥 STEP 4: Users with Access Rights');
    console.log('═'.repeat(50));
    
    const authorizedUsers = await User.find({
      role: { $in: ['manager', 'admin', 'accountant'] }
    }).select('name email role staffId');

    console.log(`Found ${authorizedUsers.length} users with access rights:`);
    authorizedUsers.forEach((u, i) => {
      console.log(`${i + 1}. ${u.name} (${u.email}) - Role: ${u.role}`);
    });

    // 5. Recommendations
    console.log('\n\n💡 RECOMMENDATIONS');
    console.log('═'.repeat(50));
    
    if (todayRecords.length === 0) {
      console.log('⚠️  No attendance records found for today');
      console.log('   → Use RFID scanner to create attendance records');
    } else {
      console.log(`✅ ${todayRecords.length} attendance records exist`);
    }

    if (user && !['manager', 'admin', 'accountant'].includes(user.role)) {
      console.log(`\n⚠️  User "pushyajain" has role "${user.role}" which cannot access Live Attendance`);
      console.log('   → Change user role to "manager", "admin", or "accountant"');
      console.log('   → Or log in with a different account');
    }

    console.log('\n📝 NEXT STEPS:');
    console.log('1. Open browser DevTools (F12)');
    console.log('2. Go to Console tab');
    console.log('3. Hard refresh the page (Ctrl + Shift + R)');
    console.log('4. Look for console logs starting with 🔍, 🔑, 📥, ✅');
    console.log('5. Check if there are any errors in red');

    await mongoose.connection.close();
    console.log('\n✅ Diagnosis complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnose();
