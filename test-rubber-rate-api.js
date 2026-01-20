/**
 * Test script to verify Rubber Board rate API is working
 * Run: node test-rubber-rate-api.js
 */

const { getLatexRate } = require('./server/services/rubberBoardScraper');

console.log('🧪 Testing Rubber Board Rate Scraper...\n');

async function test() {
  try {
    console.log('1️⃣ Testing getLatexRate() function...');
    const result = await getLatexRate(true); // Force refresh
    
    console.log('\n📊 Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ SUCCESS!');
      console.log(`   Rate: ₹${result.rate}/100kg`);
      console.log(`   Date: ${result.date}`);
      console.log(`   Source: ${result.source}`);
    } else {
      console.log('\n❌ FAILED!');
      console.log(`   Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

test();
