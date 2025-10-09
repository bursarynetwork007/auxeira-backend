import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDashboardData() {
  console.log('🌱 Seeding dashboard data...');

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

  // Seed market intelligence
  const sectors = [
    { sector: 'AI/ML', growth: 45.2, funding: 12500000000, dealCount: 1250, avgValuation: 85000000, momentum: 'accelerating' },
    { sector: 'Fintech', growth: 23.8, funding: 8900000000, dealCount: 890, avgValuation: 65000000, momentum: 'stable' },
    { sector: 'Healthcare', growth: 18.5, funding: 7200000000, dealCount: 720, avgValuation: 55000000, momentum: 'recovering' },
  ];

  for (const sector of sectors) {
    await prisma.marketIntelligence.upsert({
      where: { sector: sector.sector },
      update: { ...sector, lastUpdate: new Date() },
      create: { ...sector, lastUpdate: new Date() },
    });
  }

  console.log('✅ Market intelligence seeded');
  console.log('🎉 Dashboard data seeding complete!');
}

seedDashboardData()
  .catch((e) => {
    console.error('❌ Error seeding dashboard data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
