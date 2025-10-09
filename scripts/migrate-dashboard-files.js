const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Dashboard File Migration Tool
 * Helps track and migrate dashboard files between folders
 */
async function migrateDashboardFiles() {
  console.log('🚚 Dashboard File Migration Tool');
  console.log('================================\n');

  // Define dashboard types and their file locations
  const dashboardConfigs = [
    {
      type: 'startup',
      originalPath: '/workspaces/auxeira-backend/dashboard/startup.html',
      currentPath: '/workspaces/auxeira-backend/dashboard/startup.html',
      notes: 'Startup founder dashboard'
    },
    {
      type: 'vc',
      originalPath: '/workspaces/auxeira-backend/dashboard/vc.html',
      currentPath: '/workspaces/auxeira-backend/dashboard/vc.html',
      notes: 'Venture capital dashboard'
    },
    {
      type: 'angel_investor',
      originalPath: '/workspaces/auxeira-backend/dashboard/angel_investor.html',
      currentPath: '/workspaces/auxeira-backend/dashboard/angel_investor.html',
      notes: 'Angel investor dashboard'
    },
    {
      type: 'corporate_partner',
      originalPath: '/workspaces/auxeira-backend/dashboard/corporate_partner.html',
      currentPath: '/workspaces/auxeira-backend/dashboard/corporate_partner.html',
      notes: 'Corporate partner dashboard'
    },
    {
      type: 'government',
      originalPath: '/workspaces/auxeira-backend/dashboard/government.html',
      currentPath: '/workspaces/auxeira-backend/dashboard/government.html',
      notes: 'Government agency dashboard'
    },
    {
      type: 'esg_education',
      originalPath: '/workspaces/auxeira-backend/dashboard/esg_education.html',
      currentPath: '/workspaces/auxeira-backend/dashboard/esg_education.html',
      notes: 'ESG education investor dashboard'
    },
    {
      type: 'esg_index',
      originalPath: '/workspaces/auxeira-backend/dashboard/esg_index.html',
      currentPath: '/workspaces/auxeira-backend/dashboard/esg_index.html',
      notes: 'ESG index dashboard'
    }
  ];

  console.log('📁 Tracking dashboard file locations...\n');

  for (const config of dashboardConfigs) {
    try {
      // Check if file exists at current path
      const fileExists = fs.existsSync(config.currentPath);
      
      // Create or update dashboard location record
      const location = await prisma.dashboardLocation.upsert({
        where: { dashboardType: config.type },
        update: {
          currentPath: config.currentPath,
          isActive: fileExists,
          lastAccessed: new Date(),
          notes: config.notes
        },
        create: {
          dashboardType: config.type,
          originalPath: config.originalPath,
          currentPath: config.currentPath,
          isActive: fileExists,
          notes: config.notes
        }
      });

      if (fileExists) {
        console.log(`✅ ${config.type}: ${config.currentPath}`);
      } else {
        console.log(`❌ ${config.type}: File not found at ${config.currentPath}`);
        
        // Try to find the file in common alternative locations
        const alternativeLocations = [
          config.originalPath,
          path.join(process.cwd(), 'dashboard', `${config.type}.html`),
          path.join(process.cwd(), 'public', `${config.type}.html`),
          path.join(process.cwd(), 'src', 'dashboard', `${config.type}.html`),
          path.join(process.cwd(), 'dist', `${config.type}.html`),
          path.join(process.cwd(), 'frontend', `${config.type}.html`)
        ];

        for (const altPath of alternativeLocations) {
          if (fs.existsSync(altPath) && altPath !== config.currentPath) {
            console.log(`   🔍 Found at: ${altPath}`);
            // Update location with found path
            await prisma.dashboardLocation.update({
              where: { id: location.id },
              data: {
                currentPath: altPath,
                isActive: true,
                notes: `${config.notes} - Auto-discovered at new location`
              }
            });
            break;
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error tracking ${config.type}:`, error.message);
    }
  }

  console.log('\n📋 Migration Summary:');
  console.log('===================');
  
  const allLocations = await prisma.dashboardLocation.findMany();
  for (const location of allLocations) {
    const status = location.isActive ? '✅ Active' : '❌ Missing';
    console.log(`${status} ${location.dashboardType}: ${location.currentPath}`);
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. Update the currentPath values with your actual dashboard locations');
  console.log('2. Run this script again to verify all files are tracked correctly');
  console.log('3. Use the dashboard file lookup API to dynamically locate files');
}

// Run migration
migrateDashboardFiles()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
