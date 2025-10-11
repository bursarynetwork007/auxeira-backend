import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateSimulationData() {
  console.log('🎲 Generating 10,000 startup simulations...');
  
  const sectors = ['AI/ML', 'Fintech', 'Healthcare', 'EdTech', 'CleanTech', 'SaaS', 'Cybersecurity'];
  const stages = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C'];
  const now = new Date();
  
  const startups = [];
  
  for (let i = 0; i < 10000; i++) {
    const daysAgo = Math.floor(Math.random() * 365);
    const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    const baseSSE = 30 + Math.floor(Math.random() * 60);
    const seasonalBoost = Math.sin((daysAgo / 365) * Math.PI * 2) * 10;
    
    startups.push({
      userId: `sim_user_${i}`,
      companyName: `Startup ${i}`,
      industry: sectors[Math.floor(Math.random() * sectors.length)],
      stage: stages[Math.floor(Math.random() * stages.length)],
      foundedDate: new Date(timestamp.getTime() - Math.random() * 730 * 24 * 60 * 60 * 1000),
      sseScore: Math.round(baseSSE + seasonalBoost),
      sseScoreHistory: [],
      mrr: Math.floor(10000 + Math.random() * 200000),
      arr: 0,
      growthRate: 5 + Math.random() * 45,
      burnRate: Math.floor(5000 + Math.random() * 95000),
      runway: Math.floor(6 + Math.random() * 30),
      employees: Math.floor(3 + Math.random() * 150),
      customers: Math.floor(10 + Math.random() * 5000),
      lastMetricsUpdate: timestamp,
      createdAt: timestamp,
    });
  }
  
  console.log('💾 Inserting into database (batched)...');
  
  const batchSize = 1000;
  for (let i = 0; i < startups.length; i += batchSize) {
    const batch = startups.slice(i, i + batchSize);
    await prisma.startupProfile.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(startups.length / batchSize)}`);
  }
  
  console.log('✅ 10,000 startups generated!');
}

generateSimulationData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
