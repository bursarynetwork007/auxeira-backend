/**
 * Auxeira Story Studio Frontend Integration
 * Interactive drag-and-drop story creation with AI assistance
 */

class AuxeiraStoryStudio {
    constructor() {
        this.currentUser = null;
        this.currentStory = null;
        this.draggedElement = null;
        this.aiCache = new Map();
        this.subscriptionTier = 'free';
        
        this.storyElements = {
            'hero-section': { icon: 'fas fa-star', name: 'Hero Section', aiGenerated: true },
            'impact-metric': { icon: 'fas fa-chart-line', name: 'Impact Metric', aiGenerated: false },
            'success-story': { icon: 'fas fa-trophy', name: 'Success Story', aiGenerated: true },
            'data-visualization': { icon: 'fas fa-chart-bar', name: 'Data Chart', aiGenerated: false },
            'call-to-action': { icon: 'fas fa-bullhorn', name: 'Call to Action', aiGenerated: true },
            'testimonial': { icon: 'fas fa-quote-left', name: 'Testimonial', aiGenerated: true },
            'timeline': { icon: 'fas fa-clock', name: 'Timeline', aiGenerated: false },
            'comparison-table': { icon: 'fas fa-table', name: 'Comparison Table', aiGenerated: false }
        };

        this.init();
    }

    async init() {
        await this.loadUserProfile();
        this.setupEventListeners();
        this.initializeInteractJS();
        this.setupAIIntegration();
        this.renderStoryStudio();
    }

    // ===========================================
    // USER PROFILE & AUTHENTICATION
    // ===========================================

