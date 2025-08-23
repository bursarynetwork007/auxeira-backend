<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auxeira SSE - Authentication</title>
    <script src="https://www.google.com/recaptcha/api.js" async defer></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            width: 100%;
            max-width: 900px;
            background-color: rgba(255, 255, 255, 0.9);
            border-radius: 15px;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: linear-gradient(to right, #2c3e50, #4ca1af);
            color: white;
            padding: 25px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            display: flex;
            flex-direction: column;
            padding: 30px;
        }
        
        .tabs {
            display: flex;
            margin-bottom: 25px;
            border-bottom: 2px solid #eee;
        }
        
        .tab {
            padding: 15px 25px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            color: #777;
            transition: all 0.3s ease;
            text-align: center;
            flex: 1;
        }
        
        .tab.active {
            color: #4ca1af;
            border-bottom: 3px solid #4ca1af;
        }
        
        .form-container {
            overflow: hidden;
        }
        
        .form {
            display: none;
            animation: fadeIn 0.5s ease forwards;
        }
        
        .form.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #444;
        }
        
        .input-with-icon {
            position: relative;
        }
        
        .input-with-icon i {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: #777;
        }
        
        .input-with-icon input {
            width: 100%;
            padding: 15px 15px 15px 45px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .input-with-icon input:focus {
            border-color: #4ca1af;
            outline: none;
            box-shadow: 0 0 0 2px rgba(76, 161, 175, 0.2);
        }
        
        .account-type {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .account-type label {
            flex: 1;
            text-align: center;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .account-type input[type="radio"] {
            display: none;
        }
        
        .account-type input[type="radio"]:checked + span {
            border-color: #4ca1af;
            background-color: rgba(76, 161, 175, 0.1);
            color: #4ca1af;
            font-weight: 600;
        }
        
        .account-type span {
            display: block;
            padding: 10px;
            border-radius: 6px;
        }
        
        .recaptcha-container {
            margin: 20px 0;
            display: flex;
            justify-content: center;
        }
        
        .btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(to right, #2c3e50, #4ca1af);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn:hover {
            background: linear-gradient(to right, #4ca1af, #2c3e50);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .message {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            display: none;
        }
        
        .message.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            display: block;
        }
        
        .message.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            display: block;
        }
        
        .password-toggle {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: #777;
        }
        
        @media (min-width: 768px) {
            .container {
                flex-direction: row;
                min-height: 600px;
            }
            
            .header {
                width: 40%;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            
            .content {
                width: 60%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-rocket"></i> Auxeira SSE</h1>
            <p>Sustainable Startup Ecosystem</p>
            <p>Join our platform to connect, grow, and measure your startup's sustainability impact.</p>
        </div>
        
        <div class="content">
            <div class="tabs">
                <div class="tab active" id="login-tab">Login</div>
                <div class="tab" id="signup-tab">Sign Up</div>
            </div>
            
            <div class="form-container">
                <!-- Login Form -->
                <form id="login-form" class="form active">
                    <div class="form-group">
                        <label for="login-email">Email</label>
                        <div class="input-with-icon">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="login-email" placeholder="Enter your email" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="login-password">Password</label>
                        <div class="input-with-icon">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="login-password" placeholder="Enter your password" required>
                            <span class="password-toggle" id="login-password-toggle">
                                <i class="fas fa-eye"></i>
                            </span>
                        </div>
                    </div>
                    
                    <div class="recaptcha-container">
                        <div class="g-recaptcha" data-sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"></div>
                    </div>
                    
                    <button type="submit" class="btn">Login</button>
                    
                    <div class="message" id="login-message"></div>
                </form>
                
                <!-- Signup Form -->
                <form id="signup-form" class="form">
                    <div class="form-group">
                        <label for="signup-firstname">First Name</label>
                        <div class="input-with-icon">
                            <i class="fas fa-user"></i>
                            <input type="text" id="signup-firstname" placeholder="Enter your first name" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="signup-lastname">Last Name</label>
                        <div class="input-with-icon">
                            <i class="fas fa-user"></i>
                            <input type="text" id="signup-lastname" placeholder="Enter your last name" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="signup-email">Email</label>
                        <div class="input-with-icon">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="signup-email" placeholder="Enter your email" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="signup-password">Password</label>
                        <div class="input-with-icon">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="signup-password" placeholder="Create a password" required>
                            <span class="password-toggle" id="signup-password-toggle">
                                <i class="fas fa-eye"></i>
                            </span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Account Type</label>
                        <div class="account-type">
                            <label>
                                <input type="radio" name="account-type" value="startup" checked>
                                <span><i class="fas fa-rocket"></i> Startup</span>
                            </label>
                            <label>
                                <input type="radio" name="account-type" value="investor">
                                <span><i class="fas fa-chart-line"></i> Investor</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="recaptcha-container">
                        <div class="g-recaptcha" data-sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"></div>
                    </div>
                    
                    <button type="submit" class="btn">Create Account</button>
                    
                    <div class="message" id="signup-message"></div>
                </form>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const loginTab = document.getElementById('login-tab');
            const signupTab = document.getElementById('signup-tab');
            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');
            const loginMessage = document.getElementById('login-message');
            const signupMessage = document.getElementById('signup-message');
            const loginPasswordToggle = document.getElementById('login-password-toggle');
            const signupPasswordToggle = document.getElementById('signup-password-toggle');
            const loginPassword = document.getElementById('login-password');
            const signupPassword = document.getElementById('signup-password');
            
            // Tab switching
            loginTab.addEventListener('click', () => switchTab('login'));
            signupTab.addEventListener('click', () => switchTab('signup'));
            
            // Password visibility toggling
            loginPasswordToggle.addEventListener('click', () => togglePasswordVisibility(loginPassword, loginPasswordToggle));
            signupPasswordToggle.addEventListener('click', () => togglePasswordVisibility(signupPassword, signupPasswordToggle));
            
            // Form submissions
            loginForm.addEventListener('submit', handleLogin);
            signupForm.addEventListener('submit', handleSignup);
            
            function switchTab(tab) {
                if (tab === 'login') {
                    loginTab.classList.add('active');
                    signupTab.classList.remove('active');
                    loginForm.classList.add('active');
                    signupForm.classList.remove('active');
                    loginMessage.className = 'message';
                } else {
                    signupTab.classList.add('active');
                    loginTab.classList.remove('active');
                    signupForm.classList.add('active');
                    loginForm.classList.remove('active');
                    signupMessage.className = 'message';
                }
            }
            
            function togglePasswordVisibility(passwordField, toggle) {
                if (passwordField.type === 'password') {
                    passwordField.type = 'text';
                    toggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
                } else {
                    passwordField.type = 'password';
                    toggle.innerHTML = '<i class="fas fa-eye"></i>';
                }
            }
            
            async function handleLogin(e) {
                e.preventDefault();
                
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                const recaptchaToken = grecaptcha.getResponse();
                
                if (!recaptchaToken) {
                    showMessage(loginMessage, 'Please complete the reCAPTCHA verification', 'error');
                    return;
                }
                
                try {
                    const response = await fetch('/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, password, recaptcha_token: recaptchaToken })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showMessage(loginMessage, 'Login successful! Redirecting...', 'success');
                        // Store token and user data (in a real application)
                        localStorage.setItem('authToken', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        
                        // Redirect to dashboard after a short delay
                        setTimeout(() => {
                            window.location.href = '/dashboard.html';
                        }, 1500);
                    } else {
                        showMessage(loginMessage, data.message || 'Login failed', 'error');
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    showMessage(loginMessage, 'An error occurred during login', 'error');
                }
            }
            
            async function handleSignup(e) {
                e.preventDefault();
                
                const firstName = document.getElementById('signup-firstname').value;
                const lastName = document.getElementById('signup-lastname').value;
                const email = document.getElementById('signup-email').value;
                const password = document.getElementById('signup-password').value;
                const accountType = document.querySelector('input[name="account-type"]:checked').value;
                const recaptchaToken = grecaptcha.getResponse();
                
                if (!recaptchaToken) {
                    showMessage(signupMessage, 'Please complete the reCAPTCHA verification', 'error');
                    return;
                }
                
                try {
                    const response = await fetch('/auth/signup', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            email, 
                            password, 
                            accountType, 
                            firstName, 
                            lastName, 
                            recaptcha_token: recaptchaToken 
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showMessage(signupMessage, data.message, 'success');
                        // Clear form
                        document.getElementById('signup-form').reset();
                        
                        // Switch to login tab after a delay
                        setTimeout(() => {
                            switchTab('login');
                        }, 2000);
                    } else {
                        showMessage(signupMessage, data.message || 'Signup failed', 'error');
                    }
                } catch (error) {
                    console.error('Signup error:', error);
                    showMessage(signupMessage, 'An error occurred during signup', 'error');
                }
            }
            
            function showMessage(element, text, type) {
                element.textContent = text;
                element.className = `message ${type}`;
            }
        });
    </script>
</body>
</html>