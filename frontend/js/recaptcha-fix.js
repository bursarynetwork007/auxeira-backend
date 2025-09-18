// Fix reCAPTCHA loading
window.initializeRecaptcha = function() {
    if (typeof grecaptcha !== 'undefined') {
        // Your reCAPTCHA initialization code here
        console.log('reCAPTCHA loaded successfully');
    } else {
        console.log('reCAPTCHA not yet loaded, retrying...');
        setTimeout(initializeRecaptcha, 1000);
    }
};

// Wait for page load then initialize
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeRecaptcha, 2000);
});
