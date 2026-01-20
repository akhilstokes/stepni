const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const User = require('./models/userModel');
const Bill = require('./models/billModel');

async function updateAkhilBills() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Find all users with role 'user'
    console.log('📋 Finding all users with role "user"...\n');
    const allUsers = await User.find({ role: 'user' }).select('name email phoneNumber');
    
    console.log(`Found ${allUsers.length} users:\n`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Phone: ${user.phoneNumber}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user._id}\n`);
    });

    // Step 2: Find bills for "akhil N.K"
    console.log('📋 Finding bills for "akhil N.K"...\n');
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
      console.log('');
    });

    // Step 3: Ask which user to link to
    if (allUsers.length === 0) {
      console.log('❌ No users found with role "user"');
      return;
    }

    if (bills.length === 0) {
      console.log('❌ No bills found for "akhil N.K"');
      return;
    }

    // Find the user named "akhil" (case insensitive)
    const akhilUser = allUsers.find(u => u.name.toLowerCase().includes('akhil'));
    
    if (!akhilUser) {
      console.log('❌ No user found with name containing "akhil"');
      console.log('\n💡 Please manually specify the correct user ID');
      console.log('Usage: node update-akhil-bills.js <userId>');
      return;
    }

    console.log(`\n✅ Found user: ${akhilUser.name} (${akhilUser.phoneNumber})`);
    console.log(`   User ID: ${akhilUser._id}\n`);

    // Step 4: Update all bills
    console.log('🔄 Updating bills...\n');
    
    for (const bill of bills) {
      bill.userId = akhilUser._id;
      bill.customerPhone = akhilUser.phoneNumber; // Update phone number too
      await bill.save();
      console.log(`✅ Updated ${bill.billNumber}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL BILLS UPDATED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   - User: ${akhilUser.name}`);
    console.log(`   - Phone: ${akhilUser.phoneNumber}`);
    console.log(`   - Bills updated: ${bills.length}`);
    console.log(`\n💡 User can now see bills at: /user/transactions`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

updateAkhilBills();
