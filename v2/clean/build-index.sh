#!/bin/bash
# Build index-original-styling.html with clean JS

OUTPUT="/workspaces/auxeira-backend/v2/clean/index-original-styling.html"

# Start with head
cat /tmp/head-section.html > "$OUTPUT"

# Add complete CSS
cat /tmp/complete-css.css >> "$OUTPUT"

# Add closing style and body opening
cat /tmp/after-css.html >> "$OUTPUT"

# Add body content (up to where JS starts)
sed -n '3214,4228p' /tmp/original-full.html >> "$OUTPUT"

# Add our clean JavaScript
cat >> "$OUTPUT" << 'CLEANJS'
    <script>
        // ============================================
        // CLEAN V2 JAVASCRIPT - Cookie-based Auth
        // ============================================
        
        // Cookie Utilities
        function setCookie(name, value, days) {
            const expires = new Date(Date.now() + days * 864e5).toUTCString();
            document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
        }

        function getCookie(name) {
            return document.cookie.split('; ').reduce((r, v) => {
                const parts = v.split('=');
                return parts[0] === name ? decodeURIComponent(parts[1]) : r;
            }, '');
        }

        function deleteCookie(name) {
            setCookie(name, '', -1);
        }

        // Modal Functions
        function openAuthModal(type) {
            const modal = document.getElementById('authModal');
            if (modal) {
                modal.classList.add('show');
                // Switch to appropriate tab if needed
                if (type === 'login' || type === 'signin') {
                    switchAuthTab('signin');
                } else {
                    switchAuthTab('signup');
                }
            }
        }

        function closeAuthModal() {
            const modal = document.getElementById('authModal');
            if (modal) {
                modal.classList.remove('show');
            }
        }

        function switchAuthTab(tab) {
            // Hide all forms
            document.querySelectorAll('.form-step').forEach(form => {
                form.classList.remove('active');
            });
            
            // Remove active from all tabs
            document.querySelectorAll('.auth-tab').forEach(tabEl => {
                tabEl.classList.remove('active');
            });
            
            // Show selected form
            const formId = tab === 'signin' ? 'signinForm' : 'signupForm';
            const form = document.getElementById(formId);
            if (form) form.classList.add('active');
            
            // Activate tab
            const tabButton = document.querySelector(`[onclick="switchAuthTab('${tab}')"]`);
            if (tabButton) tabButton.classList.add('active');
        }

        // Login Handler - CLEAN with Cookies
        async function submitSigninForm(event) {
            event.preventDefault();
            
            const form = event.target;
            const email = form.email.value;
            const password = form.password.value;
            
            // Show loading
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
            
            try {
                const response = await fetch('https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'Login failed');
                }
                
                // Store in COOKIES (not localStorage)
                const userData = {
                    userId: data.data.user.userId,
                    email: data.data.user.email,
                    firstName: data.data.user.firstName || '',
                    lastName: data.data.user.lastName || '',
                    role: data.data.user.role || 'startup_founder'
                };
                
                setCookie('auxeira_token', data.data.access_token, 7);
                setCookie('auxeira_user', JSON.stringify(userData), 7);
                
                // Success - redirect to dashboard
                submitBtn.textContent = 'Success! Redirecting...';
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 500);
                
            } catch (error) {
                alert('Login failed: ' + error.message);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }

        // Signup Handler - CLEAN with Cookies
        async function submitSignupForm(event) {
            event.preventDefault();
            
            const form = event.target;
            const formData = {
                email: form.email.value,
                password: form.password.value,
                firstName: form.firstName?.value || '',
                lastName: form.lastName?.value || '',
                userType: form.userType?.value || 'startup_founder'
            };
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';
            
            try {
                const response = await fetch('https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'Signup failed');
                }
                
                // Store in COOKIES
                const userData = {
                    userId: data.data.user.userId || data.userId,
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    role: formData.userType
                };
                
                setCookie('auxeira_token', data.data.access_token || data.token, 7);
                setCookie('auxeira_user', JSON.stringify(userData), 7);
                
                submitBtn.textContent = 'Success! Redirecting...';
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 500);
                
            } catch (error) {
                alert('Signup failed: ' + error.message);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }

        // Smooth Scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Scroll Reveal Animation
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.scroll-reveal').forEach(el => {
            observer.observe(el);
        });

        // Stat Counter Animation
        function animateValue(element, start, end, duration) {
            const range = end - start;
            const increment = range / (duration / 16);
            let current = start;
            
            const timer = setInterval(() => {
                current += increment;
                if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                    current = end;
                    clearInterval(timer);
                }
                
                const value = Math.floor(current);
                if (element.dataset.prefix) {
                    element.textContent = element.dataset.prefix + value + (element.dataset.suffix || '');
                } else {
                    element.textContent = value + (element.dataset.suffix || '');
                }
            }, 16);
        }

        // Initialize stat counters when visible
        const statObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.animated) {
                    entry.target.dataset.animated = 'true';
                    const target = parseFloat(entry.target.dataset.target);
                    animateValue(entry.target, 0, target, 2000);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.stat-number[data-target]').forEach(el => {
            statObserver.observe(el);
        });

        // Check if already logged in
        window.addEventListener('DOMContentLoaded', () => {
            const token = getCookie('auxeira_token');
            if (token) {
                // Already logged in - could show user menu or redirect
                console.log('User already logged in');
            }
        });

        // Close modal on outside click
        document.getElementById('authModal')?.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAuthModal();
            }
        });
    </script>
CLEANJS

# Add closing tags
cat >> "$OUTPUT" << 'CLOSING'
</body>
</html>
CLOSING

echo "Built: $OUTPUT"
wc -l "$OUTPUT"
