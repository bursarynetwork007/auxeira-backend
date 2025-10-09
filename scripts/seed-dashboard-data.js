const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDashboardData() {
  console.log('🌱 Seeding dashboard data...');

  try {
    // Seed dashboard locations
    const dashboardTypes = [
      'startup', 'vc', 'angel_investor', 'corporate_partner', 
      'government', 'esg_education', 'esg_index'
    ];

    for (const type of dashboardTypes) {
      await prisma.dashboardLocation.upsert({
        where: { dashboardType: type },
        update: {},
        create: {
          dashboardType: type,
          originalPath: `/workspaces/auxeira-backend/dashboard/${type}.html`,
          currentPath: `/workspaces/auxeira-backend/dashboard/${type}.html`,
          notes: `${type} dashboard`,
          isActive: true
        }
      });
    }

    console.log('✅ Dashboard locations seeded');

    // Seed market intelligence with string fields (for SQLite compatibility)
    const sectors = [
      { 
        sector: 'AI/ML', 
        growth: 45.2, 
        funding: 12500000000, 
        dealCount: 1250, 
        avgValuation: 85000000, 
        momentum: 'accelerating',
        hotKeywords: 'machine learning,neural networks,deep learning',
        emergingTrends: 'generative AI,LLMs,computer vision',
        riskFactors: 'regulation,ethics,compute costs'
      },
      { 
        sector: 'Fintech', 
        growth: 23.8, 
        funding: 8900000000, 
        dealCount: 890, 
        avgValuation: 65000000, 
        momentum: 'stable',
        hotKeywords: 'digital banking,blockchain,payments',
        emergingTrends: 'DeFi,embedded finance,open banking',
        riskFactors: 'compliance,cybersecurity,market volatility'
      }
    ];

    for (const sector of sectors) {
      await prisma.marketIntelligence.upsert({
        where: { sector: sector.sector },
        update: { 
          ...sector, 
          lastUpdate: new Date() 
        },
        create: { 
          ...sector, 
          lastUpdate: new Date() 
        },
      });
    }

    console.log('✅ Market intelligence seeded');

    // Seed data update schedules
    const schedules = [
      {
        entityType: 'dashboard',
        entityId: 'all',
        metric: 'file_locations',
        updateFrequency: 'daily',
        nextUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    ];

    for (const schedule of schedules) {
      await prisma.dataUpdateSchedule.upsert({
        where: {
          entityType_entityId_metric: {
            entityType: schedule.entityType,
            entityId: schedule.entityId,
            metric: schedule.metric
          }
        },
        update: schedule,
        create: schedule
      });
    }

    console.log('✅ Data update schedules seeded');
    console.log('🎉 Dashboard data seeding complete!');

  } catch (error) {
    console.error('❌ Error seeding dashboard data:', error);
    console.log('Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedDashboardData();
