/**
 * Business Structure Change - Seed Data
 * Creates timestamped simulated cases for testing
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Business structure types
const STRUCTURES = {
  SOLE_PROPRIETORSHIP: 'SOLE_PROPRIETORSHIP',
  PARTNERSHIP: 'PARTNERSHIP',
  LLC: 'LLC',
  CORPORATION: 'CORPORATION',
  S_CORP: 'S_CORP',
  C_CORP: 'C_CORP',
  NONPROFIT: 'NONPROFIT',
  COOPERATIVE: 'COOPERATIVE',
};

// Payment statuses
const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

// Generate realistic company names
const COMPANY_NAMES = [
  'TechVenture Solutions',
  'GreenEarth Innovations',
  'HealthFirst Medical',
  'EduTech Learning Platform',
  'FinanceFlow Systems',
  'AgriGrow Enterprises',
  'CloudSync Technologies',
  'RetailPro Commerce',
  'LogiTrack Logistics',
  'EnergyWise Solutions',
  'FoodHub Delivery',
  'PropTech Realty',
  'MediaStream Productions',
  'CyberShield Security',
  'BioMed Research Labs',
];

// Generate test user IDs
function generateUserId(index) {
  return `user_${String(index).padStart(4, '0')}`;
}

// Generate payment reference
function generatePaymentReference() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `AUX-BSU-${timestamp}-${random}`;
}

// Generate Paystack reference
function generatePaystackReference() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `pstk_${timestamp}_${random}`;
}

// Get random date in the past N days
function getRandomPastDate(daysAgo) {
  const now = new Date();
  const past = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  const random = new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
  return random;
}

// Get future date N days from now
function getFutureDate(daysFromNow) {
  const now = new Date();
  return new Date(now.getTime() + (daysFromNow * 24 * 60 * 60 * 1000));
}

// Generate business structure change cases
async function seedBusinessStructureChanges() {
  console.log('🌱 Seeding business structure change cases...');

  const cases = [];

  // Case 1-5: Pending payment (recent changes)
  for (let i = 0; i < 5; i++) {
    const changeDate = getRandomPastDate(7); // Last 7 days
    cases.push({
      userId: generateUserId(i + 1),
      companyName: COMPANY_NAMES[i],
      oldStructure: STRUCTURES.SOLE_PROPRIETORSHIP,
      newStructure: STRUCTURES.LLC,
      changeReason: 'Business growth and liability protection',
      changeDescription: 'Transitioning to LLC for better legal protection and tax benefits',
      status: 'pending_payment',
      requiresPayment: true,
      paymentStatus: PAYMENT_STATUS.PENDING,
      paymentAmount: 200000, // ₦2,000 in kobo
      paymentCurrency: 'NGN',
      paymentReference: generatePaymentReference(),
      changeDetectedAt: changeDate,
      changeEffectiveDate: getFutureDate(30),
      paymentDueDate: getFutureDate(7),
      isSynthetic: true,
      syntheticSeed: `seed_pending_${i + 1}`,
      metadata: JSON.stringify({
        detectionMethod: 'automatic',
        confidence: 0.95,
        source: 'user_profile_update',
      }),
    });
  }

  // Case 6-10: Payment completed (access restored)
  for (let i = 5; i < 10; i++) {
    const changeDate = getRandomPastDate(30); // Last 30 days
    const paymentDate = new Date(changeDate.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days after change
    const paystackRef = generatePaystackReference();
    
    cases.push({
      userId: generateUserId(i + 1),
      companyName: COMPANY_NAMES[i],
      oldStructure: STRUCTURES.PARTNERSHIP,
      newStructure: STRUCTURES.CORPORATION,
      changeReason: 'Seeking investment and scaling operations',
      changeDescription: 'Converting to corporation to attract venture capital',
      status: 'completed',
      requiresPayment: true,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      paymentAmount: 200000,
      paymentCurrency: 'NGN',
      paymentReference: generatePaymentReference(),
      paystackReference: paystackRef,
      paystackStatus: 'success',
      paystackResponse: JSON.stringify({
        status: true,
        message: 'Verification successful',
        data: {
          amount: 20000000, // kobo
          currency: 'NGN',
          transaction_date: paymentDate.toISOString(),
          status: 'success',
        },
      }),
      paymentDate: paymentDate,
      changeDetectedAt: changeDate,
      changeEffectiveDate: paymentDate,
      accessRestoredAt: paymentDate,
      isSynthetic: true,
      syntheticSeed: `seed_completed_${i + 1}`,
      metadata: JSON.stringify({
        detectionMethod: 'automatic',
        confidence: 0.98,
        source: 'legal_documents',
      }),
    });
  }

  // Case 11-15: Failed payment (retry needed)
  for (let i = 10; i < 15; i++) {
    const changeDate = getRandomPastDate(14); // Last 14 days
    const attemptDate = new Date(changeDate.getTime() + (1 * 24 * 60 * 60 * 1000)); // 1 day after
    
    cases.push({
      userId: generateUserId(i + 1),
      companyName: COMPANY_NAMES[i % COMPANY_NAMES.length],
      oldStructure: STRUCTURES.SOLE_PROPRIETORSHIP,
      newStructure: STRUCTURES.S_CORP,
      changeReason: 'Tax optimization',
      changeDescription: 'Electing S-Corp status for tax benefits',
      status: 'pending_payment',
      requiresPayment: true,
      paymentStatus: PAYMENT_STATUS.FAILED,
      paymentAmount: 200000,
      paymentCurrency: 'NGN',
      paymentReference: generatePaymentReference(),
      paystackReference: generatePaystackReference(),
      paystackStatus: 'failed',
      paystackResponse: JSON.stringify({
        status: false,
        message: 'Insufficient funds',
      }),
      changeDetectedAt: changeDate,
      changeEffectiveDate: getFutureDate(30),
      paymentDueDate: getFutureDate(3),
      isSynthetic: true,
      syntheticSeed: `seed_failed_${i + 1}`,
      metadata: JSON.stringify({
        detectionMethod: 'automatic',
        confidence: 0.92,
        source: 'tax_filing',
        retryCount: 1,
      }),
    });
  }

  // Insert all cases
  for (const caseData of cases) {
    await prisma.businessStructureChange.create({
      data: caseData,
    });
  }

  console.log(`✅ Created ${cases.length} business structure change cases`);
  return cases.length;
}

// Generate payment records
async function seedPayments() {
  console.log('🌱 Seeding payment records...');

  const completedChanges = await prisma.businessStructureChange.findMany({
    where: {
      paymentStatus: PAYMENT_STATUS.COMPLETED,
    },
  });

  let paymentCount = 0;

  for (const change of completedChanges) {
    await prisma.payment.create({
      data: {
        structureChangeId: change.id,
        userId: change.userId,
        userEmail: `${change.userId}@auxeira.com`,
        amount: change.paymentAmount / 100, // Convert kobo to naira
        currency: change.paymentCurrency,
        paymentType: 'business_structure_update',
        description: `Payment for business structure change: ${change.oldStructure} → ${change.newStructure}`,
        paystackReference: change.paystackReference,
        paystackStatus: change.paystackStatus,
        paystackResponse: change.paystackResponse,
        paystackAmount: change.paymentAmount,
        status: PAYMENT_STATUS.COMPLETED,
        verifiedAt: change.paymentDate,
        verifiedBy: 'system',
        isSynthetic: true,
        metadata: JSON.stringify({
          changeId: change.id,
          companyName: change.companyName,
        }),
      },
    });
    paymentCount++;
  }

  console.log(`✅ Created ${paymentCount} payment records`);
  return paymentCount;
}

// Generate user subscriptions
async function seedUserSubscriptions() {
  console.log('🌱 Seeding user subscriptions...');

  const allChanges = await prisma.businessStructureChange.findMany();
  const userIds = [...new Set(allChanges.map(c => c.userId))];

  let subscriptionCount = 0;

  for (const userId of userIds) {
    const userChanges = allChanges.filter(c => c.userId === userId);
    const latestChange = userChanges.sort((a, b) => 
      new Date(b.changeDetectedAt) - new Date(a.changeDetectedAt)
    )[0];

    const hasCompletedPayment = userChanges.some(c => 
      c.paymentStatus === PAYMENT_STATUS.COMPLETED
    );

    await prisma.userSubscription.create({
      data: {
        userId: userId,
        tier: hasCompletedPayment ? 'growth' : 'free',
        status: hasCompletedPayment ? 'active' : 'pending_payment',
        currentStructure: latestChange.newStructure,
        structureLastUpdated: latestChange.changeDetectedAt,
        lastPaymentDate: latestChange.paymentDate,
        nextPaymentDue: latestChange.paymentDueDate,
        totalPayments: hasCompletedPayment ? latestChange.paymentAmount / 100 : 0,
        dashboardAccess: hasCompletedPayment,
        accessBlockedAt: hasCompletedPayment ? null : latestChange.changeDetectedAt,
        accessBlockedReason: hasCompletedPayment ? null : 'Payment required for business structure change',
        metadata: JSON.stringify({
          companyName: latestChange.companyName,
          totalChanges: userChanges.length,
        }),
      },
    });
    subscriptionCount++;
  }

  console.log(`✅ Created ${subscriptionCount} user subscriptions`);
  return subscriptionCount;
}

// Main seed function
async function main() {
  console.log('🚀 Starting database seeding...\n');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.payment.deleteMany({});
    await prisma.businessStructureChange.deleteMany({});
    await prisma.userSubscription.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // Seed new data
    const changeCount = await seedBusinessStructureChanges();
    const paymentCount = await seedPayments();
    const subscriptionCount = await seedUserSubscriptions();

    console.log('\n📊 Seeding Summary:');
    console.log(`   • Business Structure Changes: ${changeCount}`);
    console.log(`   • Payment Records: ${paymentCount}`);
    console.log(`   • User Subscriptions: ${subscriptionCount}`);
    console.log('\n✅ Database seeding completed successfully!');

    // Display statistics
    const stats = await getStatistics();
    console.log('\n📈 Database Statistics:');
    console.log(`   • Pending Payment: ${stats.pendingPayment}`);
    console.log(`   • Completed Payment: ${stats.completedPayment}`);
    console.log(`   • Failed Payment: ${stats.failedPayment}`);
    console.log(`   • Total Cases: ${stats.total}`);
    console.log(`   • Date Range: ${stats.oldestDate} to ${stats.newestDate}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Get statistics
async function getStatistics() {
  const all = await prisma.businessStructureChange.findMany({
    orderBy: { changeDetectedAt: 'asc' },
  });

  return {
    total: all.length,
    pendingPayment: all.filter(c => c.paymentStatus === PAYMENT_STATUS.PENDING).length,
    completedPayment: all.filter(c => c.paymentStatus === PAYMENT_STATUS.COMPLETED).length,
    failedPayment: all.filter(c => c.paymentStatus === PAYMENT_STATUS.FAILED).length,
    oldestDate: all[0]?.changeDetectedAt.toISOString().split('T')[0],
    newestDate: all[all.length - 1]?.changeDetectedAt.toISOString().split('T')[0],
  };
}

// Run the seed
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

module.exports = { main };
