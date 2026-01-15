// Quick script to add RFID UID to a user
// Usage: node quick-add-rfid.js <email> <rfidUid>
// Example: node quick-add-rfid.js user@example.com 54081705

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: String,
    staffId: String,
    rfidUid: String,
    role: String
}));

async function quickAddRFID() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const email = process.argv[2];
        const rfidUid = process.argv[3] || '54081705';

        if (!email) {
            console.log('❌ Please provide user email');
            console.log('\n📖 Usage:');
            console.log('   node quick-add-rfid.js <email> <rfidUid>');
            console.log('\n📝 Example:');
            console.log('   node quick-add-rfid.js user@example.com 54081705\n');
            process.exit(1);
        }

        const user = await User.findOneAndUpdate(
            { email: email },
            { $set: { rfidUid: rfidUid } },
            { new: true }
        );

        if (!user) {
            console.log(`❌ User not found: ${email}\n`);
            process.exit(1);
        }

        console.log('✅ RFID UID added successfully!\n');
        console.log('👤 User:', user.name);
        console.log('📧 Email:', user.email);
        console.log('🏷️  Staff ID:', user.staffId || 'N/A');
        console.log('🎫 RFID UID:', user.rfidUid);
        console.log('👔 Role:', user.role);
        console.log('\n✨ Ready to scan!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

quickAddRFID();
