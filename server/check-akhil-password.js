const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });

const User = require('./models/userModel');

async function checkAndResetPassword() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find akhil user
    const akhilUser = await User.findOne({ 
      email: 'akhilnk856@gmail.com'
    }).select('+password');

    if (!akhilUser) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ Found User:');
    console.log(`   Name: ${akhilUser.name}`);
    console.log(`   Email: ${akhilUser.email}`);
    console.log(`   Phone: ${akhilUser.phoneNumber}`);
    console.log(`   Role: ${akhilUser.role}\n`);

    // Test common passwords
    const testPasswords = ['Test@123', 'Password@123', 'Akhil@123', 'test@123'];
    
    console.log('🔐 Testing common passwords...\n');
    for (const pwd of testPasswords) {
      const isMatch = await bcrypt.compare(pwd, akhilUser.password);
      if (isMatch) {
        console.log(`✅ PASSWORD FOUND: ${pwd}\n`);
        return;
      }
    }

    console.log('❌ None of the common passwords worked\n');
    console.log('💡 Resetting password to: Test@123\n');

    // Reset password
    const salt = await bcrypt.genSalt(10);
    akhilUser.password = await bcrypt.hash('Test@123', salt);
    await akhilUser.save();

    console.log('✅ Password reset successfully!');
    console.log('   Email: akhilnk856@gmail.com');
    console.log('   Password: Test@123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAndResetPassword();
