const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetch daily latex rate from Rubber Board website
 * URL: https://rubberboard.gov.in/public
 */
async function fetchLatexRate() {
  try {
    console.log('🔍 Fetching latex rate from Rubber Board...');
    
    const response = await axios.get('https://rubberboard.gov.in/public', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // Find the Latex(60%) rate from the domestic market table
    let latexRate = null;
    let rateDate = null;

    // Look for the table with domestic market rates
    $('table').each((i, table) => {
      $(table).find('tr').each((j, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 2) {
          const category = $(cells[0]).text().trim();
          
          // Check if this row contains Latex(60%)
          if (category.includes('Latex') && category.includes('60')) {
            const rateText = $(cells[1]).text().trim();
            // Extract number from rate (e.g., "▲ 13210.0" -> 13210.0)
            const match = rateText.match(/[\d.]+/);
            if (match) {
              latexRate = parseFloat(match[0]);
            }
          }
        }
      });
    });

    // Try to find the date
    const dateText = $('body').text();
    const dateMatch = dateText.match(/(\d{2}-\d{2}-\d{4})/);
    if (dateMatch) {
      rateDate = dateMatch[1];
    }

    if (latexRate) {
      console.log(`✅ Latex rate fetched: ₹${latexRate}/100kg (Date: ${rateDate || 'Unknown'})`);
      return {
        success: true,
        rate: latexRate,
        date: rateDate,
        source: 'Rubber Board India',
        url: 'https://rubberboard.gov.in/public'
      };
    } else {
      console.log('⚠️ Could not find latex rate in the page');
      return {
        success: false,
        error: 'Latex rate not found in page',
        rate: null
      };
    }

  } catch (error) {
    console.error('❌ Error fetching latex rate:', error.message);
    return {
      success: false,
      error: error.message,
      rate: null
    };
  }
}

/**
 * Get cached rate or fetch new one
 */
let cachedRate = null;
let cacheTime = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getLatexRate(forceRefresh = false) {
  const now = Date.now();
  
  // Return cached rate if available and not expired
  if (!forceRefresh && cachedRate && cacheTime && (now - cacheTime < CACHE_DURATION)) {
    console.log('📦 Returning cached latex rate');
    return {
      ...cachedRate,
      cached: true,
      cacheAge: Math.floor((now - cacheTime) / 1000) // seconds
    };
  }

  // Fetch new rate
  const result = await fetchLatexRate();
  
  if (result.success) {
    cachedRate = result;
    cacheTime = now;
  }

  return {
    ...result,
    cached: false
  };
}

module.exports = {
  fetchLatexRate,
  getLatexRate
};
