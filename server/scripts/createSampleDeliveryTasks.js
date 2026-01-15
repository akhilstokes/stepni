const mongoose = require('mongoose');
const DeliveryTask = require('../models/deliveryTaskModel');
const User = require('../models/userModel');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/holyfamily', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createSampleTasks = async () => {
  try {
    await connectDB();

    // Find a delivery staff user
    const deliveryStaff = await User.findOne({ role: 'delivery_staff' });
    if (!deliveryStaff) {
      console.log('No delivery staff found. Creating sample delivery staff user...');
      
      const newDeliveryStaff = new User({
        name: 'Sample Delivery Staff',
        email: 'delivery@example.com',
        phoneNumber: '9876543210',
        password: '$2b$10$samplehashedpassword', // This would be properly hashed
        role: 'delivery_staff',
        staffId: 'DEL001',
        status: 'active'
      });
      
      await newDeliveryStaff.save();
      console.log('Sample delivery staff created');
      return;
    }

    // Find a customer user
    let customer = await User.findOne({ role: 'user' });
    if (!customer) {
      customer = new User({
        name: 'Sample Customer',
        email: 'customer@example.com',
        phoneNumber: '9876543211',
        password: '$2b$10$samplehashedpassword',
        role: 'user',
        address: '123 Sample Street, Sample City',
        status: 'active'
      });
      await customer.save();
    }

    // Create sample delivery tasks
    const sampleTasks = [
      {
        title: 'Pickup from Farm A',
        customerUserId: customer._id,
        assignedTo: deliveryStaff._id,
        pickupAddress: '123 Farm Road, Village A',
        dropAddress: 'Holy Family Polymers Factory',
        status: 'assigned',
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        meta: {
          type: 'pickup',
          priority: 'high',
          estimatedDuration: '45 mins',
          quantity: 5,
          barrels: ['BR001', 'BR002', 'BR003', 'BR004', 'BR005']
        }
      },
      {
        title: 'Delivery to Lab B',
        customerUserId: customer._id,
        assignedTo: deliveryStaff._id,
        pickupAddress: 'Holy Family Polymers Factory',
        dropAddress: '456 Lab Street, City B',
        status: 'in_progress',
        scheduledAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        meta: {
          type: 'delivery',
          priority: 'medium',
          estimatedDuration: '30 mins',
          quantity: 3,
          barrels: ['BR006', 'BR007', 'BR008']
        }
      },
      {
        title: 'Pickup from Farm C',
        customerUserId: customer._id,
        assignedTo: deliveryStaff._id,
        pickupAddress: '789 Rural Road, Village C',
        dropAddress: 'Holy Family Polymers Factory',
        status: 'assigned',
        scheduledAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        meta: {
          type: 'pickup',
          priority: 'low',
          estimatedDuration: '60 mins',
          quantity: 8,
          barrels: ['BR009', 'BR010', 'BR011', 'BR012', 'BR013', 'BR014', 'BR015', 'BR016']
        }
      },
      {
        title: 'Completed Delivery to Lab A',
        customerUserId: customer._id,
        assignedTo: deliveryStaff._id,
        pickupAddress: 'Holy Family Polymers Factory',
        dropAddress: '321 Science Park, City A',
        status: 'completed',
        scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        meta: {
          type: 'delivery',
          priority: 'high',
          estimatedDuration: '40 mins',
          quantity: 4,
          barrels: ['BR017', 'BR018', 'BR019', 'BR020'],
          completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
        }
      },
      {
        title: 'Completed Pickup from Farm D',
        customerUserId: customer._id,
        assignedTo: deliveryStaff._id,
        pickupAddress: '555 Countryside Lane, Village D',
        dropAddress: 'Holy Family Polymers Factory',
        status: 'completed',
        scheduledAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        meta: {
          type: 'pickup',
          priority: 'medium',
          estimatedDuration: '50 mins',
          quantity: 6,
          barrels: ['BR021', 'BR022', 'BR023', 'BR024', 'BR025', 'BR026'],
          completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
        }
      }
    ];

    // Clear existing sample tasks
    await DeliveryTask.deleteMany({ 
      assignedTo: deliveryStaff._id,
      title: { $regex: /sample|farm|lab/i }
    });

    // Create new sample tasks
    const createdTasks = await DeliveryTask.insertMany(sampleTasks);
    
    console.log(`Created ${createdTasks.length} sample delivery tasks for ${deliveryStaff.name}`);
    console.log('Sample tasks:');
    createdTasks.forEach(task => {
      console.log(`- ${task.title} (${task.status}) - ${task.meta.type}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating sample tasks:', error);
    process.exit(1);
  }
};

// Run the script
createSampleTasks();