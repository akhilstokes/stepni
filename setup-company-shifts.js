// Setup Holy Family Polymers Standard Shifts
// Morning: 6 AM - 2 PM
// Evening: 2 PM - 10 PM

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

const Shift = require('./server/models/Shift');
const User = require('./server/models/userModel');

async function setupShifts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a manager/admin to set as creator
    const manager = await User.findOne({ role: { $in: ['manager', 'admin'] } });
    
    if (!manager) {
      console.log('❌ No manager/admin found. Please create a manager account first.');
      process.exit(1);
    }

    console.log(`📋 Using ${manager.name} (${manager.role}) as shift creator\n`);

    // Check if shifts already exist
    const existingShifts = await Shift.find({
      name: { $in: ['Morning Shift', 'Evening Shift'] }
    });

    if (existingShifts.length > 0) {
      console.log('⚠️  Shifts already exist:');
      existingShifts.forEach(shift => {
        console.log(`   - ${shift.name} (${shift.startTime} - ${shift.endTime})`);
      });
      console.log('\n❓ Do you want to delete and recreate them? (Ctrl+C to cancel)\n');
      
      // Wait 3 seconds before proceeding
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await Shift.deleteMany({
        name: { $in: ['Morning Shift', 'Evening Shift'] }
      });
      console.log('🗑️  Deleted existing shifts\n');
    }

    // Create Morning Shift (6 AM - 2 PM)
    const morningShift = new Shift({
      name: 'Morning Shift',
      description: 'Standard morning production shift',
      startTime: '06:00',
      endTime: '14:00',
      type: 'morning',
      category: 'production',
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      minStaff: 5,
      maxStaff: 30,
      isActive: true,
      isTemplate: false,
      breaks: [
        {
          name: 'Tea Break',
          startTime: '09:00',
          endTime: '09:15',
          isPaid: true
        },
        {
          name: 'Lunch Break',
          startTime: '12:00',
          endTime: '12:30',
          isPaid: true
        }
      ],
      overtimeSettings: {
        allowOvertime: true,
        maxOvertimeHours: 2,
        overtimeRate: 1.5
      },
      location: 'Factory Floor',
      department: 'Production',
      color: '#f59e0b',
      createdBy: manager._id
    });

    await morningShift.save();
    console.log('✅ Created Morning Shift');
    console.log(`   Time: 06:00 - 14:00 (6 AM - 2 PM)`);
    console.log(`   Duration: ${morningShift.durationHours} hours`);
    console.log(`   Working Hours: ${morningShift.workingHours} hours (after breaks)`);
    console.log(`   Breaks: Tea (09:00-09:15), Lunch (12:00-12:30)\n`);

    // Create Evening Shift (2 PM - 10 PM)
    const eveningShift = new Shift({
      name: 'Evening Shift',
      description: 'Standard evening production shift',
      startTime: '14:00',
      endTime: '22:00',
      type: 'evening',
      category: 'production',
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      minStaff: 5,
      maxStaff: 30,
      isActive: true,
      isTemplate: false,
      breaks: [
        {
          name: 'Tea Break',
          startTime: '17:00',
          endTime: '17:15',
          isPaid: true
        },
        {
          name: 'Dinner Break',
          startTime: '19:00',
          endTime: '19:30',
          isPaid: true
        }
      ],
      overtimeSettings: {
        allowOvertime: true,
        maxOvertimeHours: 2,
        overtimeRate: 1.5
      },
      location: 'Factory Floor',
      department: 'Production',
      color: '#3b82f6',
      createdBy: manager._id
    });

    await eveningShift.save();
    console.log('✅ Created Evening Shift');
    console.log(`   Time: 14:00 - 22:00 (2 PM - 10 PM)`);
    console.log(`   Duration: ${eveningShift.durationHours} hours`);
    console.log(`   Working Hours: ${eveningShift.workingHours} hours (after breaks)`);
    console.log(`   Breaks: Tea (17:00-17:15), Dinner (19:00-19:30)\n`);

    console.log('🎉 Holy Family Polymers shifts setup complete!\n');
    console.log('📊 Summary:');
    console.log(`   Morning Shift: 06:00 - 14:00 (8 hours, 7.25 working hours)`);
    console.log(`   Evening Shift: 14:00 - 22:00 (8 hours, 7.25 working hours)`);
    console.log(`   Total Coverage: 16 hours per day`);
    console.log(`   Days: Monday - Saturday\n`);

    console.log('✨ You can now assign staff to these shifts from the Shift Management page!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

setupShifts();
