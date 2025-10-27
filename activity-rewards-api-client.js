/**
 * Activity Rewards API Client
 * 
 * This module provides a simple client for interacting with the Activity Rewards API.
 * Include this in your frontend dashboard to connect to the backend.
 * 
 * Usage:
 * 1. Include this script in your HTML: <script src="activity-rewards-api-client.js"></script>
 * 2. Initialize: const api = new ActivityRewardsAPI('https://api.auxeira.com', 'your-jwt-token');
 * 3. Call methods: const activities = await api.getActivities();
 */

class ActivityRewardsAPI {
  /**
   * Initialize the API client
   * @param {string} baseURL - Base URL of the API (e.g., 'https://api.auxeira.com')
   * @param {string} token - JWT authentication token
   */
  constructor(baseURL, token) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
  }

  /**
   * Make an authenticated API request
   * @private
   */
  async _request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ============================================================================
  // ACTIVITY CATALOG METHODS
  // ============================================================================

  /**
   * Get list of available activities
   * @param {Object} filters - Optional filters
   * @param {string} filters.stage - Startup stage (pre-seed, seed, series-a, etc.)
   * @param {string} filters.category - Activity category
   * @param {string} filters.tier - Activity tier (bronze, silver, gold)
   * @returns {Promise<Object>} Activities data
   */
  async getActivities(filters = {}) {
    const params = new URLSearchParams();
    if (filters.stage) params.append('stage', filters.stage);
    if (filters.category) params.append('category', filters.category);
    if (filters.tier) params.append('tier', filters.tier);

    const query = params.toString() ? `?${params.toString()}` : '';
    return await this._request(`/api/activities${query}`);
  }

  /**
   * Get details of a specific activity
   * @param {number} activityId - Activity ID
   * @returns {Promise<Object>} Activity details
   */
  async getActivity(activityId) {
    return await this._request(`/api/activities/${activityId}`);
  }

  // ============================================================================
  // SUBMISSION METHODS
  // ============================================================================

  /**
   * Submit an activity for assessment
   * @param {Object} submission - Submission data
   * @param {number} submission.activity_id - Activity ID
   * @param {string} submission.proof_text - Proof text (min 50 chars)
   * @param {string[]} submission.proof_urls - Optional proof URLs
   * @param {Object} submission.metadata - Optional metadata
   * @returns {Promise<Object>} Submission result
   */
  async submitActivity(submission) {
    return await this._request('/api/activities/submit', {
      method: 'POST',
      body: JSON.stringify(submission),
    });
  }

  /**
   * Get user's activity submissions
   * @param {Object} options - Query options
   * @param {string} options.status - Filter by status (pending, processing, approved, rejected)
   * @param {number} options.limit - Number of results (1-100)
   * @param {number} options.offset - Pagination offset
   * @returns {Promise<Object>} Submissions data
   */
  async getSubmissions(options = {}) {
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);

    const query = params.toString() ? `?${params.toString()}` : '';
    return await this._request(`/api/activities/submissions${query}`);
  }

  /**
   * Get details of a specific submission
   * @param {string} submissionId - Submission UUID
   * @returns {Promise<Object>} Submission details
   */
  async getSubmission(submissionId) {
    return await this._request(`/api/activities/submissions/${submissionId}`);
  }

  // ============================================================================
  // TOKEN CALCULATION METHODS
  // ============================================================================

  /**
   * Calculate tokens for a submission
   * @param {Object} calculation - Calculation data
   * @param {string} calculation.submission_id - Submission UUID
   * @param {number} calculation.quality_score - Quality score (0.0-1.0)
   * @param {number} calculation.consistency_weeks - Consistency weeks (optional)
   * @returns {Promise<Object>} Token calculation result
   */
  async calculateTokens(calculation) {
    return await this._request('/api/activities/calculate-tokens', {
      method: 'POST',
      body: JSON.stringify(calculation),
    });
  }

  // ============================================================================
  // HISTORY METHODS
  // ============================================================================

  /**
   * Get user's activity history
   * @param {Object} options - Query options
   * @param {string} options.start_date - Start date (ISO 8601)
   * @param {string} options.end_date - End date (ISO 8601)
   * @returns {Promise<Object>} Activity history data
   */
  async getActivityHistory(options = {}) {
    const params = new URLSearchParams();
    if (options.start_date) params.append('start_date', options.start_date);
    if (options.end_date) params.append('end_date', options.end_date);

    const query = params.toString() ? `?${params.toString()}` : '';
    return await this._request(`/api/activities/history${query}`);
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * Example: Initialize and use the API client
 */
async function exampleUsage() {
  // Initialize the client
  const api = new ActivityRewardsAPI('https://api.auxeira.com', 'your-jwt-token-here');

  try {
    // 1. Fetch all activities
    console.log('Fetching activities...');
    const activitiesResponse = await api.getActivities();
    console.log('Activities:', activitiesResponse.data.activities);

    // 2. Filter activities by tier
    console.log('\nFetching gold tier activities...');
    const goldActivities = await api.getActivities({ tier: 'gold' });
    console.log('Gold activities:', goldActivities.data.activities);

    // 3. Submit an activity
    console.log('\nSubmitting activity...');
    const submission = await api.submitActivity({
      activity_id: 1,
      proof_text: 'Conducted 5 customer interviews with detailed notes. Key insights documented.',
      proof_urls: ['https://example.com/notes.pdf'],
      metadata: { interview_count: 5 }
    });
    console.log('Submission:', submission.data);

    // 4. Get user's submissions
    console.log('\nFetching submissions...');
    const submissions = await api.getSubmissions({ status: 'approved', limit: 10 });
    console.log('Submissions:', submissions.data.submissions);

    // 5. Get activity history
    console.log('\nFetching activity history...');
    const history = await api.getActivityHistory();
    console.log('History totals:', history.data.totals);
    console.log('Recent activities:', history.data.activities);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// INTEGRATION WITH DASHBOARD
// ============================================================================

/**
 * Integration example for the Activity Rewards dashboard tab
 */
class ActivityRewardsDashboard {
  constructor(apiClient) {
    this.api = apiClient;
    this.activities = [];
    this.submissions = [];
    this.history = null;
  }

  /**
   * Initialize the dashboard - load all data
   */
  async initialize() {
    try {
      // Load activities
      const activitiesResponse = await this.api.getActivities();
      this.activities = activitiesResponse.data.activities;

      // Load submissions
      const submissionsResponse = await this.api.getSubmissions({ limit: 50 });
      this.submissions = submissionsResponse.data.submissions;

      // Load history
      const historyResponse = await this.api.getActivityHistory();
      this.history = historyResponse.data;

      // Render the dashboard
      this.render();
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      this.showError('Failed to load activity data. Please try again.');
    }
  }

  /**
   * Render the dashboard UI
   */
  render() {
    this.renderActivityFeed();
    this.renderSubmissionQueue();
    this.renderActivityHistory();
  }

  /**
   * Render the activity feed (Submit Activity tab)
   */
  renderActivityFeed() {
    const feedContainer = document.getElementById('activityFeed');
    if (!feedContainer) return;

    feedContainer.innerHTML = this.activities.map(activity => `
      <div class="activity-card" data-activity-id="${activity.id}">
        <div class="activity-header">
          <span class="activity-tier ${activity.tier}">${activity.tier.toUpperCase()}</span>
          <span class="activity-tokens">${activity.base_tokens} tokens</span>
        </div>
        <h4>${activity.name}</h4>
        <p>${activity.description}</p>
        <div class="activity-category">${activity.category}</div>
        <button class="btn-select-activity" onclick="selectActivity(${activity.id})">
          Select Activity
        </button>
      </div>
    `).join('');
  }

  /**
   * Render the submission queue (Assess Submissions tab)
   */
  renderSubmissionQueue() {
    const queueContainer = document.getElementById('submissionQueue');
    if (!queueContainer) return;

    const pendingSubmissions = this.submissions.filter(s => s.status === 'pending');

    queueContainer.innerHTML = pendingSubmissions.map(submission => `
      <div class="submission-card" data-submission-id="${submission.id}">
        <div class="submission-header">
          <h4>${submission.activity_name}</h4>
          <span class="submission-status ${submission.status}">${submission.status}</span>
        </div>
        <p class="submission-proof">${submission.proof_text.substring(0, 200)}...</p>
        <div class="submission-meta">
          <span>Submitted: ${new Date(submission.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render the activity history (Activity History tab)
   */
  renderActivityHistory() {
    const historyContainer = document.getElementById('activityHistory');
    if (!historyContainer || !this.history) return;

    // Render totals
    const totalsHTML = `
      <div class="history-totals">
        <div class="total-card">
          <h3>${this.history.totals.total_tokens}</h3>
          <p>Total Tokens Earned</p>
        </div>
        <div class="total-card">
          <h3>${this.history.totals.total_activities}</h3>
          <p>Activities Completed</p>
        </div>
        <div class="total-card">
          <h3>${this.history.totals.approved}</h3>
          <p>Approved</p>
        </div>
        <div class="total-card">
          <h3>${this.history.totals.pending}</h3>
          <p>Pending</p>
        </div>
      </div>
    `;

    // Render activity list
    const activitiesHTML = `
      <div class="history-list">
        <table class="history-table">
          <thead>
            <tr>
              <th>Activity</th>
              <th>Category</th>
              <th>Tier</th>
              <th>Tokens</th>
              <th>Quality</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${this.history.activities.map(activity => `
              <tr>
                <td>${activity.activity_name}</td>
                <td>${activity.category}</td>
                <td><span class="tier-badge ${activity.tier}">${activity.tier}</span></td>
                <td>${activity.tokens_awarded || '-'}</td>
                <td>${activity.quality_score ? (activity.quality_score * 100).toFixed(0) + '%' : '-'}</td>
                <td><span class="status-badge ${activity.status}">${activity.status}</span></td>
                <td>${new Date(activity.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    historyContainer.innerHTML = totalsHTML + activitiesHTML;
  }

  /**
   * Show error message
   */
  showError(message) {
    // Implement error display logic
    console.error(message);
    alert(message);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ActivityRewardsAPI, ActivityRewardsDashboard };
}
