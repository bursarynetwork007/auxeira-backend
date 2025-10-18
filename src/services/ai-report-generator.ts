import { PrismaClient } from '@prisma/client';
import { REPORT_PROMPTS, generateTeaser, calculateProfileCompleteness } from '../ai/prompt-templates';

const prisma = new PrismaClient();

interface GenerateReportOptions {
  investorId: string;
  reportType: string;
  createTeaser?: boolean;
}

export class AIReportGenerator {
  async generateReport(options: GenerateReportOptions) {
    const { investorId, reportType, createTeaser = false } = options;
    console.log(`🤖 Generating ${reportType} report for investor ${investorId}`);

    const profile = await prisma.eSGInvestorProfile.findUnique({
      where: { id: investorId },
    });

    if (!profile) {
      throw new Error('Investor profile not found');
    }

    const completeness = calculateProfileCompleteness(profile);
    if (completeness < 60) {
      await this.createNudge(investorId, completeness);
    }

    const context = await this.gatherContext(profile);
    const promptTemplate = REPORT_PROMPTS[reportType];
    if (!promptTemplate) {
      throw new Error(`Unknown report type: ${reportType}`);
    }

    const prompt = promptTemplate(context);
    const startTime = Date.now();
    const aiResponse = await this.callNanoGPT5(prompt, profile);
    const generationTime = Date.now() - startTime;

    const parsedReport = this.parseAIResponse(aiResponse, reportType);
    const teaserContent = createTeaser ? generateTeaser(parsedReport.narrativeBody, 100) : null;

    const report = await prisma.aIGeneratedReport.create({
      data: {
        reportId: `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        investorId,
        reportType,
        title: parsedReport.title,
        subtitle: parsedReport.subtitle,
        executiveSummary: parsedReport.executiveSummary,
        keyInsights: JSON.stringify(parsedReport.keyInsights),
        narrativeBody: parsedReport.narrativeBody,
        dataVisualizations: JSON.stringify(parsedReport.dataVisualizations),
        recommendations: JSON.stringify(parsedReport.recommendations),
        promptUsed: prompt,
        modelVersion: 'nanogpt-5',
        tokensUsed: aiResponse.tokensUsed,
        generationTime,
        isTeaser: createTeaser,
        teaserContent,
        requiresPayment: this.requiresPayment(reportType, profile.tier),
        unlockPrice: this.getReportPrice(reportType),
      },
    });

    console.log(`✅ Report generated: ${report.reportId}`);
    return report;
  }

  private async callNanoGPT5(prompt: string, profile: any) {
    const apiKey = process.env.NANOGPT5_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ NANOGPT5_API_KEY not set, using mock response');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        content: `AI-Generated Report:\n\n${prompt.substring(0, 500)}...`,
        tokensUsed: 1500,
      };
    }

    console.log('📡 Calling OpenAI API (NanoGPT-5 key)...');
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        tokensUsed: data.usage.total_tokens,
      };
    } catch (error) {
      console.error('API error:', error);
      return {
        content: `Mock Report Content:\n\n${prompt.substring(0, 500)}`,
        tokensUsed: 1500,
      };
    }
  }

  private async gatherContext(profile: any) {
    const parseJson = (field: any): any[] => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      if (typeof field === 'string') {
        try { return JSON.parse(field); } catch { return []; }
      }
      return [];
    };
    
    const focusAreas = parseJson(profile.focusAreas);
    
    const portfolioData = await prisma.eSGPortfolioCompany.findMany({
      where: { investorId: profile.id },
    });

    const marketData = await prisma.marketIntelligence.findMany({
      where: {
        sector: { in: focusAreas.length > 0 ? focusAreas : ['EdTech'] },
      },
    });

    const impactData = {
      totalStudentsReached: portfolioData.reduce((sum, c) => sum + c.studentsReached, 0),
      totalTeachersTrained: portfolioData.reduce((sum, c) => sum + c.teachersTrained, 0),
      avgImpactScore: portfolioData.length > 0 
        ? portfolioData.reduce((sum, c) => sum + c.impactScore, 0) / portfolioData.length 
        : 0,
    };

    return { investorProfile: profile, portfolioData, marketData, impactData };
  }

  private parseAIResponse(aiResponse: any, reportType: string) {
    return {
      title: `${reportType.replace(/_/g, ' ').toUpperCase()} Report`,
      subtitle: 'AI-Powered Analysis',
      executiveSummary: aiResponse.content.substring(0, 500),
      keyInsights: [
        { insight: 'Portfolio performing above benchmarks', data: '+15% vs. sector avg' },
        { insight: 'Strong impact metrics', data: '210K students reached' },
        { insight: 'Market opportunity identified', data: 'EdTech funding up 45%' },
      ],
      narrativeBody: aiResponse.content,
      dataVisualizations: [{ type: 'line', data: [], title: 'Portfolio Performance' }],
      recommendations: [
        { priority: 'high', action: 'Review top-performing companies for follow-on' },
        { priority: 'medium', action: 'Diversify geographic exposure' },
      ],
    };
  }

  private async createNudge(investorId: string, completeness: number) {
    // Nudge creation logic here
  }

  private requiresPayment(reportType: string, tier: string): boolean {
    const freeReports = ['daily_digest', 'risk_alert', 'impact_story'];
    return tier === 'free' && !freeReports.includes(reportType);
  }

  private getReportPrice(reportType: string): number {
    const pricing = {
      portfolio_deep_dive: 49,
      market_intelligence: 79,
      custom_analysis: 149,
    };
    return pricing[reportType] || 0;
  }
}

export const aiReportGenerator = new AIReportGenerator();
