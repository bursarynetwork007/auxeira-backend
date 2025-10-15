const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: `You are an ESG report generator. Output ONLY valid JSON with these exact keys: title, executive_summary, full_narrative, key_metrics (array of objects with metric/value/source), success_stories (array with title/narrative), policy_insights, roi_projection, recommended_actions (array of strings). No markdown, no extra text.`
        },
        { 
          role: 'user', 
          content: `Generate an impact story report for ${profile.organizationName} (${profile.sectorType}) in ${profile.country}. Focus: ${profile.focusAreas}. Goals: ${profile.goalStatement}. Include realistic metrics, compelling narrative, and actionable recommendations.`
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;
    
    // Parse JSON
    let data;
    try {
      const clean = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      data = JSON.parse(clean);
    } catch (e) {
      console.error('Parse error:', e);
      throw new Error('Failed to parse AI response');
    }

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
      tokensUsed: completion.usage.total_tokens,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({success: false, error: error.message});
  }
});

module.exports = router;
