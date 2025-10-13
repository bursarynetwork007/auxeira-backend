const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const axios = require('axios');
const { prompts } = require('../prompts/esg-prompts');

const openai = new OpenAI({
  apiKey: process.env.NANOGPT5_API_KEY || process.env.OPENAI_API_KEY
});

router.post('/generate', async (req, res) => {
  try {
    const { profile, reportType } = req.body;
    if (!profile || !reportType) {
      return res.status(400).json({success: false, error: 'profile and reportType required'});
    }

    console.log(`📊 Generating ${reportType} for ${profile.organizationName}`);

    // Step 1: Scrape website data with Thunderbit
    let scrapedData = 'No website data available. Using profile information only.';
    if (profile.websiteUrl) {
      try {
        console.log(`🕷️  Scraping ${profile.websiteUrl} with Thunderbit...`);
        const scrapeUrl = `https://api.thunderbit.com/v1/scrape?url=${encodeURIComponent(profile.websiteUrl)}`;
        const scrapeResponse = await axios.get(scrapeUrl, {
          headers: {
            'Authorization': `Bearer ${process.env.THUNDERBIT_API_KEY}`
          },
          timeout: 10000
        });
        
        if (scrapeResponse.data && scrapeResponse.data.content) {
          scrapedData = `Website Data from ${profile.websiteUrl}:\n${scrapeResponse.data.content.substring(0, 1000)}`;
          console.log('✅ Website scraped successfully');
        }
      } catch (scrapeError) {
        console.log('⚠️  Scraping failed, continuing with profile data only:', scrapeError.message);
      }
    }

    // Step 2: Get the appropriate prompt
    const promptGenerator = prompts[reportType];
    if (!promptGenerator) {
      return res.status(400).json({success: false, error: `Unknown report type: ${reportType}`});
    }

    const { system, user } = promptGenerator(profile, scrapedData);

    // Step 3: Call OpenAI with extended token limit
    console.log('🤖 Calling OpenAI GPT-4...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      max_tokens: 4096,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;
    console.log(`✅ AI generation complete (${completion.usage.total_tokens} tokens)`);
    
    // Step 4: Parse JSON response
    let data;
    try {
      const clean = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      data = JSON.parse(clean);
      console.log(`✅ Parsed report: ${data.title}`);
    } catch (e) {
      console.error('❌ JSON parse error:', e.message);
      console.error('First 200 chars of response:', aiResponse.substring(0, 200));
      throw new Error('Failed to parse AI response as valid JSON');
    }

    // Step 5: Return structured response
    res.json({
      success: true,
      title: data.title,
      executive_summary: data.executive_summary,
      full_narrative: data.full_narrative,
      key_metrics: data.key_metrics || [],
      success_stories: data.success_stories || [],
      policy_insights: data.policy_insights || '',
      roi_projection: data.roi_projection || '',
      recommended_actions: data.recommended_actions || [],
      chart_data: data.chart_data || null,
      tokensUsed: completion.usage.total_tokens,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Report generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate report',
      details: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

module.exports = router;
