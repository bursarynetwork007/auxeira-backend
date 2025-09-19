// Universal reCaptcha fix - prevents errors across all pages
(function() {
    // Override any existing reCaptcha calls to be safe
    window.initRecaptcha = function() {
        if (typeof grecaptcha === 'undefined') {
            return false; // reCaptcha not loaded
        }
        
        // Find any reCaptcha container on the page
        const containers = document.querySelectorAll('[data-recaptcha], .g-recaptcha, #recaptcha');
        
        containers.forEach(function(container) {
            if (container && !container.innerHTML.trim()) {
                try {
                    grecaptcha.render(container, {
                        'sitekey': container.dataset.sitekey || 'your-site-key'
                    });
                } catch (error) {
                    console.log('reCaptcha initialization skipped for this element');
                }
            }
        });
    };
    
    // Safe initialization after page load
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            if (typeof grecaptcha !== 'undefined') {
                grecaptcha.ready(initRecaptcha);
            }
        }, 1000);
    });
})();
