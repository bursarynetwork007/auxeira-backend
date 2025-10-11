import { aiReportGenerator } from '../src/services/ai-report-generator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNanoGPT5Reports() {
  console.log('🤖 Testing NanoGPT-5 Report Generation\n');

  // Create a test investor profile
  const profile = await prisma.eSGInvestorProfile.upsert({
    where: { userId: 'test_investor_001' },
    update: {},
    create: {
      userId: 'test_investor_001',
      investorName: 'Sarah Chen',
      fundName: 'Impact Education Fund',
      investorType: 'Impact Fund',
      tier: 'premium',
      focusAreas: JSON.stringify(['EdTech', 'Teacher Training']),
      geographicFocus: JSON.stringify(['Sub-Saharan Africa', 'South Asia']),
      ticketSize: '$250K-1M',
      stagePreference: JSON.stringify(['Seed', 'Series A']),
      primarySDG: JSON.stringify([4, 5, 10]),
      impactMetrics: JSON.stringify(['Students Reached', 'Learning Gain']),
      theoryOfChange: 'Technology-enabled teacher training creates multiplier effects',
      reportingFrequency: 'daily',
      narrativeStyle: 'balanced',
      aiPersonaType: 'visionary',
      profileCompleteness: 85,
    },
  });

  console.log(`✅ Test profile created: ${profile.investorName}\n`);

  // Test 1: Daily Digest (Free)
  console.log('📰 Test 1: Generating Daily Digest (Free Report)...');
  try {
    const dailyDigest = await aiReportGenerator.generateReport({
      investorId: profile.id,
      reportType: 'daily_digest',
      createTeaser: false,
    });
    
    console.log(`✅ Report ID: ${dailyDigest.reportId}`);
    console.log(`📝 Title: ${dailyDigest.title}`);
    console.log(`⏱️  Generation time: ${dailyDigest.generationTime}ms`);
    console.log(`🪙 Tokens used: ${dailyDigest.tokensUsed}`);
    console.log(`\n📊 Executive Summary:`);
    console.log(dailyDigest.executiveSummary.substring(0, 200) + '...\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 2: Portfolio Deep Dive (Premium - with teaser)
  console.log('\n🔍 Test 2: Generating Portfolio Deep Dive (Premium Teaser)...');
  try {
    const deepDive = await aiReportGenerator.generateReport({
      investorId: profile.id,
      reportType: 'portfolio_deep_dive',
      createTeaser: true,
    });
    
    console.log(`✅ Report ID: ${deepDive.reportId}`);
    console.log(`💰 Price: $${deepDive.unlockPrice}`);
    console.log(`🔒 Requires payment: ${deepDive.requiresPayment}`);
    console.log(`\n�� Teaser (first 100 words):`);
    console.log(deepDive.teaserContent + '\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 3: Impact Story (Free)
  console.log('\n❤️  Test 3: Generating Impact Story...');
  try {
    const impactStory = await aiReportGenerator.generateReport({
      investorId: profile.id,
      reportType: 'impact_story',
      createTeaser: false,
    });
    
    console.log(`✅ Report ID: ${impactStory.reportId}`);
    console.log(`📖 Story Title: ${impactStory.title}`);
    console.log(`\n📝 Narrative Preview:`);
    console.log(impactStory.narrativeBody.substring(0, 300) + '...\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Check all generated reports
  const allReports = await prisma.aIGeneratedReport.findMany({
    where: { investorId: profile.id },
    orderBy: { generatedAt: 'desc' },
  });

  console.log(`\n📊 Total Reports Generated: ${allReports.length}`);
  console.log('\nReport Summary:');
  allReports.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.reportType} - ${r.requiresPayment ? `$${r.unlockPrice}` : 'FREE'} - ${r.generationTime}ms`);
  });

  console.log('\n✅ NanoGPT-5 Integration Test Complete!');
}

testNanoGPT5Reports()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
