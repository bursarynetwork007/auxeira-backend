/**
 * AI Assessment Service
 * Uses Claude AI to assess activity submissions and generate quality scores
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AssessmentResult {
  quality_score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  consistency_weeks: number;
}

interface ActivityContext {
  activity_name: string;
  activity_description: string;
  category: string;
  tier: string;
  nudges: string[];
}

/**
 * Assess an activity submission using Claude AI
 */
export async function assessActivitySubmission(
  proofText: string,
  proofUrls: string[],
  activityContext: ActivityContext
): Promise<AssessmentResult> {
  try {
    const prompt = buildAssessmentPrompt(proofText, proofUrls, activityContext);

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse Claude's response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const assessment = parseAssessmentResponse(responseText);

    logger.info(`AI Assessment completed: quality_score=${assessment.quality_score}`);

    return assessment;
  } catch (error) {
    logger.error('AI Assessment failed:', error);
    // Return default assessment on error
    return {
      quality_score: 0.7,
      feedback: 'Assessment completed with default scoring due to processing error.',
      strengths: ['Submission received'],
      improvements: ['Please provide more detailed information'],
      consistency_weeks: 0,
    };
  }
}

/**
 * Build the assessment prompt for Claude
 */
function buildAssessmentPrompt(
  proofText: string,
  proofUrls: string[],
  context: ActivityContext
): string {
  return `You are an expert startup advisor assessing a founder's activity submission for the Auxeira platform.

**Activity Details:**
- Name: ${context.activity_name}
- Description: ${context.activity_description}
- Category: ${context.category}
- Tier: ${context.tier}

**Best Practice Nudges:**
${context.nudges.map((nudge, i) => `${i + 1}. ${nudge}`).join('\n')}

**Founder's Submission:**
${proofText}

${proofUrls.length > 0 ? `**Proof URLs:**\n${proofUrls.join('\n')}` : ''}

**Your Task:**
Assess this submission and provide:
1. A quality score (0.0 to 1.0) based on:
   - Completeness: Did they address all requirements?
   - Quality: Is the work thorough and well-documented?
   - Best practices: Did they follow the nudges provided?
   - Impact: Does this demonstrate meaningful progress?

2. Constructive feedback highlighting:
   - Strengths (what they did well)
   - Areas for improvement

**Scoring Guidelines:**
- 0.9-1.0: Exceptional - Exceeds all requirements, exemplary execution
- 0.8-0.89: Excellent - Meets all requirements with high quality
- 0.7-0.79: Good - Meets requirements with minor gaps
- 0.6-0.69: Satisfactory - Meets basic requirements
- Below 0.6: Needs improvement - Missing key elements

**Response Format (JSON):**
{
  "quality_score": 0.85,
  "feedback": "Overall assessment summary",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "consistency_weeks": 0
}

Provide your assessment in JSON format only.`;
}

/**
 * Parse Claude's response into structured assessment
 */
function parseAssessmentResponse(responseText: string): AssessmentResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize quality score
      let qualityScore = parseFloat(parsed.quality_score);
      if (isNaN(qualityScore) || qualityScore < 0) qualityScore = 0.5;
      if (qualityScore > 1) qualityScore = 1.0;

      return {
        quality_score: qualityScore,
        feedback: parsed.feedback || 'Assessment completed.',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        consistency_weeks: parsed.consistency_weeks || 0,
      };
    }
  } catch (error) {
    logger.error('Failed to parse AI response:', error);
  }

  // Fallback: Try to extract quality score from text
  const scoreMatch = responseText.match(/quality[_\s]score[:\s]+([0-9.]+)/i);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.7;

  return {
    quality_score: Math.min(Math.max(score, 0), 1),
    feedback: responseText.substring(0, 500),
    strengths: [],
    improvements: [],
    consistency_weeks: 0,
  };
}

/**
 * Batch assess multiple submissions
 */
export async function batchAssessSubmissions(
  submissions: Array<{
    id: string;
    proofText: string;
    proofUrls: string[];
    activityContext: ActivityContext;
  }>
): Promise<Map<string, AssessmentResult>> {
  const results = new Map<string, AssessmentResult>();

  // Process submissions sequentially to avoid rate limits
  for (const submission of submissions) {
    try {
      const assessment = await assessActivitySubmission(
        submission.proofText,
        submission.proofUrls,
        submission.activityContext
      );
      results.set(submission.id, assessment);
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error(`Failed to assess submission ${submission.id}:`, error);
      results.set(submission.id, {
        quality_score: 0.7,
        feedback: 'Assessment failed, using default score.',
        strengths: [],
        improvements: [],
        consistency_weeks: 0,
      });
    }
  }

  return results;
}

/**
 * Quick validation check (without full AI assessment)
 */
export function validateSubmission(proofText: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check minimum length
  if (proofText.length < 50) {
    errors.push('Proof text must be at least 50 characters');
  }

  // Check maximum length
  if (proofText.length > 5000) {
    errors.push('Proof text must not exceed 5000 characters');
  }

  // Check for meaningful content (not just spaces/newlines)
  const meaningfulContent = proofText.replace(/\s+/g, ' ').trim();
  if (meaningfulContent.length < 30) {
    errors.push('Proof text must contain meaningful content');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
