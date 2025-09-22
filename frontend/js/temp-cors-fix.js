// Temporary CORS fix - disable CSRF token for API calls
// This should be removed after backend redeployment

(function() {
    // Override the fetch function to remove problematic headers for API calls
    if (window.fetch) {
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            // Check if this is an API call to our backend
            if (url.includes('x39efpag2i.execute-api.us-east-1.amazonaws.com')) {
                // Remove problematic headers for API calls
                if (options.headers) {
                    delete options.headers['x-csrf-token'];
                    delete options.headers['X-CSRF-Token'];
                }
                
                // Ensure we have basic headers
                options.headers = {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...options.headers
                };
            }
            
            return originalFetch(url, options);
        };
    }
    
    console.log('Temporary CORS fix applied - CSRF tokens disabled for API calls');
})();
