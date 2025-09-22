const API_CONFIG = {
    BASE_URL: 'https://x39efpag2i.execute-api.us-east-1.amazonaws.com/dev',
    ENDPOINTS: {
        AUTH: {
            REGISTER: '/api/auth/register',
            SIGNUP: '/api/auth/signup', 
            LOGIN: '/api/auth/login',
            VERIFY: '/api/auth/verify',
            PROFILE: '/api/auth/profile'
        },
        SYSTEM: {
            HEALTH: '/health',
            STATUS: '/api/status'
        },
        CAPTCHA: {
            GENERATE: '/api/captcha/generate',
            VERIFY: '/api/captcha/verify'
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}
