// Basic functions for other pages
function openAuthModal(type) {
    alert('Authentication will be available soon!');
}

function closeAuthModal() {
    // Modal functionality
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('active');
        const btn = document.querySelector('.mobile-menu-btn');
        if (btn) {
            btn.classList.toggle('active');
        }
    }
}

// Header scroll effect
document.addEventListener('DOMContentLoaded', function() {
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
});
