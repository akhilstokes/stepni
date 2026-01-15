const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const User = require('./server/models/userModel');

async function addRFID() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const rfidUID = '54081705';
    
    // Find user by email or name
    const userEmail = process.argv[2]; // Pass email as argument
    
    if (!userEmail) {
      console.log('Usage: node add-rfid-quick.js <user-email>');
      console.log('Example: node add-rfid-quick.js user@example.com');
      process.exit(1);
    }

    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log(`User not found with email: ${userEmail}`);
      process.exit(1);
    }

    user.rfidUID = rfidUID;
    await user.save();

    console.log(`✓ RFID ${rfidUID} added to user: ${user.name} (${user.email})`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addRFID();
