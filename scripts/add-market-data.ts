import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMarketData() {
  const sectors = [
    {
      sector: 'EdTech',
      growth: 45.2,
      funding: 12500000000,
      dealCount: 1250,
      avgValuation: 85000000,
      momentum: 'accelerating',
      hotKeywords: JSON.stringify(['AI', 'Personalization', 'Teacher Training']),
      emergingTrends: JSON.stringify(['Adaptive Learning', 'Micro-credentials']),
      riskFactors: JSON.stringify(['Regulation', 'Privacy concerns']),
    },
  ];

  for (const sector of sectors) {
    await prisma.marketIntelligence.upsert({
      where: { sector: sector.sector },
      update: sector,
      create: sector,
    });
  }

  console.log('✅ Market data added');
}

addMarketData().catch(console.error).finally(() => prisma.$disconnect());
