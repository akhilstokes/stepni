const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const User = require('./models/userModel');
const Bill = require('./models/billModel');

async function findAkhilUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user named akhil
    console.log('🔍 Searching for user "akhil"...\n');
    const users = await User.find({
      name: /akhil/i,
      role: 'user'
    });

    if (users.length === 0) {
      console.log('❌ No user found with name containing "akhil"');
      console.log('\n💡 Showing all users with role "user":');
      const allUsers = await User.find({ role: 'user' }).select('name email phoneNumber');
      allUsers.forEach(user => {
        console.log(`   - ${user.name} (${user.phoneNumber}) - ${user.email}`);
      });
    } else {
      console.log(`✅ Found ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Phone: ${user.phoneNumber}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user._id}\n`);
      });

      // Check bills for akhil
      console.log('📋 Checking bills for "akhil N.K"...\n');
      const bills = await Bill.find({
        customerName: /akhil/i
      });

      console.log(`Found ${bills.length} bills:\n`);
      bills.forEach(bill => {
        console.log(`Bill: ${bill.billNumber}`);
        console.log(`  Customer: ${bill.customerName}`);
        console.log(`  Phone: ${bill.customerPhone}`);
        console.log(`  Status: ${bill.status}`);
        console.log(`  User Linked: ${bill.userId ? '✅ Yes' : '❌ No'}`);
        if (bill.userId) {
          console.log(`  Linked to ID: ${bill.userId}`);
        }
        console.log('');
      });

      // Suggest fix
      if (users.length > 0 && bills.length > 0) {
        console.log('\n💡 TO FIX:');
        console.log('='.repeat(80));
        console.log('Run this command to link bills to the correct user:\n');
        console.log(`node update-bill-user.js ${users[0]._id}`);
        console.log('\nThis will update all bills for "akhil N.K" to link to the correct user.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

findAkhilUser();
