import { PrismaClient } from '@prisma/client';
import { aiReportGenerator } from '../src/services/ai-report-generator';

const prisma = new PrismaClient();

/**
 * Daily AI Report Refresh
 * Runs at 6 AM daily, generates fresh reports for all active investors
 */
async function dailyReportRefresh() {
  console.log(' Starting daily AI report refresh...');

  // Get all active investors
  const investors = await prisma.eSGInvestorProfile.findMany({
    where: {
      reportingFrequency: 'daily',
    },
  });

  console.log(`Found ${investors.length} investors for daily reports`);

  for (const investor of investors) {
    try {
      console.log(`\n Generating reports for ${investor.investorName || investor.userId}`);

      // Free tier: Teaser only
      if (investor.tier === 'free') {
        await aiReportGenerator.generateReport({
          investorId: investor.id,
          reportType: 'daily_digest',
          createTeaser: true,
        });
      }

      // Premium tier: Full daily digest + 1 deep dive per week
      if (investor.tier === 'premium') {
        await aiReportGenerator.generateReport({
          investorId: investor.id,
          reportType: 'daily_digest',
          createTeaser: false,
        });

        // Weekly deep dive on Mondays
        if (new Date().getDay() === 1) {
          await aiReportGenerator.generateReport({
            investorId: investor.id,
            reportType: 'portfolio_deep_dive',
            createTeaser: false,
          });
        }
      }

      // Enterprise tier: Full suite
      if (investor.tier === 'enterprise') {
        await aiReportGenerator.generateReport({
          investorId: investor.id,
          reportType: 'daily_digest',
          createTeaser: false,
        });

        await aiReportGenerator.generateReport({
          investorId: investor.id,
          reportType: 'market_intelligence',
          createTeaser: false,
        });
      }

      console.log(` Reports generated for ${investor.investorName}`);
    } catch (error) {
      console.error(` Error generating reports for ${investor.id}:`, error);
    }
  }

  console.log('\n Daily report refresh complete!');
}

dailyReportRefresh()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
