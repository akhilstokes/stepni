const express = require('express');
const router = express.Router();
const { getLatexRate } = require('../services/rubberBoardScraper');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/rubber-rate/latex
 * @desc    Get current latex rate from Rubber Board
 * @access  Private (Accountant/Manager)
 */
router.get('/latex', protect, async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const result = await getLatexRate(forceRefresh);

    if (result.success) {
      res.json({
        success: true,
        data: {
          rate: result.rate,
          date: result.date,
          source: result.source,
          url: result.url,
          cached: result.cached,
          cacheAge: result.cacheAge,
          fetchedAt: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch latex rate',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in latex rate endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching latex rate',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/rubber-rate/test
 * @desc    Test endpoint to check if scraper is working
 * @access  Private
 */
router.get('/test', protect, async (req, res) => {
  try {
    const result = await getLatexRate(true); // Force refresh
    res.json({
      success: true,
      message: 'Scraper test completed',
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Scraper test failed',
      error: error.message
    });
  }
});

module.exports = router;
