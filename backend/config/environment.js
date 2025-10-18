/**
 * Auxeira Environment Configuration
 * Secure API key management without exposing sensitive data
 */

const environments = {
  development: {
    api: {
      baseUrl: 'http://localhost:3000',
      timeout: 5000
    },
    database: {
      region: 'us-east-1',
      tables: {
        users: 'auxeira-backend-users-dev',
        profiles: 'auxeira-esg-profiles-dev',
        reports: 'auxeira-esg-reports-dev'
      }
    },
    features: {
      aiReports: true,
      premiumFeatures: true,
      debugging: true
    }
  },
  production: {
    api: {
      baseUrl: 'https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod',
      timeout: 10000
    },
    database: {
      region: 'us-east-1',
      tables: {
        users: 'auxeira-backend-users-prod',
        profiles: 'auxeira-esg-profiles-prod',
        reports: 'auxeira-esg-reports-prod',
        startups: 'auxeira-startup-profiles-prod',
        leaderboard: 'auxeira-leaderboard-prod'
      }
    },
    features: {
      aiReports: true,
      premiumFeatures: true,
      debugging: false
    }
  }
};

class EnvironmentConfig {
  constructor(env = 'development') {
    this.environment = env;
    this.config = environments[env];
    
    // Load API keys from environment variables (never hardcoded)
    this.apiKeys = {
      claude: process.env.CLAUDE_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      manus: process.env.MANUS_API_KEY,
      paystack: {
        secret: process.env.PAYSTACK_SECRET_KEY,
        public: process.env.PAYSTACK_PUBLIC_KEY
      }
    };
  }
  
  get(key) {
    return this.config[key];
  }
  
  getApiKey(provider) {
    return this.apiKeys[provider];
  }
  
  isProduction() {
    return this.environment === 'production';
  }
}

module.exports = EnvironmentConfig;
