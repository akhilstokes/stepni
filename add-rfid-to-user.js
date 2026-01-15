const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './server/.env' });

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

// User model
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: String,
    staffId: String,
    rfidUid: String,
    role: String
}));

async function addRFIDToUser() {
    await connectDB();
    
    try {
        // Get command line arguments
        const args = process.argv.slice(2);
        const rfidUid = args[0] || '54081705';  // Default to the UID from your error
        const userEmail = args[1];  // Optional: specify user by email
        const staffId = args[2];    // Optional: specify user by staff ID
        
        let user;
        
        // Find user by email, staffId, or just get first available user
        if (userEmail) {
            user = await User.findOne({ email: userEmail });
        } else if (staffId) {
            user = await User.findOne({ staffId: staffId });
        } else {
            // List all users first
            const users = await User.find({ role: { $in: ['user', 'labour', 'field_staff', 'delivery_staff'] } }).limit(10);
            console.log('\n📋 Available users:');
            users.forEach((u, index) => {
                console.log(`${index + 1}. ${u.name} (${u.email}) - Staff ID: ${u.staffId || 'N/A'} - Current RFID: ${u.rfidUid || 'None'}`);
            });
            
            // Use first user without RFID or just first user
            user = users.find(u => !u.rfidUid) || users[0];
        }
        
        if (!user) {
            console.log('❌ No suitable user found');
            console.log('\n💡 Usage:');
            console.log('   node add-rfid-to-user.js [RFID_UID] [EMAIL] [STAFF_ID]');
            console.log('   Example: node add-rfid-to-user.js 54081705 user@example.com');
            process.exit(1);
        }
        
        console.log('\n📋 Selected user:');
        console.log('Name:', user.name);
        console.log('Email:', user.email);
        console.log('Staff ID:', user.staffId);
        console.log('Role:', user.role);
        console.log('Current RFID UID:', user.rfidUid || 'None');
        
        // Add RFID UID
        user.rfidUid = rfidUid;
        await user.save();
        
        console.log('\n✅ RFID UID added successfully!');
        console.log('New RFID UID:', user.rfidUid);
        console.log('\n📝 You can now test with:');
        console.log(`   UID: ${rfidUid}`);
        console.log(`   User: ${user.name} (${user.email})`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

addRFIDToUser();
