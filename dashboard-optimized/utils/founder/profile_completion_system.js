/**
 * Auxeira Profile Completion & User Nudging System
 * Comprehensive system to encourage profile completion and personalize content
 */

class AuxeiraProfileSystem {
    constructor() {
        this.profileData = this.loadProfile();
        this.completionThreshold = 80; // Minimum completion percentage
        this.nudgeFrequency = 30000; // 30 seconds between nudges
        this.init();
    }

    init() {
        this.createProfileModal();
        this.createProfileCompletionBar();
        this.createFloatingProfileButton();
        this.startNudgeSystem();
        this.personalizeContent();
        this.trackUserBehavior();
    }

    // Profile data structure
    getDefaultProfile() {
        return {
            // Basic Information
            organizationName: '',
            organizationType: '', // 'asset-manager', 'pension-fund', 'insurance', 'bank', 'government', 'ngo', 'corporate'
            userRole: '', // 'fund-manager', 'analyst', 'cio', 'esg-officer', 'policy-maker', 'researcher'
            country: '',
            website: '',
            
            // Investment Focus
            focusAreas: [], // Array of SDG numbers [1, 2, 3, etc.]
            investmentSize: '', // 'under-10m', '10m-100m', '100m-1b', 'over-1b'
            investmentHorizon: '', // 'short-term', 'medium-term', 'long-term'
            riskTolerance: '', // 'conservative', 'moderate', 'aggressive'
            
            // Interests & Preferences
            reportTypes: [], // 'quarterly', 'annual', 'thematic', 'regulatory'
            dataFrequency: '', // 'real-time', 'daily', 'weekly', 'monthly'
            complianceFrameworks: [], // 'sfdr', 'csrd', 'tcfd', 'gri', 'sasb'
            
            // Behavioral Data
            lastLogin: null,
            dashboardsVisited: [],
            reportsDownloaded: [],
            premiumReportsPurchased: [],
            completionPercentage: 0,
            
            // Preferences
            notifications: true,
            newsletter: true,
            marketingEmails: false,
            language: 'en'
        };
    }

    loadProfile() {
        const saved = localStorage.getItem('auxeira_profile');
        if (saved) {
            return { ...this.getDefaultProfile(), ...JSON.parse(saved) };
        }
        return this.getDefaultProfile();
    }

    saveProfile() {
        this.profileData.completionPercentage = this.calculateCompletionPercentage();
        localStorage.setItem('auxeira_profile', JSON.stringify(this.profileData));
        this.updateProfileCompletionBar();
        this.personalizeContent();
    }

    calculateCompletionPercentage() {
        const requiredFields = [
            'organizationName', 'organizationType', 'userRole', 'country',
            'focusAreas', 'investmentSize', 'investmentHorizon'
        ];
        
        let completed = 0;
        requiredFields.forEach(field => {
            if (this.profileData[field] && 
                (Array.isArray(this.profileData[field]) ? this.profileData[field].length > 0 : true)) {
                completed++;
            }
        });
        
        return Math.round((completed / requiredFields.length) * 100);
    }

