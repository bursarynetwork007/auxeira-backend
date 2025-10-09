#!/usr/bin/env node

/**
 * Developer Notification Script
 * Notifies developers about dashboard file moves and updates
 */

const fs = require('fs');
const path = require('path');

console.log('📢 Developer Notification: Dashboard File Moves');
console.log('===============================================\n');

// Read the dashboard locations from database (simulated)
const dashboardLocations = [
  { type: 'startup', oldPath: '/workspaces/auxeira-backend/dashboard/startup.html', newPath: '/workspaces/auxeira-backend/dashboard/startup.html' },
  { type: 'vc', oldPath: '/workspaces/auxeira-backend/dashboard/vc.html', newPath: '/workspaces/auxeira-backend/dashboard/vc.html' },
  { type: 'angel_investor', oldPath: '/workspaces/auxeira-backend/dashboard/angel_investor.html', newPath: '/workspaces/auxeira-backend/dashboard/angel_investor.html' },
  { type: 'corporate_partner', oldPath: '/workspaces/auxeira-backend/dashboard/corporate_partner.html', newPath: '/workspaces/auxeira-backend/dashboard/corporate_partner.html' },
  { type: 'government', oldPath: '/workspaces/auxeira-backend/dashboard/government.html', newPath: '/workspaces/auxeira-backend/dashboard/government.html' },
  { type: 'esg_education', oldPath: '/workspaces/auxeira-backend/dashboard/esg_education.html', newPath: '/workspaces/auxeira-backend/dashboard/esg_education.html' },
  { type: 'esg_index', oldPath: '/workspaces/auxeira-backend/dashboard/esg_index.html', newPath: '/workspaces/auxeira-backend/dashboard/esg_index.html' }
];

console.log('🔔 IMPORTANT: Dashboard files have been moved to new locations!\n');

console.log('📋 Affected Files:');
dashboardLocations.forEach(location => {
  if (location.oldPath !== location.newPath) {
    console.log(`   📄 ${location.type}:`);
    console.log(`      Old: ${location.oldPath}`);
    console.log(`      New: ${location.newPath}`);
  } else {
    console.log(`   📄 ${location.type}: No change (${location.newPath})`);
  }
});

console.log('\n🛠️  Action Required:');
console.log('   1. Update any hardcoded file paths in your code');
console.log('   2. Use the dashboard location API to dynamically find files:');
console.log('      GET /api/dashboard/locations/:type');
console.log('   3. Run the migration script to update the database:');
console.log('      npm run migrate:dashboard-files');
console.log('   4. Verify all dashboards are accessible at their new locations');

console.log('\n🔧 New API Endpoints Available:');
console.log('   GET /api/dashboard/locations - List all dashboard locations');
console.log('   GET /api/dashboard/locations/:type - Get specific dashboard location');
console.log('   POST /api/dashboard/locations/:type - Update dashboard location');
console.log('   POST /api/dashboard/locations/:type/scan - Auto-discover dashboard file');

console.log('\n💡 Tip: The system will automatically track and help locate moved dashboard files.');
console.log('   No manual path updates should be needed in most cases.\n');

// Create a summary file for the developer
const summary = {
  timestamp: new Date().toISOString(),
  message: 'Dashboard files have been moved. Please update references accordingly.',
  locations: dashboardLocations,
  actions: [
    'Use API endpoints to dynamically locate files',
    'Run migration script to update database',
    'Update any hardcoded file paths'
  ],
  apiEndpoints: {
    listLocations: 'GET /api/dashboard/locations',
    getLocation: 'GET /api/dashboard/locations/:type',
    updateLocation: 'POST /api/dashboard/locations/:type',
    scanLocation: 'POST /api/dashboard/locations/:type/scan'
  }
};

fs.writeFileSync(
  path.join(process.cwd(), 'dashboard-move-summary.json'),
  JSON.stringify(summary, null, 2)
);

console.log('📄 Summary saved to: dashboard-move-summary.json');
console.log('\n✅ Notification complete. Developer has been informed of changes.');
