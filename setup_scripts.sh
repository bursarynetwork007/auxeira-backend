#!/bin/bash

# Auxeira SSE Backend - Automated Setup Script
# This script automates the initial setup process for the development environment

set -e  # Exit on any error

echo "🚀 Starting Auxeira SSE Backend Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi

    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi

    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed."
        exit 1
    fi

    print_success "All prerequisites are installed"
}

# Install Railway CLI if not present
install_railway_cli() {
    if ! command -v railway &> /dev/null; then
        print_status "Installing Railway CLI..."
        npm install -g @railway/cli
        print_success "Railway CLI installed"
    else
        print_success "Railway CLI already installed"
    fi
}

# Create project structure
create_project_structure() {
    print_status "Creating project structure..."

    # Create TypeScript source directories
    mkdir -p src/{config,controllers,middleware,models,routes,services,database,utils,types,websocket}
    mkdir -p src/database/{migrations,seeds}
    mkdir -p src/websocket/{handlers,middleware}
    mkdir -p tests/{unit,integration,e2e,fixtures}
    mkdir -p docs/{api,deployment,development}
    mkdir -p scripts

    print_success "Project structure created"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."

    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_warning "package.json not found. Creating basic package.json..."
        npm init -y
    fi

    # Install production dependencies
    npm install express cors helmet compression express-rate-limit express-validator \
                bcryptjs jsonwebtoken pg redis ioredis socket.io axios openai stripe \
                nodemailer winston morgan dotenv uuid joi multer aws-sdk kafkajs \
                cron moment lodash

    # Install development dependencies
    npm install --save-dev @types/node @types/express @types/cors @types/bcryptjs \
                          @types/jsonwebtoken @types/pg @types/uuid @types/joi \
                          @types/multer @types/lodash @types/morgan @types/compression \
                          @types/nodemailer @typescript-eslint/eslint-plugin \
                          @typescript-eslint/parser typescript ts-node nodemon eslint \
                          prettier jest @types/jest ts-jest supertest @types/supertest

    print_success "Dependencies installed"
}

# Create configuration files
create_config_files() {
    print_status "Creating configuration files..."

    # Create .gitignore if it doesn't exist
    if [ ! -f ".gitignore" ]; then
        cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
node_modules/
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test
.env.local
.env.production

# parcel-bundler cache
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Build outputs
dist/
build/

# Docker
.dockerignore
EOF
        print_success ".gitignore created"
    fi

    # Create .env.example
    if [ ! -f ".env.example" ]; then
        cat > .env.example << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:port/database
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# reCAPTCHA Configuration
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key_here
RECAPTCHA_MIN_SCORE=0.5

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# CORS Configuration
FRONTEND_URLS=http://localhost:3000,https://auxeira.com
EOF
        print_success ".env.example created"
    fi

    # Create basic .env file
    if [ ! -f ".env" ]; then
        cp .env.example .env
        print_warning ".env file created from template. Please update with your actual values."
    fi
}

# Create basic TypeScript configuration
create_typescript_config() {
    if [ ! -f "tsconfig.json" ]; then
        print_status "Creating TypeScript configuration..."
        cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@/config/*": ["config/*"],
      "@/controllers/*": ["controllers/*"],
      "@/middleware/*": ["middleware/*"],
      "@/models/*": ["models/*"],
      "@/routes/*": ["routes/*"],
      "@/services/*": ["services/*"],
      "@/utils/*": ["utils/*"],
      "@/types/*": ["types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF
        print_success "TypeScript configuration created"
    fi
}

# Create basic ESLint configuration
create_eslint_config() {
    if [ ! -f ".eslintrc.js" ]; then
        print_status "Creating ESLint configuration..."
        cat > .eslintrc.js << 'EOF'
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    '@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
EOF
        print_success "ESLint configuration created"
    fi
}

# Create Prettier configuration
create_prettier_config() {
    if [ ! -f ".prettierrc" ]; then
        print_status "Creating Prettier configuration..."
        cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
EOF
        print_success "Prettier configuration created"
    fi
}

# Create basic server file
create_basic_server() {
    if [ ! -f "src/server.ts" ]; then
        print_status "Creating basic server file..."
        mkdir -p src
        cat > src/server.js << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Auxeira SSE Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Auxeira SSE Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
EOF
        print_success "Basic server file created"
    fi
}

# Update package.json scripts
update_package_scripts() {
    print_status "Updating package.json scripts..."

    # Use Node.js to update package.json scripts
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    pkg.scripts = {
      ...pkg.scripts,
      'dev': 'nodemon --exec ts-node src/server.ts',
      'build': 'tsc',
      'start': 'node dist/server.js',
      'start:dev': 'ts-node src/server.ts',
      'test': 'jest',
      'test:watch': 'jest --watch',
      'lint': 'eslint src/**/*.ts',
      'lint:fix': 'eslint src/**/*.ts --fix',
      'format': 'prettier --write src/**/*.ts'
    };

    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "

    print_success "Package.json scripts updated"
}

# Initialize Railway project
setup_railway() {
    print_status "Setting up Railway project..."

    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Please install it first: npm install -g @railway/cli"
        return 1
    fi

    # Check if already logged in
    if ! railway whoami &> /dev/null; then
        print_warning "Please login to Railway first: railway login"
        return 1
    fi

    # Initialize Railway project if not already done
    if [ ! -f "railway.json" ]; then
        print_status "Initializing Railway project..."
        railway init
        print_success "Railway project initialized"
    fi

    print_status "Railway setup complete. Remember to:"
    echo "  1. Add PostgreSQL: railway add postgresql"
    echo "  2. Add Redis: railway add redis"
    echo "  3. Set environment variables in Railway dashboard"
}

# Create development scripts
create_dev_scripts() {
    print_status "Creating development scripts..."

    mkdir -p scripts

    # Create development start script
    cat > scripts/dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Auxeira SSE Backend in development mode..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Start development server
npm run dev
EOF
    chmod +x scripts/dev.sh

    # Create database setup script
    cat > scripts/setup-db.sh << 'EOF'
#!/bin/bash
echo "🗄️ Setting up database..."

# This script will be used to run migrations and seeds
# For now, it's a placeholder for future database setup

echo "✅ Database setup complete"
EOF
    chmod +x scripts/setup-db.sh

    print_success "Development scripts created"
}

# Main setup function
main() {
    echo "🎯 Auxeira SSE Backend Setup"
    echo "================================"

    check_prerequisites
    install_railway_cli
    create_project_structure
    install_dependencies
    create_config_files
    create_typescript_config
    create_eslint_config
    create_prettier_config
    create_basic_server
    update_package_scripts
    create_dev_scripts

    print_success "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Update .env file with your actual configuration values"
    echo "2. Run 'railway login' and set up your Railway project"
    echo "3. Add PostgreSQL and Redis to your Railway project"
    echo "4. Start development server with 'npm run dev'"
    echo ""
    echo "For detailed instructions, see the implementation roadmap."
}

# Run main function
main "$@"