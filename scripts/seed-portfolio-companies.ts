import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPortfolio() {
  console.log('📊 Creating mock portfolio companies...');

  const investor = await prisma.eSGInvestorProfile.findFirst({
    where: { userId: 'test_investor_001' },
  });

  if (!investor) {
    console.error('❌ Investor not found');
    return;
  }

  // Add ESGPortfolioCompany schema first
  console.log('⚠️  ESGPortfolioCompany table needed. Adding to schema...');
}

seedPortfolio().catch(console.error).finally(() => prisma.$disconnect());
