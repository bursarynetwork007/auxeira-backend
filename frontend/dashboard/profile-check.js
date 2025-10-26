/**
 * Profile Completion and Payment Verification Check
 * Ensures users have completed onboarding and have active subscriptions
 */

async function checkProfileAndPayment() {
    try {
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('auxeira_user') || '{}');
        
        console.log('[Profile Check] userData:', userData);
        console.log('[Profile Check] userId:', userData.userId);
        console.log('[Profile Check] onboardingCompleted:', userData.onboardingCompleted);
        
        if (!userData.userId) {
            // No user logged in, redirect to home
            console.log('[Profile Check] No userId found, redirecting to auxeira.com');
            window.location.href = 'https://auxeira.com';
            return false;
        }

        // Check if onboarding is completed
        if (!userData.onboardingCompleted) {
            // Redirect to onboarding
            console.log('[Profile Check] Onboarding not completed, redirecting to onboarding.html');
            window.location.href = '/dashboard/onboarding.html';
            return false;
        }
        
        console.log('[Profile Check] All checks passed');

        // Check payment status for paid tiers
        if (userData.tier && userData.tier !== 'founder') {
            try {
                const response = await fetch(`https://x39efpag2i.execute-api.us-east-1.amazonaws.com/dev/api/paystack/subscription/status/${userData.userId}`);
                const data = await response.json();
                
                if (!data.hasActiveSubscription) {
                    // No active subscription, redirect to payment
                    localStorage.setItem('payment_redirect_reason', 'subscription_required');
                    window.location.href = '/dashboard/payment.html';
                    return false;
                }
            } catch (error) {
                console.error('Error checking subscription status:', error);
                // Allow access on error to avoid blocking users
            }
        }

        // All checks passed
        return true;
        
    } catch (error) {
        console.error('Profile check error:', error);
        // Allow access on error to avoid blocking users
        return true;
    }
}

// Run check on page load - localStorage should be immediately available
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkProfileAndPayment);
} else {
    // Immediate check - login page forces synchronous write
    checkProfileAndPayment();
}
