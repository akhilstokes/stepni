// Setup Return Barrel Management System
// Creates initial hanger spaces and sample data

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

const HangerSpace = require('./server/models/HangerSpace');
const User = require('./server/models/userModel');

async function setupReturnBarrelSystem() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ No admin found. Please create an admin account first.');
      process.exit(1);
    }

    console.log(`📋 Using ${admin.name} as system creator\n`);

    // Check if hanger spaces already exist
    const existingSpaces = await HangerSpace.countDocuments();
    
    if (existingSpaces > 0) {
      console.log(`⚠️  ${existingSpaces} hanger space(s) already exist.`);
      console.log('Do you want to delete and recreate them? (Ctrl+C to cancel)\n');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await HangerSpace.deleteMany({});
      console.log('🗑️  Deleted existing hanger spaces\n');
    }

    // Create hanger spaces
    const hangerSpaces = [
      {
        location: 'Warehouse A - Section 1',
        section: 'A1',
        totalSlots: 50,
        description: 'Main warehouse storage area',
        createdBy: admin._id
      },
      {
        location: 'Warehouse A - Section 2',
        section: 'A2',
        totalSlots: 50,
        description: 'Secondary storage area',
        createdBy: admin._id
      },
      {
        location: 'Warehouse B - Section 1',
        section: 'B1',
        totalSlots: 40,
        description: 'Overflow storage',
        createdBy: admin._id
      },
      {
        location: 'Factory Floor Storage',
        section: 'F1',
        totalSlots: 30,
        description: 'Quick access storage near production',
        createdBy: admin._id
      }
    ];

    console.log('🏗️  Creating hanger spaces...\n');

    for (const spaceData of hangerSpaces) {
      // Create slots
      const slots = [];
      for (let i = 1; i <= spaceData.totalSlots; i++) {
        slots.push({
          slotNumber: `${spaceData.section}-${String(i).padStart(3, '0')}`,
          isOccupied: false
        });
      }

      const hangerSpace = new HangerSpace({
        ...spaceData,
        slots,
        occupiedSlots: 0
      });

      await hangerSpace.save();
      
      console.log(`✅ Created: ${spaceData.location}`);
      console.log(`   Total Slots: ${spaceData.totalSlots}`);
      console.log(`   Section: ${spaceData.section}\n`);
    }

    // Calculate total capacity
    const totalCapacity = await HangerSpace.getTotalAvailableCapacity();

    console.log('🎉 Return Barrel System Setup Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total Hanger Spaces: ${hangerSpaces.length}`);
    console.log(`   Total Slots: ${totalCapacity.totalSlots}`);
    console.log(`   Available Slots: ${totalCapacity.availableSlots}`);
    console.log(`   Occupied Slots: ${totalCapacity.occupiedSlots}\n`);

    console.log('✨ System is ready to use!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Field staff can scan barrel QR codes');
    console.log('   2. Request new QR codes if damaged');
    console.log('   3. Admin approves QR requests');
    console.log('   4. Field staff adds barrels to hanger spaces');
    console.log('   5. Admin assigns barrels to customers\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

setupReturnBarrelSystem();
