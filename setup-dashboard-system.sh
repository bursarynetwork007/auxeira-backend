#!/bin/bash

echo "🎯 Setting up Central Dashboard Data System"
echo "==========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Step 1: Install dependencies if needed
echo "1️⃣  Checking dependencies..."
if ! command -v ts-node &> /dev/null; then
    echo "📦 Installing ts-node..."
    npm install -g ts-node
fi

# Step 2: Run database migration
echo ""
echo "2️⃣  Running database migration..."
npx prisma generate
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ Database migration failed"
    exit 1
fi

echo "✅ Database migration completed"

# Step 3: Notify developer about file moves
echo ""
echo "3️⃣  Notifying developer about dashboard file moves..."
node scripts/notify-developer.js

# Step 4: Track current dashboard file locations
echo ""
echo "4️⃣  Tracking dashboard file locations..."
ts-node scripts/migrate-dashboard-files.ts

# Step 5: Seed initial data
echo ""
echo "5️⃣  Seeding initial dashboard data..."
ts-node scripts/seed-dashboard-data.ts

echo ""
echo "�� Setup Complete!"
echo ""
echo "📊 Central Dashboard System is now ready with:"
echo "   ✅ Database schema with file location tracking"
echo "   ✅ File migration and discovery tools"
echo "   ✅ Developer notification system"
echo "   ✅ API endpoints for dynamic file location"
echo ""
echo "🔧 Next steps for developers:"
echo "   1. Update dashboard file paths in scripts/migrate-dashboard-files.ts"
echo "   2. Run 'npm run migrate:dashboard-files' again"
echo "   3. Use the API to dynamically locate files in code"
echo ""
echo "🌐 API endpoints available:"
echo "   GET /api/dashboard/locations"
echo "   GET /api/dashboard/locations/:type"
echo "   POST /api/dashboard/locations/:type"
echo "   POST /api/dashboard/locations/:type/scan"
