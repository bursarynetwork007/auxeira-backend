import { thunderbitCrawler } from '../src/services/thunderbit-crawler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function monitorCrawler() {
  console.log('📊 Crawler Health Check\n');
  
  // Test API connectivity
  try {
    const testData = await thunderbitCrawler.fetchEdTechFunding('EdTech');
    console.log('✅ API Connection: OK');
    console.log(`   Found ${testData.totalDeals} deals`);
  } catch (error) {
    console.error('❌ API Connection: FAILED');
    console.error('   Error:', error.message);
  }
  
  // Check data freshness
  const marketData = await prisma.marketIntelligence.findUnique({
    where: { sector: 'EdTech' },
  });
  
  if (marketData) {
    const hoursSinceUpdate = (Date.now() - marketData.lastUpdate.getTime()) / (1000 * 60 * 60);
    console.log(`\n📅 Data Freshness: ${hoursSinceUpdate.toFixed(1)} hours ago`);
    
    if (hoursSinceUpdate > 24) {
      console.warn('⚠️  Data is stale! Run daily refresh.');
    } else {
      console.log('✅ Data is fresh');
    }
  }
  
  // Check API rate limits
  console.log('\n📈 API Usage:');
  console.log('   Daily requests: [Check your dashboard]');
  console.log('   Rate limit: 2 req/sec');
  console.log('   Thunderbit Dashboard: https://thunderbit.com/dashboard');
  
  await prisma.$disconnect();
}

monitorCrawler().catch(console.error);
