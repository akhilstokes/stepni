const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const Bill = require('./server/models/billModel');
const User = require('./server/models/userModel');

async function fixExistingBills() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all bills without userId
    const billsWithoutUser = await Bill.find({ userId: null });
    console.log(`📋 Found ${billsWithoutUser.length} bills without userId\n`);

    if (billsWithoutUser.length === 0) {
      console.log('✅ All bills already have userId linked!');
      await mongoose.connection.close();
      return;
    }

    let fixed = 0;
    let notFound = 0;

    for (const bill of billsWithoutUser) {
      console.log(`\n🔍 Processing Bill: ${bill.billNumber}`);
      console.log(`   Customer: ${bill.customerName}`);
      console.log(`   Phone: ${bill.customerPhone}`);

      if (!bill.customerPhone || bill.customerPhone === 'N/A' || bill.customerPhone === '-') {
        console.log('   ⚠️  No phone number - skipping');
        notFound++;
        continue;
      }

      // Clean phone number
      const cleanPhone = bill.customerPhone.replace(/\D/g, '');

      // Try to find user
      const user = await User.findOne({
        $or: [
          { phoneNumber: bill.customerPhone },
          { phoneNumber: cleanPhone },
          { phoneNumber: `+91${cleanPhone}` },
          { phoneNumber: `91${cleanPhone}` },
          { phoneNumber: `0${cleanPhone}` }
        ]
      });

      if (user) {
        console.log(`   ✅ Found user: ${user.name} (${user.phoneNumber})`);
        bill.userId = user._id;
        await bill.save();
        console.log(`   ✅ Updated bill with userId`);
        fixed++;
      } else {
        console.log(`   ❌ No user found with phone: ${bill.customerPhone}`);
        notFound++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Total bills processed: ${billsWithoutUser.length}`);
    console.log(`✅ Fixed (userId linked): ${fixed}`);
    console.log(`❌ Not found (no matching user): ${notFound}`);
    console.log('');

    if (fixed > 0) {
      console.log('✅ Bills have been updated!');
      console.log('   Users should now be able to see their bills.');
    }

    if (notFound > 0) {
      console.log('\n⚠️  Some bills could not be linked:');
      console.log('   - Phone number doesn\'t match any registered user');
      console.log('   - User needs to register with the same phone number');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixExistingBills();
