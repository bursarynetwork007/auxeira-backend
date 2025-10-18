import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSamplePortfolio() {
  const investor = await prisma.eSGInvestorProfile.findFirst({
    where: { userId: 'test_investor_001' },
  });

  if (!investor) return;

  const companies = [
    {
      investorId: investor.id,
      companyName: 'EduTech Solutions',
      sector: 'EdTech',
      stage: 'Series A',
      investment: 500000,
      currentValue: 1200000,
      roi: 2.4,
      impactScore: 85,
      studentsReached: 125000,
      teachersTrained: 2500,
      schoolsSupported: 150,
      status: 'Strong Performer',
      riskLevel: 'low',
    },
    {
      investorId: investor.id,
      companyName: 'TeacherAI',
      sector: 'Teacher Training',
      stage: 'Seed',
      investment: 250000,
      currentValue: 400000,
      roi: 1.6,
      impactScore: 78,
      studentsReached: 85000,
      teachersTrained: 5000,
      schoolsSupported: 75,
      status: 'Healthy',
      riskLevel: 'medium',
    },
  ];

  for (const company of companies) {
    await prisma.eSGPortfolioCompany.create({ data: company });
  }

  console.log('✅ Sample portfolio created');
}

addSamplePortfolio().catch(console.error).finally(() => prisma.$disconnect());
