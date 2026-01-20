// Test Bill Creation
// Run this after logging in as accountant to test bill creation

const testBillCreation = async () => {
  try {
    // Get token from localStorage (you need to be logged in as accountant)
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ No token found. Please login as accountant first.');
      return;
    }

    console.log('🔑 Token found, testing bill creation...');

    const testBillData = {
      customerName: 'Test Customer',
      customerPhone: '+91 9876543210',
      sampleId: 'TEST-001',
      labStaff: 'Lab Staff Name',
      drcPercent: 12,
      barrelCount: 25,
      latexVolume: 1200,
      marketRate: 110,
      accountantNotes: 'Test bill creation'
    };

    console.log('📤 Sending request with data:', testBillData);

    const response = await fetch('http://localhost:5000/api/bills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testBillData)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response ok:', response.ok);

    const data = await response.json();
    console.log('📥 Response data:', data);

    if (response.ok) {
      console.log('✅ Bill created successfully!');
      console.log('Bill Number:', data.bill.billNumber);
      console.log('Total Amount:', data.bill.totalAmount);
    } else {
      console.error('❌ Failed to create bill:', data.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Run the test
testBillCreation();