    createProfileModal() {
        const modalHTML = `
        <div class="modal fade" id="profileModal" tabindex="-1" aria-labelledby="profileModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content" style="background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid var(--glass-border); color: var(--text-primary);">
                    <div class="modal-header" style="border-bottom: 1px solid var(--glass-border);">
                        <h5 class="modal-title" id="profileModalLabel">
                            <i class="fas fa-user-circle me-2"></i>Complete Your Profile for Personalized Insights
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="profile-completion-incentive mb-4 p-3" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); border-radius: 12px;">
                            <h6><i class="fas fa-gift me-2"></i>Unlock Premium Features</h6>
                            <p class="mb-0">Complete your profile to receive personalized ESG insights, priority report access, and exclusive market intelligence tailored to your investment focus.</p>
                        </div>

                        <form id="profileForm">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Organization Name *</label>
                                    <input type="text" class="form-control profile-input" id="organizationName" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Organization Type *</label>
                                    <select class="form-select profile-input" id="organizationType" required>
                                        <option value="">Select type...</option>
                                        <option value="asset-manager">Asset Manager</option>
                                        <option value="pension-fund">Pension Fund</option>
                                        <option value="insurance">Insurance Company</option>
                                        <option value="bank">Bank/Financial Institution</option>
                                        <option value="government">Government Agency</option>
                                        <option value="ngo">NGO/Non-Profit</option>
                                        <option value="corporate">Corporate</option>
                                    </select>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Your Role *</label>
                                    <select class="form-select profile-input" id="userRole" required>
                                        <option value="">Select role...</option>
                                        <option value="fund-manager">Fund Manager</option>
                                        <option value="analyst">ESG Analyst</option>
                                        <option value="cio">Chief Investment Officer</option>
                                        <option value="esg-officer">ESG Officer</option>
                                        <option value="policy-maker">Policy Maker</option>
                                        <option value="researcher">Researcher</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Country *</label>
                                    <select class="form-select profile-input" id="country" required>
                                        <option value="">Select country...</option>
                                        <option value="US">United States</option>
                                        <option value="UK">United Kingdom</option>
                                        <option value="DE">Germany</option>
                                        <option value="FR">France</option>
                                        <option value="CA">Canada</option>
                                        <option value="AU">Australia</option>
                                        <option value="SG">Singapore</option>
                                        <option value="NG">Nigeria</option>
                                        <option value="ZA">South Africa</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Organization Website</label>
                                <input type="url" class="form-control profile-input" id="website" placeholder="https://example.com">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">SDG Focus Areas * (Select all that apply)</label>
                                <div class="row" id="sdgFocusAreas">
                                    ${this.generateSDGCheckboxes()}
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Typical Investment Size *</label>
                                    <select class="form-select profile-input" id="investmentSize" required>
                                        <option value="">Select size...</option>
                                        <option value="under-10m">Under $10M</option>
                                        <option value="10m-100m">$10M - $100M</option>
                                        <option value="100m-1b">$100M - $1B</option>
                                        <option value="over-1b">Over $1B</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Investment Horizon *</label>
                                    <select class="form-select profile-input" id="investmentHorizon" required>
                                        <option value="">Select horizon...</option>
                                        <option value="short-term">Short-term (1-3 years)</option>
                                        <option value="medium-term">Medium-term (3-7 years)</option>
                                        <option value="long-term">Long-term (7+ years)</option>
                                    </select>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Compliance Frameworks (Select all that apply)</label>
                                <div class="row">
                                    <div class="col-md-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="sfdr" value="sfdr">
                                            <label class="form-check-label" for="sfdr">SFDR</label>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="csrd" value="csrd">
                                            <label class="form-check-label" for="csrd">CSRD</label>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="tcfd" value="tcfd">
                                            <label class="form-check-label" for="tcfd">TCFD</label>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="gri" value="gri">
                                            <label class="form-check-label" for="gri">GRI</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer" style="border-top: 1px solid var(--glass-border);">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Skip for Now</button>
                        <button type="button" class="btn btn-primary" onclick="auxeiraProfile.saveProfileFromModal()">
                            <i class="fas fa-save me-2"></i>Save Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.populateProfileForm();
    }

    generateSDGCheckboxes() {
        const sdgs = [
            {num: 1, title: 'No Poverty'}, {num: 2, title: 'Zero Hunger'}, 
            {num: 3, title: 'Good Health'}, {num: 4, title: 'Quality Education'},
            {num: 5, title: 'Gender Equality'}, {num: 6, title: 'Clean Water'},
            {num: 7, title: 'Clean Energy'}, {num: 8, title: 'Decent Work'},
            {num: 9, title: 'Innovation'}, {num: 10, title: 'Reduced Inequalities'},
            {num: 11, title: 'Sustainable Cities'}, {num: 12, title: 'Responsible Consumption'},
            {num: 13, title: 'Climate Action'}, {num: 14, title: 'Life Below Water'},
            {num: 15, title: 'Life on Land'}, {num: 16, title: 'Peace & Justice'},
            {num: 17, title: 'Partnerships'}
        ];

        return sdgs.map(sdg => `
            <div class="col-md-4 col-sm-6">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="sdg${sdg.num}" value="${sdg.num}">
                    <label class="form-check-label" for="sdg${sdg.num}">
                        SDG ${sdg.num}: ${sdg.title}
                    </label>
                </div>
            </div>
        `).join('');
    }

    createProfileCompletionBar() {
        const completionHTML = `
        <div id="profileCompletionBar" class="profile-completion-bar" style="
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--glass-border);
            padding: 0.75rem 1rem;
            z-index: 999;
            display: ${this.profileData.completionPercentage < this.completionThreshold ? 'flex' : 'none'};
            justify-content: space-between;
            align-items: center;
        ">
            <div class="completion-info">
                <i class="fas fa-user-cog me-2"></i>
                <span>Profile <strong id="completionPercentage">${this.profileData.completionPercentage}%</strong> complete</span>
                <small class="ms-2 text-muted">Complete your profile to unlock personalized insights</small>
            </div>
            <div class="completion-actions">
                <button class="btn btn-sm btn-outline-primary me-2" onclick="auxeiraProfile.showProfileModal()">
                    Complete Profile
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="auxeiraProfile.hideCompletionBar()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('afterbegin', completionHTML);
    }

    createFloatingProfileButton() {
        const buttonHTML = `
        <div id="floatingProfileButton" class="floating-profile-button" style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            display: ${this.profileData.completionPercentage < this.completionThreshold ? 'block' : 'none'};
        ">
            <button class="btn btn-primary rounded-circle p-3" onclick="auxeiraProfile.showProfileModal()" 
                    style="width: 60px; height: 60px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);"
                    title="Complete your profile for personalized insights">
                <i class="fas fa-user-plus"></i>
            </button>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', buttonHTML);
    }

    startNudgeSystem() {
        // Show profile modal on first visit if profile is incomplete
        if (this.profileData.completionPercentage < 30 && !this.profileData.lastLogin) {
            setTimeout(() => this.showProfileModal(), 3000);
        }

        // Periodic nudges for incomplete profiles
        if (this.profileData.completionPercentage < this.completionThreshold) {
            setInterval(() => {
                this.showContextualNudge();
            }, this.nudgeFrequency);
        }
    }

    showContextualNudge() {
        const nudges = [
            {
                condition: () => !this.profileData.organizationName,
                message: "Add your organization name to see customized content",
                action: "Complete Profile"
            },
            {
                condition: () => this.profileData.focusAreas.length === 0,
                message: "Select your SDG focus areas to get relevant insights",
                action: "Add Focus Areas"
            },
            {
                condition: () => !this.profileData.investmentSize,
                message: "Tell us your investment size for better recommendations",
                action: "Update Profile"
            }
        ];

        const applicableNudge = nudges.find(nudge => nudge.condition());
        if (applicableNudge) {
            this.showToastNudge(applicableNudge.message, applicableNudge.action);
        }
    }

    showToastNudge(message, actionText) {
        const toastHTML = `
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div class="toast profile-nudge-toast" role="alert" aria-live="assertive" aria-atomic="true" 
                 style="background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid var(--primary-color);">
                <div class="toast-header" style="background: transparent; border-bottom: 1px solid var(--glass-border);">
                    <i class="fas fa-lightbulb text-warning me-2"></i>
                    <strong class="me-auto">Personalization Tip</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                    <div class="mt-2">
                        <button class="btn btn-sm btn-primary" onclick="auxeiraProfile.showProfileModal()">
                            ${actionText}
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', toastHTML);
        const toast = new bootstrap.Toast(document.querySelector('.profile-nudge-toast'));
        toast.show();

        // Remove toast element after it's hidden
        document.querySelector('.profile-nudge-toast').addEventListener('hidden.bs.toast', function() {
            this.closest('.toast-container').remove();
        });
    }

    personalizeContent() {
        // Update organization name throughout the dashboard
        if (this.profileData.organizationName) {
            document.querySelectorAll('#orgName, #orgNameStories, #orgNameReports').forEach(el => {
                el.textContent = this.profileData.organizationName;
            });
        }

        // Update user profile display
        if (this.profileData.userRole && this.profileData.organizationType) {
            const profileText = `${this.profileData.userRole.replace('-', ' ')} - ${this.profileData.organizationType.replace('-', ' ')}`;
            document.querySelectorAll('#userProfile').forEach(el => {
                el.textContent = profileText;
            });
        }

        // Show relevant SDG recommendations
        if (this.profileData.focusAreas.length > 0) {
            this.showRelevantSDGRecommendations();
        }

        // Customize report recommendations
        this.customizeReportRecommendations();
    }

    showRelevantSDGRecommendations() {
        const recommendationsHTML = `
        <div class="personalized-recommendations glass-card">
            <h5><i class="fas fa-bullseye me-2"></i>Recommended for Your Focus Areas</h5>
            <p>Based on your selected SDG focus areas: ${this.profileData.focusAreas.map(sdg => `SDG ${sdg}`).join(', ')}</p>
            <div class="row">
                ${this.generateSDGRecommendations()}
            </div>
        </div>`;

        const container = document.querySelector('.container .row').parentNode;
        container.insertAdjacentHTML('afterbegin', recommendationsHTML);
    }

    generateSDGRecommendations() {
        return this.profileData.focusAreas.slice(0, 3).map(sdg => `
            <div class="col-md-4">
                <div class="recommendation-card p-3 border rounded">
                    <h6>SDG ${sdg} Dashboard</h6>
                    <p class="small">Explore detailed analytics for this focus area</p>
                    <a href="esg_${this.getSDGFilename(sdg)}_enhanced.html" class="btn btn-sm btn-primary">
                        View Dashboard
                    </a>
                </div>
            </div>
        `).join('');
    }

    getSDGFilename(sdgNumber) {
        const sdgMap = {
            1: 'poverty', 2: 'hunger', 3: 'health', 4: 'education', 5: 'gender',
            6: 'water', 7: 'energy', 8: 'work', 9: 'innovation', 10: 'inequalities',
            11: 'cities', 12: 'consumption', 13: 'climate', 14: 'ocean', 
            15: 'land', 16: 'justice', 17: 'partnerships'
        };
        return sdgMap[sdgNumber] || 'poverty';
    }

    customizeReportRecommendations() {
        if (this.profileData.complianceFrameworks.length > 0) {
            const complianceReports = this.profileData.complianceFrameworks.map(framework => `
                <div class="col-md-4">
                    <div class="report-preview">
                        <h6>${framework.toUpperCase()} Compliance Report</h6>
                        <p class="small">Tailored for your ${framework.toUpperCase()} reporting requirements...</p>
                        <button class="btn-unlock" onclick="purchaseReport('${framework}-compliance', 99)">$99 - Unlock</button>
                    </div>
                </div>
            `).join('');

            const reportsContainer = document.querySelector('#reports .row');
            if (reportsContainer) {
                reportsContainer.insertAdjacentHTML('beforeend', complianceReports);
            }
        }
    }

    // Modal management functions
    showProfileModal() {
        const modal = new bootstrap.Modal(document.getElementById('profileModal'));
        modal.show();
    }

    hideCompletionBar() {
        document.getElementById('profileCompletionBar').style.display = 'none';
        document.getElementById('floatingProfileButton').style.display = 'none';
    }

    populateProfileForm() {
        // Populate form with existing profile data
        Object.keys(this.profileData).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = this.profileData[key];
                } else {
                    element.value = this.profileData[key];
                }
            }
        });

        // Handle SDG focus areas checkboxes
        this.profileData.focusAreas.forEach(sdg => {
            const checkbox = document.getElementById(`sdg${sdg}`);
            if (checkbox) checkbox.checked = true;
        });

        // Handle compliance frameworks checkboxes
        this.profileData.complianceFrameworks.forEach(framework => {
            const checkbox = document.getElementById(framework);
            if (checkbox) checkbox.checked = true;
        });
    }

    saveProfileFromModal() {
        const form = document.getElementById('profileForm');
        const formData = new FormData(form);

        // Update basic fields
        ['organizationName', 'organizationType', 'userRole', 'country', 'website', 
         'investmentSize', 'investmentHorizon'].forEach(field => {
            this.profileData[field] = formData.get(field) || '';
        });

        // Handle SDG focus areas
        this.profileData.focusAreas = [];
        for (let i = 1; i <= 17; i++) {
            if (document.getElementById(`sdg${i}`)?.checked) {
                this.profileData.focusAreas.push(i);
            }
        }

        // Handle compliance frameworks
        this.profileData.complianceFrameworks = [];
        ['sfdr', 'csrd', 'tcfd', 'gri'].forEach(framework => {
            if (document.getElementById(framework)?.checked) {
                this.profileData.complianceFrameworks.push(framework);
            }
        });

        this.profileData.lastLogin = new Date().toISOString();
        this.saveProfile();

        // Hide modal and completion bar if profile is complete enough
        bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
        if (this.profileData.completionPercentage >= this.completionThreshold) {
            this.hideCompletionBar();
        }

        this.showSuccessMessage();
    }

    showSuccessMessage() {
        const successHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert" style="
            position: fixed; top: 100px; right: 20px; z-index: 1050; max-width: 400px;
            background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid #10b981;
        ">
            <i class="fas fa-check-circle me-2"></i>
            <strong>Profile Updated!</strong> Your dashboard is now personalized with relevant insights.
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert"></button>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', successHTML);
        setTimeout(() => {
            const alert = document.querySelector('.alert-success');
            if (alert) alert.remove();
        }, 5000);
    }

    updateProfileCompletionBar() {
        const percentageElement = document.getElementById('completionPercentage');
        if (percentageElement) {
            percentageElement.textContent = this.profileData.completionPercentage + '%';
        }
    }

    trackUserBehavior() {
        // Track dashboard visits
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage.includes('esg_') && !this.profileData.dashboardsVisited.includes(currentPage)) {
            this.profileData.dashboardsVisited.push(currentPage);
            this.saveProfile();
        }

        // Track report downloads
        document.addEventListener('click', (e) => {
            if (e.target.textContent.includes('Download') || e.target.textContent.includes('Free')) {
                const reportType = 'free-report-' + currentPage.replace('.html', '');
                if (!this.profileData.reportsDownloaded.includes(reportType)) {
                    this.profileData.reportsDownloaded.push(reportType);
                    this.saveProfile();
                }
            }
        });
    }
}

// Initialize the profile system
let auxeiraProfile;
document.addEventListener('DOMContentLoaded', function() {
    auxeiraProfile = new AuxeiraProfileSystem();
});

// Add CSS for profile system
const profileCSS = `
<style>
.profile-input {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ffffff;
}

.profile-input:focus {
    background: rgba(255, 255, 255, 0.15);
    border-color: var(--primary-color);
    color: #ffffff;
    box-shadow: 0 0 0 0.2rem rgba(var(--primary-color-rgb), 0.25);
}

.profile-input option {
    background: #1a1a1a;
    color: #ffffff;
}

.form-check-input:checked {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

.recommendation-card {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border) !important;
    transition: all 0.3s ease;
}

.recommendation-card:hover {
    transform: translateY(-2px);
    border-color: var(--primary-color) !important;
}

.personalized-recommendations {
    border-left: 4px solid var(--primary-color);
    background: linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.1), rgba(var(--secondary-color-rgb), 0.05));
}

@media (max-width: 768px) {
    .profile-completion-bar {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .completion-actions {
        width: 100%;
        display: flex;
        justify-content: space-between;
    }
}
</style>`;

document.head.insertAdjacentHTML('beforeend', profileCSS);