    async loadUserProfile() {
        try {
            const token = localStorage.getItem('auxeira_token');
            if (!token) {
                this.redirectToLogin();
                return;
            }

            const response = await fetch('/api/profile/current', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.profile;
                this.subscriptionTier = data.profile.subscriptionTier || 'free';
                this.updateUIForSubscription();
            } else {
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.redirectToLogin();
        }
    }

    updateUIForSubscription() {
        const premiumFeatures = document.querySelectorAll('.premium-feature');
        const enterpriseFeatures = document.querySelectorAll('.enterprise-feature');

        if (this.subscriptionTier === 'free') {
            premiumFeatures.forEach(el => {
                el.classList.add('locked');
                el.setAttribute('data-upgrade-required', 'premium');
            });
            enterpriseFeatures.forEach(el => {
                el.classList.add('locked');
                el.setAttribute('data-upgrade-required', 'enterprise');
            });
        } else if (this.subscriptionTier === 'premium') {
            premiumFeatures.forEach(el => el.classList.remove('locked'));
            enterpriseFeatures.forEach(el => {
                el.classList.add('locked');
                el.setAttribute('data-upgrade-required', 'enterprise');
            });
        } else {
            premiumFeatures.forEach(el => el.classList.remove('locked'));
            enterpriseFeatures.forEach(el => el.classList.remove('locked'));
        }
    }

    // ===========================================
    // INTERACT.JS DRAG & DROP SETUP
    // ===========================================

    initializeInteractJS() {
        // Make story elements draggable
        interact('.story-element')
            .draggable({
                inertia: true,
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: 'parent',
                        endOnly: true
                    })
                ],
                autoScroll: true,
                listeners: {
                    start: (event) => this.onDragStart(event),
                    move: (event) => this.onDragMove(event),
                    end: (event) => this.onDragEnd(event)
                }
            });

        // Make canvas droppable
        interact('.story-canvas')
            .dropzone({
                accept: '.story-element',
                overlap: 0.25,
                ondragenter: (event) => this.onDropEnter(event),
                ondragleave: (event) => this.onDropLeave(event),
                ondrop: (event) => this.onDrop(event)
            });

        // Make canvas elements resizable and movable
        interact('.canvas-element')
            .resizable({
                edges: { left: true, right: true, bottom: true, top: true },
                listeners: {
                    move: (event) => this.onElementResize(event)
                },
                modifiers: [
                    interact.modifiers.restrictEdges({
                        outer: 'parent'
                    }),
                    interact.modifiers.restrictSize({
                        min: { width: 100, height: 50 }
                    })
                ]
            })
            .draggable({
                listeners: {
                    move: (event) => this.onElementMove(event)
                },
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: 'parent'
                    })
                ]
            });
    }

    onDragStart(event) {
        const element = event.target;
        this.draggedElement = {
            type: element.dataset.elementType,
            name: element.dataset.elementName,
            aiGenerated: element.dataset.aiGenerated === 'true'
        };

        element.classList.add('dragging');
        this.showDropZones();
    }

    onDragMove(event) {
        const target = event.target;
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    }

    onDragEnd(event) {
        event.target.classList.remove('dragging');
        this.hideDropZones();
        
        // Reset position if not dropped in valid zone
        if (!event.dropzone) {
            event.target.style.transform = '';
            event.target.removeAttribute('data-x');
            event.target.removeAttribute('data-y');
        }
    }

    onDropEnter(event) {
        event.target.classList.add('drop-active');
    }

    onDropLeave(event) {
        event.target.classList.remove('drop-active');
    }

    async onDrop(event) {
        event.target.classList.remove('drop-active');
        
        if (!this.draggedElement) return;

        // Check subscription access for AI-generated elements
        if (this.draggedElement.aiGenerated && !this.hasAIAccess()) {
            this.showUpgradeModal(this.draggedElement.type);
            return;
        }

        // Create element on canvas
        await this.createCanvasElement(
            this.draggedElement,
            event.dragEvent.client.x - event.target.getBoundingClientRect().left,
            event.dragEvent.client.y - event.target.getBoundingClientRect().top
        );

        this.draggedElement = null;
    }

    onElementResize(event) {
        const target = event.target;
        let x = parseFloat(target.getAttribute('data-x')) || 0;
        let y = parseFloat(target.getAttribute('data-y')) || 0;

        target.style.width = event.rect.width + 'px';
        target.style.height = event.rect.height + 'px';

        x += event.deltaRect.left;
        y += event.deltaRect.top;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    }

    onElementMove(event) {
        const target = event.target;
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);

        this.saveStoryState();
    }

    // ===========================================
    // AI INTEGRATION
    // ===========================================

    setupAIIntegration() {
        this.aiProviders = {
            'hero-section': 'claude',
            'success-story': 'claude',
            'call-to-action': 'claude',
            'testimonial': 'claude'
        };
    }

    async generateAIContent(elementType, context = {}) {
        try {
            this.showAIGenerating(elementType);

            const cacheKey = `${elementType}_${this.currentUser.id}_${JSON.stringify(context)}`;
            
            // Check cache first
            if (this.aiCache.has(cacheKey)) {
                return this.aiCache.get(cacheKey);
            }

            const response = await fetch('/api/ai/generate/story-studio/' + elementType, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auxeira_token')}`
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    context: {
                        ...context,
                        organizationName: this.currentUser.organizationName,
                        organizationType: this.currentUser.organizationType,
                        focusAreas: this.currentUser.focusAreas || [],
                        brandTone: this.currentUser.aiEnhancedData?.brandTone || 'professional'
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.upgradeRequired) {
                    this.showUpgradeModal(elementType, errorData.suggestedTier);
                    return errorData.limitedContent;
                }
                throw new Error(errorData.error || 'AI generation failed');
            }

            const data = await response.json();
            
            // Cache the result
            this.aiCache.set(cacheKey, data.content);
            
            this.hideAIGenerating();
            return data.content;

        } catch (error) {
            console.error('AI content generation error:', error);
            this.hideAIGenerating();
            return this.getFallbackContent(elementType);
        }
    }

    async createCanvasElement(elementData, x, y) {
        const elementId = `element_${Date.now()}`;
        
        let content = '';
        if (elementData.aiGenerated) {
            content = await this.generateAIContent(elementData.type, {
                position: { x, y },
                storyContext: this.getStoryContext()
            });
        } else {
            content = this.getDefaultContent(elementData.type);
        }

        const element = document.createElement('div');
        element.className = 'canvas-element';
        element.id = elementId;
        element.dataset.elementType = elementData.type;
        element.style.left = x + 'px';
        element.style.top = y + 'px';
        element.setAttribute('data-x', 0);
        element.setAttribute('data-y', 0);

        element.innerHTML = `
            <div class="element-header">
                <i class="${this.storyElements[elementData.type].icon}"></i>
                <span>${elementData.name}</span>
                <div class="element-controls">
                    ${elementData.aiGenerated ? '<button class="btn-regenerate" onclick="auxeiraStoryStudio.regenerateContent(\'' + elementId + '\')"><i class="fas fa-sync"></i></button>' : ''}
                    <button class="btn-edit" onclick="auxeiraStoryStudio.editElement(\'' + elementId + '\')"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="auxeiraStoryStudio.deleteElement(\'' + elementId + '\')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="element-content" contenteditable="${!elementData.aiGenerated}">
                ${content}
            </div>
        `;

        document.querySelector('.story-canvas').appendChild(element);
        this.saveStoryState();
    }

    // ===========================================
    // STORY MANAGEMENT
    // ===========================================

    async saveStoryState() {
        if (!this.currentStory) {
            this.currentStory = {
                id: `story_${Date.now()}`,
                userId: this.currentUser.id,
                title: 'Untitled Story',
                created: new Date().toISOString(),
                elements: []
            };
        }

        // Collect all canvas elements
        const elements = [];
        document.querySelectorAll('.canvas-element').forEach(el => {
            elements.push({
                id: el.id,
                type: el.dataset.elementType,
                position: {
                    x: parseFloat(el.getAttribute('data-x')) || 0,
                    y: parseFloat(el.getAttribute('data-y')) || 0
                },
                size: {
                    width: el.style.width || 'auto',
                    height: el.style.height || 'auto'
                },
                content: el.querySelector('.element-content').innerHTML,
                styles: el.getAttribute('style') || ''
            });
        });

        this.currentStory.elements = elements;
        this.currentStory.lastModified = new Date().toISOString();

        // Save to backend
        try {
            await fetch('/api/story-studio/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auxeira_token')}`
                },
                body: JSON.stringify(this.currentStory)
            });
        } catch (error) {
            console.error('Error saving story:', error);
        }
    }

    async loadStory(storyId) {
        try {
            const response = await fetch(`/api/story-studio/load/${storyId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auxeira_token')}`
                }
            });

            if (response.ok) {
                const story = await response.json();
                this.currentStory = story;
                this.renderStoryOnCanvas();
            }
        } catch (error) {
            console.error('Error loading story:', error);
        }
    }

    renderStoryOnCanvas() {
        const canvas = document.querySelector('.story-canvas');
        canvas.innerHTML = '';

        this.currentStory.elements.forEach(elementData => {
            const element = document.createElement('div');
            element.className = 'canvas-element';
            element.id = elementData.id;
            element.dataset.elementType = elementData.type;
            element.style.cssText = elementData.styles;
            element.setAttribute('data-x', elementData.position.x);
            element.setAttribute('data-y', elementData.position.y);

            const elementConfig = this.storyElements[elementData.type];
            element.innerHTML = `
                <div class="element-header">
                    <i class="${elementConfig.icon}"></i>
                    <span>${elementConfig.name}</span>
                    <div class="element-controls">
                        ${elementConfig.aiGenerated ? '<button class="btn-regenerate" onclick="auxeiraStoryStudio.regenerateContent(\'' + elementData.id + '\')"><i class="fas fa-sync"></i></button>' : ''}
                        <button class="btn-edit" onclick="auxeiraStoryStudio.editElement(\'' + elementData.id + '\')"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" onclick="auxeiraStoryStudio.deleteElement(\'' + elementData.id + '\')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="element-content" contenteditable="${!elementConfig.aiGenerated}">
                    ${elementData.content}
                </div>
            `;

            canvas.appendChild(element);
        });
    }

    // ===========================================
    // UI RENDERING
    // ===========================================

    renderStoryStudio() {
        const container = document.getElementById('story-studio-container');
        if (!container) return;

        container.innerHTML = `
            <div class="story-studio">
                <div class="studio-header">
                    <h2><i class="fas fa-magic me-2"></i>Story Studio</h2>
                    <div class="studio-controls">
                        <button class="btn btn-outline-primary" onclick="auxeiraStoryStudio.newStory()">
                            <i class="fas fa-plus me-1"></i>New Story
                        </button>
                        <button class="btn btn-primary" onclick="auxeiraStoryStudio.saveStory()">
                            <i class="fas fa-save me-1"></i>Save
                        </button>
                        <button class="btn btn-success" onclick="auxeiraStoryStudio.publishStory()">
                            <i class="fas fa-share me-1"></i>Publish
                        </button>
                    </div>
                </div>

                <div class="studio-workspace">
                    <div class="elements-panel">
                        <h4>Story Elements</h4>
                        <div class="elements-grid">
                            ${Object.entries(this.storyElements).map(([type, config]) => `
                                <div class="story-element ${config.aiGenerated ? 'ai-powered' : ''}" 
                                     data-element-type="${type}" 
                                     data-element-name="${config.name}"
                                     data-ai-generated="${config.aiGenerated}">
                                    <i class="${config.icon}"></i>
                                    <span>${config.name}</span>
                                    ${config.aiGenerated ? '<div class="ai-badge"><i class="fas fa-brain"></i></div>' : ''}
                                </div>
                            `).join('')}
                        </div>

                        <div class="ai-assistant ${this.subscriptionTier === 'free' ? 'premium-feature' : ''}">
                            <h5><i class="fas fa-robot me-2"></i>AI Assistant</h5>
                            <div class="ai-suggestions" id="ai-suggestions">
                                <p>Drag AI-powered elements to get personalized suggestions!</p>
                            </div>
                        </div>
                    </div>

                    <div class="story-canvas-container">
                        <div class="canvas-toolbar">
                            <button class="btn btn-sm btn-outline-secondary" onclick="auxeiraStoryStudio.zoomIn()">
                                <i class="fas fa-search-plus"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="auxeiraStoryStudio.zoomOut()">
                                <i class="fas fa-search-minus"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="auxeiraStoryStudio.resetZoom()">
                                <i class="fas fa-expand-arrows-alt"></i>
                            </button>
                            <div class="canvas-info">
                                <span id="canvas-zoom">100%</span>
                            </div>
                        </div>
                        
                        <div class="story-canvas" id="story-canvas">
                            <div class="canvas-placeholder">
                                <i class="fas fa-mouse-pointer fa-3x mb-3"></i>
                                <h4>Drag elements here to build your story</h4>
                                <p>Use AI-powered elements for personalized content</p>
                            </div>
                        </div>
                    </div>

                    <div class="properties-panel">
                        <h4>Properties</h4>
                        <div id="element-properties">
                            <p class="text-muted">Select an element to edit properties</p>
                        </div>

                        <div class="story-settings mt-4">
                            <h5>Story Settings</h5>
                            <div class="form-group">
                                <label>Story Title</label>
                                <input type="text" class="form-control" id="story-title" value="${this.currentStory?.title || 'Untitled Story'}">
                            </div>
                            <div class="form-group">
                                <label>Target Audience</label>
                                <select class="form-control" id="target-audience">
                                    <option value="investors">Investors</option>
                                    <option value="donors">Donors</option>
                                    <option value="stakeholders">Stakeholders</option>
                                    <option value="general">General Public</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- AI Loading Modal -->
            <div class="modal fade" id="ai-loading-modal" tabindex="-1">
                <div class="modal-dialog modal-sm">
                    <div class="modal-content">
                        <div class="modal-body text-center">
                            <div class="spinner-border text-primary mb-3" role="status"></div>
                            <h5>AI is generating content...</h5>
                            <p class="text-muted">This may take a few seconds</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Upgrade Modal -->
            <div class="modal fade" id="upgrade-modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Upgrade Required</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <i class="fas fa-lock fa-3x text-warning mb-3"></i>
                                <h4>Premium Feature</h4>
                                <p>This AI-powered feature requires a premium subscription.</p>
                            </div>
                            <div class="upgrade-benefits">
                                <h6>Premium Benefits:</h6>
                                <ul>
                                    <li>AI-generated story elements</li>
                                    <li>Personalized content creation</li>
                                    <li>Advanced analytics</li>
                                    <li>Priority support</li>
                                </ul>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="auxeiraStoryStudio.upgradeSubscription()">
                                Upgrade Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Story title change
        document.addEventListener('change', (e) => {
            if (e.target.id === 'story-title') {
                if (this.currentStory) {
                    this.currentStory.title = e.target.value;
                    this.saveStoryState();
                }
            }
        });

        // Element content editing
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('element-content')) {
                this.saveStoryState();
            }
        });

        // Locked feature clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.locked')) {
                e.preventDefault();
                const upgradeRequired = e.target.closest('.locked').dataset.upgradeRequired;
                this.showUpgradeModal('premium-feature', upgradeRequired);
            }
        });
    }

    // ===========================================
    // UTILITY METHODS
    // ===========================================

    hasAIAccess() {
        return this.subscriptionTier !== 'free';
    }

    showDropZones() {
        document.querySelectorAll('.story-canvas').forEach(zone => {
            zone.classList.add('drop-zone-active');
        });
    }

    hideDropZones() {
        document.querySelectorAll('.story-canvas').forEach(zone => {
            zone.classList.remove('drop-zone-active');
        });
    }

    showAIGenerating(elementType) {
        const modal = new bootstrap.Modal(document.getElementById('ai-loading-modal'));
        modal.show();
    }

    hideAIGenerating() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('ai-loading-modal'));
        if (modal) modal.hide();
    }

    showUpgradeModal(feature, tier = 'premium') {
        const modal = new bootstrap.Modal(document.getElementById('upgrade-modal'));
        modal.show();
    }

    upgradeSubscription() {
        window.location.href = '/upgrade?source=story-studio';
    }

    getStoryContext() {
        return {
            title: this.currentStory?.title || 'Untitled Story',
            elementCount: document.querySelectorAll('.canvas-element').length,
            targetAudience: document.getElementById('target-audience')?.value || 'investors'
        };
    }

    getFallbackContent(elementType) {
        const fallbacks = {
            'hero-section': '<h2>Your Impact Story Starts Here</h2><p>Compelling narrative about your organization\'s mission and impact.</p>',
            'success-story': '<h4>Success Story</h4><p>Share a specific example of positive impact achieved through your work.</p>',
            'call-to-action': '<div class="cta-button">Take Action Now</div><p>Encourage your audience to get involved.</p>',
            'testimonial': '<blockquote>"This organization has made a tremendous difference in our community."</blockquote><cite>- Satisfied Stakeholder</cite>'
        };
        return fallbacks[elementType] || '<p>Content placeholder</p>';
    }

    getDefaultContent(elementType) {
        const defaults = {
            'impact-metric': '<div class="metric"><span class="number">1,000+</span><span class="label">Lives Impacted</span></div>',
            'data-visualization': '<canvas id="chart-' + Date.now() + '" width="300" height="200"></canvas>',
            'timeline': '<div class="timeline-item"><div class="date">2024</div><div class="event">Major milestone achieved</div></div>',
            'comparison-table': '<table class="table"><tr><th>Before</th><th>After</th></tr><tr><td>Baseline</td><td>Improved</td></tr></table>'
        };
        return defaults[elementType] || '<p>Add your content here</p>';
    }

    redirectToLogin() {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    }

    // Public methods for global access
    async regenerateContent(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const elementType = element.dataset.elementType;
        const newContent = await this.generateAIContent(elementType, {
            regenerate: true,
            currentContent: element.querySelector('.element-content').innerHTML
        });

        element.querySelector('.element-content').innerHTML = newContent;
        this.saveStoryState();
    }

    editElement(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Show properties panel for this element
        this.showElementProperties(element);
    }

    deleteElement(elementId) {
        const element = document.getElementById(elementId);
        if (element && confirm('Delete this element?')) {
            element.remove();
            this.saveStoryState();
        }
    }

    newStory() {
        if (confirm('Create a new story? Unsaved changes will be lost.')) {
            this.currentStory = null;
            document.querySelector('.story-canvas').innerHTML = '<div class="canvas-placeholder"><i class="fas fa-mouse-pointer fa-3x mb-3"></i><h4>Drag elements here to build your story</h4><p>Use AI-powered elements for personalized content</p></div>';
            document.getElementById('story-title').value = 'Untitled Story';
        }
    }

    async saveStory() {
        await this.saveStoryState();
        this.showToast('Story saved successfully!', 'success');
    }

    publishStory() {
        // Implementation for publishing story
        this.showToast('Story published!', 'success');
    }

    showToast(message, type = 'info') {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize Story Studio when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auxeiraStoryStudio = new AuxeiraStoryStudio();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuxeiraStoryStudio;
}
