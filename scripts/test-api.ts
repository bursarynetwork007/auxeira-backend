import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

async function testAPI() {
  const BASE_URL = 'http://localhost:3000/api';
  const userId = 'test_user_' + Date.now();

  console.log('🧪 Testing Auxeira API\n');

  // 1. Create profile
  console.log('1️⃣ Creating user profile...');
  const profileResponse = await fetch(`${BASE_URL}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      organizationName: 'Test Education Fund',
      websiteUrl: 'https://www.edsurge.com',
      sectorType: 'Impact Fund',
      country: 'Kenya',
      focusAreas: ['Teacher training', 'Digital literacy'],
      sdgAlignment: [4, 5],
      goalStatement: 'Improve literacy outcomes',
      annualEducationSpend: 5000000,
      kpisOfInterest: ['Students reached', 'Teacher capacity'],
      relevantPolicies: ['UNESCO 2030'],
    }),
  });
  const profileData = await profileResponse.json();
  console.log(`✅ Profile created: ${profileData.profileId}\n`);

  // 2. Generate report
  console.log('2️⃣ Generating Impact Story report...');
  const reportResponse = await fetch(`${BASE_URL}/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      reportType: 'impact_story',
    }),
  });
  const reportData = await reportResponse.json();
  console.log(`✅ Report generated: ${reportData.reportId}`);
  console.log(`   Title: ${reportData.title}`);
  console.log(`   Tokens: ${reportData.tokensUsed}`);
  console.log(`   Time: ${reportData.generationTime}ms\n`);

  // 3. List reports
  console.log('3️⃣ Listing user reports...');
  const listResponse = await fetch(`${BASE_URL}/reports/user/${userId}`);
  const listData = await listResponse.json();
  console.log(`✅ Found ${listData.reports.length} reports\n`);

  console.log('🎉 API Test Complete!');
}

// Start server first, then test
setTimeout(testAPI, 3000);
