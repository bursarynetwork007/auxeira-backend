const express = require('express');
const router = express.Router();
const axios = require('axios');

// Report pricing
const REPORT_PRICES = {
  impact_story: 0, // FREE
  comparative_benchmark: 0, // FREE
  scalability_expansion: 39900, // $399 in cents
  stakeholder_engagement: 34900, // $349
  risk_adjusted_roi: 49900, // $499
  cross_sector_collaboration: 44900, // $449
  policy_alignment: 29900, // $299
  roi_metrics_dashboard: 39900, // $399
  cross_impact_opportunity: 44900, // $449
  materiality_assessment: 49900, // $499
  carbon_decarbonization: 44900, // $449
  fund_benchmarking: 39900, // $399
  regulatory_compliance: 49900, // $499
  policy_risk_watch: 29900, // $299
  esg_scorecard: 34900 // $349
};

// Initialize payment
router.post('/initialize', async (req, res) => {
  try {
    const { email, reportType, profile } = req.body;
    
    const amount = REPORT_PRICES[reportType];
    if (amount === undefined) {
      return res.status(400).json({ success: false, error: 'Invalid report type' });
    }

    if (amount === 0) {
      return res.json({ success: true, isFree: true });
    }

    // Initialize Paystack transaction
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount, // in cents
        currency: 'ZAR',
        metadata: {
          reportType,
          organizationName: profile.organizationName,
          custom_fields: [
            {
              display_name: "Report Type",
              variable_name: "report_type",
              value: reportType
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      authorization_url: response.data.data.authorization_url,
      access_code: response.data.data.access_code,
      reference: response.data.data.reference
    });

  } catch (error) {
    console.error('Payment initialization error:', error.response?.data || error);
    res.status(500).json({ success: false, error: 'Payment initialization failed' });
  }
});

// Verify payment
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const data = response.data.data;
    
    if (data.status === 'success') {
      res.json({
        success: true,
        paid: true,
        reportType: data.metadata.reportType,
        amount: data.amount / 100
      });
    } else {
      res.json({ success: false, paid: false });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

module.exports = router;
