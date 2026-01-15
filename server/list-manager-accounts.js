const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/userModel');

async function listManagerAccounts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('👥 MANAGER/ADMIN/ACCOUNTANT ACCOUNTS');
    console.log('═'.repeat(70));
    
    const users = await User.find({
      role: { $in: ['manager', 'admin', 'accountant'] }
    }).select('name email role staffId password').sort({ role: 1, name: 1 });

    console.log(`\nFound ${users.length} accounts with access to Live Attendance:\n`);

    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role.toUpperCase()}`);
      console.log(`   Staff ID: ${user.staffId || 'Not set'}`);
      console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`);
      console.log('');
    });

    console.log('\n📝 TO ACCESS LIVE ATTENDANCE:');
    console.log('═'.repeat(70));
    console.log('1. Log out from current account');
    console.log('2. Log in with one of the accounts above');
    console.log('3. Use the email and password for that account');
    console.log('4. Navigate to Manager Dashboard → Live Check-ins');
    console.log('\n💡 TIP: If you don\'t know the password, you can reset it or');
    console.log('   create a new manager account.');

    await mongoose.connection.close();
    console.log('\n✅ Complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listManagerAccounts();
