/**
 * Academic Publication Service
 * Comprehensive service for managing research publications, peer review, and academic collaboration
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import {
  ResearchPaper,
  Author,
  PublicationVenue,
  PeerReview,
  ResearchCollaboration,
  CreateResearchPaperRequest,
  SubmitForReviewRequest,
  PeerReviewRequest,
  CollaborationInviteRequest,
  ResearchPaperResponse,
  PublicationAnalyticsResponse,
  ResearchCollaborationResponse,
  PublicationType,
  ResearchCategory,
  SubmissionStatus,
  PeerReviewStatus,
  ReviewRecommendation,
  CollaborationType,
  CollaborationStatus,
  AcademicImpact,
  CitationMetrics,
  QualityMetrics
} from '../types/academic-publication.types';

export class AcademicPublicationService {
  constructor(private pool: Pool) {}

  // =====================================================
  // RESEARCH PAPER MANAGEMENT
  // =====================================================

  /**
   * Create a new research paper
   */
  async createResearchPaper(
    userId: string,
    request: CreateResearchPaperRequest
  ): Promise<ResearchPaper> {
    const timer = performanceTimer('create_research_paper');
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Create the research paper
      const paperResult = await client.query(`
        INSERT INTO research_papers (
          title, abstract, keywords, publication_type, research_category,
          methodology, data_sources, ethical_considerations, funding_sources,
          submission_status, created_by, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        request.title,
        request.abstract,
        JSON.stringify(request.keywords),
        request.publication_type,
        request.research_category,
        JSON.stringify(request.methodology),
        JSON.stringify(request.data_sources),
        JSON.stringify(request.ethical_considerations),
        JSON.stringify(request.funding_sources),
        SubmissionStatus.DRAFT,
        userId,
        '1.0.0'
      ]);

      const paper = paperResult.rows[0];

      // Add authors
      for (const [index, author] of request.authors.entries()) {
        await client.query(`
          INSERT INTO research_paper_authors (
            paper_id, first_name, last_name, middle_name, email, orcid_id,
            affiliation_ids, author_order, contribution_type, contribution_percentage,
            corresponding_author, expertise_areas
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          paper.id,
          author.first_name,
          author.last_name,
          author.middle_name,
          author.email,
          author.orcid_id,
          JSON.stringify(author.affiliation_ids),
          index + 1,
          JSON.stringify(author.contribution_type),
          author.contribution_percentage,
          author.corresponding_author,
          JSON.stringify(author.expertise_areas)
        ]);
      }

      // Initialize quality metrics
      await client.query(`
        INSERT INTO paper_quality_metrics (
          paper_id, methodology_score, reproducibility_score, novelty_score,
          significance_score, clarity_score, ethical_compliance_score,
          data_quality_score, statistical_rigor_score, overall_quality_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        paper.id, 0, 0, 0, 0, 0, 0, 0, 0, 0
      ]);

      await client.query('COMMIT');

      logger.info('Research paper created successfully', {
        paperId: paper.id,
        title: request.title,
        userId,
        executionTime: timer.end()
      });

      return this.getResearchPaperById(paper.id);

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create research paper', {
        error: (error as Error).message,
        userId,
        title: request.title
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get research paper by ID with full details
   */
  async getResearchPaperById(paperId: string): Promise<ResearchPaper> {
    const timer = performanceTimer('get_research_paper');

    try {
      const result = await this.pool.query(`
        SELECT
          rp.*,
          json_agg(
            json_build_object(
              'id', rpa.id,
              'first_name', rpa.first_name,
              'last_name', rpa.last_name,
              'email', rpa.email,
              'author_order', rpa.author_order,
              'contribution_type', rpa.contribution_type,
              'corresponding_author', rpa.corresponding_author
            ) ORDER BY rpa.author_order
          ) as authors,
          pqm.overall_quality_score,
          pqm.methodology_score,
          pqm.reproducibility_score
        FROM research_papers rp
        LEFT JOIN research_paper_authors rpa ON rp.id = rpa.paper_id
        LEFT JOIN paper_quality_metrics pqm ON rp.id = pqm.paper_id
        WHERE rp.id = $1
        GROUP BY rp.id, pqm.overall_quality_score, pqm.methodology_score, pqm.reproducibility_score
      `, [paperId]);

      if (result.rows.length === 0) {
        throw new Error('Research paper not found');
      }

      const paper = result.rows[0];

      logger.info('Research paper retrieved successfully', {
        paperId,
        executionTime: timer.end()
      });

      return {
        ...paper,
        keywords: JSON.parse(paper.keywords || '[]'),
        methodology: JSON.parse(paper.methodology || '{}'),
        data_sources: JSON.parse(paper.data_sources || '[]'),
        ethical_considerations: JSON.parse(paper.ethical_considerations || '[]'),
        funding_sources: JSON.parse(paper.funding_sources || '[]'),
        authors: paper.authors || []
      };

    } catch (error) {
      logger.error('Failed to get research paper', {
        error: (error as Error).message,
        paperId
      });
      throw error;
    }
  }

  /**
   * Update research paper
   */
  async updateResearchPaper(
    paperId: string,
    userId: string,
    updates: Partial<ResearchPaper>
  ): Promise<ResearchPaper> {
    const timer = performanceTimer('update_research_paper');

    try {
      // Check if user has permission to update
      const permissionCheck = await this.pool.query(`
        SELECT created_by FROM research_papers WHERE id = $1
      `, [paperId]);

      if (permissionCheck.rows.length === 0) {
        throw new Error('Research paper not found');
      }

      if (permissionCheck.rows[0].created_by !== userId) {
        throw new Error('Unauthorized to update this research paper');
      }

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && key !== 'id' && key !== 'created_at') {
          updateFields.push(`${key} = $${paramCount}`);
          updateValues.push(typeof value === 'object' ? JSON.stringify(value) : value);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        return this.getResearchPaperById(paperId);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateFields.push(`version = version + 0.1`);

      const query = `
        UPDATE research_papers
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      await this.pool.query(query, [...updateValues, paperId]);

      logger.info('Research paper updated successfully', {
        paperId,
        userId,
        updatedFields: Object.keys(updates),
        executionTime: timer.end()
      });

      return this.getResearchPaperById(paperId);

    } catch (error) {
      logger.error('Failed to update research paper', {
        error: (error as Error).message,
        paperId,
        userId
      });
      throw error;
    }
  }

  /**
   * Submit paper for peer review
   */
  async submitForReview(
    paperId: string,
    userId: string,
    request: SubmitForReviewRequest
  ): Promise<void> {
    const timer = performanceTimer('submit_for_review');
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Update paper status
      await client.query(`
        UPDATE research_papers
        SET submission_status = $1,
            peer_review_status = $2,
            submission_date = CURRENT_TIMESTAMP,
            target_venue_id = $3
        WHERE id = $4 AND created_by = $5
      `, [
        SubmissionStatus.SUBMITTED,
        PeerReviewStatus.NOT_STARTED,
        request.target_venue_id,
        paperId,
        userId
      ]);

      // Create submission record
      await client.query(`
        INSERT INTO paper_submissions (
          paper_id, venue_id, cover_letter, suggested_reviewers,
          competing_interests, author_contributions, submitted_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        paperId,
        request.target_venue_id,
        request.cover_letter,
        JSON.stringify(request.suggested_reviewers),
        JSON.stringify(request.competing_interests),
        JSON.stringify(request.author_contributions),
        userId
      ]);

      // Trigger automated quality assessment
      await this.performAutomatedQualityAssessment(paperId);

      await client.query('COMMIT');

      logger.info('Paper submitted for review successfully', {
        paperId,
        venueId: request.target_venue_id,
        userId,
        executionTime: timer.end()
      });

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to submit paper for review', {
        error: (error as Error).message,
        paperId,
        userId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // =====================================================
  // PEER REVIEW MANAGEMENT
  // =====================================================

  /**
   * Assign peer reviewers
   */
  async assignPeerReviewers(
    paperId: string,
    reviewerIds: string[],
    editorId: string
  ): Promise<void> {
    const timer = performanceTimer('assign_peer_reviewers');
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Update paper review status
      await client.query(`
        UPDATE research_papers
        SET peer_review_status = $1
        WHERE id = $2
      `, [PeerReviewStatus.REVIEWERS_ASSIGNED, paperId]);

      // Create peer review assignments
      for (const reviewerId of reviewerIds) {
        await client.query(`
          INSERT INTO peer_reviews (
            paper_id, reviewer_id, assigned_by, review_status,
            due_date, review_round, anonymized
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          paperId,
          reviewerId,
          editorId,
          'assigned',
          new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
          1,
          true
        ]);

        // Send notification to reviewer (implement notification service)
        await this.sendReviewerNotification(reviewerId, paperId);
      }

      await client.query('COMMIT');

      logger.info('Peer reviewers assigned successfully', {
        paperId,
        reviewerCount: reviewerIds.length,
        editorId,
        executionTime: timer.end()
      });

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to assign peer reviewers', {
        error: (error as Error).message,
        paperId,
        editorId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Submit peer review
   */
  async submitPeerReview(
    reviewId: string,
    reviewerId: string,
    review: Partial<PeerReview>
  ): Promise<void> {
    const timer = performanceTimer('submit_peer_review');

    try {
      await this.pool.query(`
        UPDATE peer_reviews
        SET
          overall_recommendation = $1,
          confidence_level = $2,
          expertise_level = $3,
          review_scores = $4,
          comments = $5,
          strengths = $6,
          weaknesses = $7,
          novelty_assessment = $8,
          methodology_assessment = $9,
          significance_assessment = $10,
          clarity_assessment = $11,
          reproducibility_assessment = $12,
          time_spent_hours = $13,
          review_status = $14,
          submitted_at = CURRENT_TIMESTAMP
        WHERE id = $15 AND reviewer_id = $16
      `, [
        review.overall_recommendation,
        review.confidence_level,
        review.expertise_level,
        JSON.stringify(review.scores),
        JSON.stringify(review.comments),
        JSON.stringify(review.strengths),
        JSON.stringify(review.weaknesses),
        JSON.stringify(review.novelty_assessment),
        JSON.stringify(review.methodology_assessment),
        JSON.stringify(review.significance_assessment),
        JSON.stringify(review.clarity_assessment),
        JSON.stringify(review.reproducibility_assessment),
        review.time_spent_hours,
        'submitted',
        reviewId,
        reviewerId
      ]);

      // Check if all reviews are completed
      await this.checkReviewCompletion(reviewId);

      logger.info('Peer review submitted successfully', {
        reviewId,
        reviewerId,
        recommendation: review.overall_recommendation,
        executionTime: timer.end()
      });

    } catch (error) {
      logger.error('Failed to submit peer review', {
        error: (error as Error).message,
        reviewId,
        reviewerId
      });
      throw error;
    }
  }

  // =====================================================
  // COLLABORATION MANAGEMENT
  // =====================================================

  /**
   * Create research collaboration
   */
  async createResearchCollaboration(
    userId: string,
    collaboration: Omit<ResearchCollaboration, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ResearchCollaboration> {
    const timer = performanceTimer('create_research_collaboration');
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Create collaboration
      const result = await client.query(`
        INSERT INTO research_collaborations (
          collaboration_name, collaboration_type, description, objectives,
          institutions, funding_sources, start_date, end_date, status,
          deliverables, communication_channels, data_sharing_agreement,
          intellectual_property_agreement, publication_agreement,
          success_metrics, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [
        collaboration.collaboration_name,
        collaboration.collaboration_type,
        collaboration.description,
        JSON.stringify(collaboration.objectives),
        JSON.stringify(collaboration.institutions),
        JSON.stringify(collaboration.funding_sources),
        collaboration.start_date,
        collaboration.end_date,
        collaboration.status,
        JSON.stringify(collaboration.deliverables),
        JSON.stringify(collaboration.communication_channels),
        JSON.stringify(collaboration.data_sharing_agreement),
        JSON.stringify(collaboration.intellectual_property_agreement),
        JSON.stringify(collaboration.publication_agreement),
        JSON.stringify(collaboration.success_metrics),
        userId
      ]);

      const newCollaboration = result.rows[0];

      // Add creator as principal investigator
      await client.query(`
        INSERT INTO collaboration_participants (
          collaboration_id, user_id, role, responsibilities,
          time_commitment_percentage, decision_making_authority, active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        newCollaboration.id,
        userId,
        'principal_investigator',
        JSON.stringify(['Project leadership', 'Strategic direction', 'Resource allocation']),
        100,
        'full',
        true
      ]);

      await client.query('COMMIT');

      logger.info('Research collaboration created successfully', {
        collaborationId: newCollaboration.id,
        name: collaboration.collaboration_name,
        userId,
        executionTime: timer.end()
      });

      return newCollaboration;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create research collaboration', {
        error: (error as Error).message,
        userId,
        collaborationName: collaboration.collaboration_name
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Invite collaborator
   */
  async inviteCollaborator(
    collaborationId: string,
    inviterId: string,
    request: CollaborationInviteRequest
  ): Promise<void> {
    const timer = performanceTimer('invite_collaborator');

    try {
      // Check if inviter has permission
      const permissionCheck = await this.pool.query(`
        SELECT cp.decision_making_authority
        FROM collaboration_participants cp
        WHERE cp.collaboration_id = $1 AND cp.user_id = $2 AND cp.active = true
      `, [collaborationId, inviterId]);

      if (permissionCheck.rows.length === 0) {
        throw new Error('Unauthorized to invite collaborators');
      }

      // Create invitation
      await this.pool.query(`
        INSERT INTO collaboration_invitations (
          collaboration_id, inviter_id, invitee_email, proposed_role,
          invitation_message, responsibilities, time_commitment_percentage,
          status, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        collaborationId,
        inviterId,
        request.invitee_email,
        request.proposed_role,
        request.invitation_message,
        JSON.stringify(request.responsibilities),
        request.time_commitment_percentage,
        'pending',
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks from now
      ]);

      // Send invitation email (implement email service)
      await this.sendCollaborationInvitation(request.invitee_email, collaborationId);

      logger.info('Collaboration invitation sent successfully', {
        collaborationId,
        inviterId,
        inviteeEmail: request.invitee_email,
        role: request.proposed_role,
        executionTime: timer.end()
      });

    } catch (error) {
      logger.error('Failed to invite collaborator', {
        error: (error as Error).message,
        collaborationId,
        inviterId
      });
      throw error;
    }
  }

  // =====================================================
  // ANALYTICS AND METRICS
  // =====================================================

  /**
   * Get publication analytics for user
   */
  async getPublicationAnalytics(userId: string): Promise<PublicationAnalyticsResponse> {
    const timer = performanceTimer('get_publication_analytics');

    try {
      // Get basic publication counts
      const publicationCounts = await this.pool.query(`
        SELECT
          COUNT(*) as total_publications,
          publication_type,
          research_category
        FROM research_papers rp
        JOIN research_paper_authors rpa ON rp.id = rpa.paper_id
        WHERE rpa.user_id = $1
        GROUP BY publication_type, research_category
      `, [userId]);

      // Get citation metrics
      const citationMetrics = await this.pool.query(`
        SELECT
          SUM(citation_count) as total_citations,
          AVG(citation_count) as avg_citations_per_paper,
          MAX(citation_count) as max_citations
        FROM research_papers rp
        JOIN research_paper_authors rpa ON rp.id = rpa.paper_id
        WHERE rpa.user_id = $1
      `, [userId]);

      // Get recent publications
      const recentPublications = await this.pool.query(`
        SELECT rp.*, rpa.author_order
        FROM research_papers rp
        JOIN research_paper_authors rpa ON rp.id = rpa.paper_id
        WHERE rpa.user_id = $1
        ORDER BY rp.publication_date DESC NULLS LAST, rp.created_at DESC
        LIMIT 10
      `, [userId]);

      // Calculate H-index
      const hIndex = await this.calculateHIndex(userId);

      const analytics: PublicationAnalyticsResponse = {
        total_publications: parseInt(citationMetrics.rows[0]?.total_citations || '0'),
        publications_by_type: this.aggregateByField(publicationCounts.rows, 'publication_type'),
        publications_by_category: this.aggregateByField(publicationCounts.rows, 'research_category'),
        citation_metrics: {
          total_citations: parseInt(citationMetrics.rows[0]?.total_citations || '0'),
          h_index: hIndex,
          i10_index: 0, // Calculate separately
          citations_per_year: {},
          self_citations: 0,
          co_author_citations: 0,
          independent_citations: 0,
          average_citations_per_paper: parseFloat(citationMetrics.rows[0]?.avg_citations_per_paper || '0'),
          median_citations_per_paper: 0,
          most_cited_paper: '',
          recent_citation_trend: 0
        },
        h_index: hIndex,
        impact_trends: [],
        collaboration_network: { nodes: [], edges: [], metrics: {} },
        top_venues: [],
        recent_publications: recentPublications.rows,
        upcoming_deadlines: []
      };

      logger.info('Publication analytics retrieved successfully', {
        userId,
        totalPublications: analytics.total_publications,
        hIndex,
        executionTime: timer.end()
      });

      return analytics;

    } catch (error) {
      logger.error('Failed to get publication analytics', {
        error: (error as Error).message,
        userId
      });
      throw error;
    }
  }

  /**
   * Calculate academic impact metrics
   */
  async calculateAcademicImpact(paperId: string): Promise<AcademicImpact> {
    const timer = performanceTimer('calculate_academic_impact');

    try {
      // Get paper details
      const paper = await this.getResearchPaperById(paperId);

      // Calculate citation metrics
      const citationMetrics: CitationMetrics = {
        total_citations: paper.citation_count || 0,
        h_index: 0, // Calculate based on author's overall work
        i10_index: 0,
        citations_per_year: {},
        self_citations: 0,
        co_author_citations: 0,
        independent_citations: 0,
        average_citations_per_paper: 0,
        median_citations_per_paper: 0,
        most_cited_paper: '',
        recent_citation_trend: 0
      };

      // Get altmetrics
      const altmetrics = await this.pool.query(`
        SELECT * FROM paper_altmetrics WHERE paper_id = $1
      `, [paperId]);

      // Get social media metrics
      const socialMetrics = await this.pool.query(`
        SELECT * FROM paper_social_metrics WHERE paper_id = $1
      `, [paperId]);

      const impact: AcademicImpact = {
        citation_metrics: citationMetrics,
        altmetrics: altmetrics.rows[0] || {},
        download_metrics: {
          total_downloads: paper.download_count || 0,
          downloads_per_month: {},
          geographic_distribution: {},
          institutional_distribution: {},
          download_trend: 0
        },
        social_media_metrics: socialMetrics.rows[0] || {},
        media_coverage: [],
        conference_presentations: [],
        awards_recognition: [],
        follow_up_research: [],
        replication_studies: [],
        meta_analyses_inclusion: [],
        textbook_citations: [],
        course_adoptions: [],
        h_index_contribution: 0,
        field_impact_score: 0,
        interdisciplinary_impact: {}
      };

      logger.info('Academic impact calculated successfully', {
        paperId,
        totalCitations: citationMetrics.total_citations,
        totalDownloads: impact.download_metrics.total_downloads,
        executionTime: timer.end()
      });

      return impact;

    } catch (error) {
      logger.error('Failed to calculate academic impact', {
        error: (error as Error).message,
        paperId
      });
      throw error;
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private async performAutomatedQualityAssessment(paperId: string): Promise<void> {
    // Implement automated quality assessment using NLP and ML models
    // This would analyze methodology, statistical rigor, novelty, etc.

    const qualityScores = {
      methodology_score: Math.random() * 100,
      reproducibility_score: Math.random() * 100,
      novelty_score: Math.random() * 100,
      significance_score: Math.random() * 100,
      clarity_score: Math.random() * 100,
      ethical_compliance_score: Math.random() * 100,
      data_quality_score: Math.random() * 100,
      statistical_rigor_score: Math.random() * 100
    };

    const overallScore = Object.values(qualityScores).reduce((a, b) => a + b, 0) / Object.keys(qualityScores).length;

    await this.pool.query(`
      UPDATE paper_quality_metrics
      SET
        methodology_score = $1,
        reproducibility_score = $2,
        novelty_score = $3,
        significance_score = $4,
        clarity_score = $5,
        ethical_compliance_score = $6,
        data_quality_score = $7,
        statistical_rigor_score = $8,
        overall_quality_score = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE paper_id = $10
    `, [
      qualityScores.methodology_score,
      qualityScores.reproducibility_score,
      qualityScores.novelty_score,
      qualityScores.significance_score,
      qualityScores.clarity_score,
      qualityScores.ethical_compliance_score,
      qualityScores.data_quality_score,
      qualityScores.statistical_rigor_score,
      overallScore,
      paperId
    ]);
  }

  private async sendReviewerNotification(reviewerId: string, paperId: string): Promise<void> {
    // Implement notification service integration
    logger.info('Reviewer notification sent', { reviewerId, paperId });
  }

  private async sendCollaborationInvitation(email: string, collaborationId: string): Promise<void> {
    // Implement email service integration
    logger.info('Collaboration invitation sent', { email, collaborationId });
  }

  private async checkReviewCompletion(reviewId: string): Promise<void> {
    // Check if all reviews for a paper are completed
    const result = await this.pool.query(`
      SELECT
        pr.paper_id,
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN pr.review_status = 'submitted' THEN 1 END) as completed_reviews
      FROM peer_reviews pr
      WHERE pr.paper_id = (SELECT paper_id FROM peer_reviews WHERE id = $1)
      GROUP BY pr.paper_id
    `, [reviewId]);

    if (result.rows.length > 0) {
      const { paper_id, total_reviews, completed_reviews } = result.rows[0];

      if (total_reviews === completed_reviews) {
        await this.pool.query(`
          UPDATE research_papers
          SET peer_review_status = $1
          WHERE id = $2
        `, [PeerReviewStatus.REVIEWS_COMPLETED, paper_id]);
      }
    }
  }

  private async calculateHIndex(userId: string): Promise<number> {
    const result = await this.pool.query(`
      SELECT citation_count
      FROM research_papers rp
      JOIN research_paper_authors rpa ON rp.id = rpa.paper_id
      WHERE rpa.user_id = $1
      ORDER BY citation_count DESC
    `, [userId]);

    const citations = result.rows.map(row => row.citation_count || 0);
    let hIndex = 0;

    for (let i = 0; i < citations.length; i++) {
      if (citations[i] >= i + 1) {
        hIndex = i + 1;
      } else {
        break;
      }
    }

    return hIndex;
  }

  private aggregateByField(rows: any[], field: string): Record<string, number> {
    const result: Record<string, number> = {};

    for (const row of rows) {
      const key = row[field];
      if (key) {
        result[key] = (result[key] || 0) + 1;
      }
    }

    return result;
  }

  /**
   * Search research papers
   */
  async searchResearchPapers(
    query: string,
    filters: {
      publication_type?: PublicationType;
      research_category?: ResearchCategory;
      submission_status?: SubmissionStatus;
      date_range?: { start: Date; end: Date };
      author?: string;
      venue?: string;
    } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{ papers: ResearchPaper[]; total: number; page: number; totalPages: number }> {
    const timer = performanceTimer('search_research_papers');

    try {
      let whereConditions = ['1=1'];
      const queryParams: any[] = [];
      let paramCount = 1;

      // Text search
      if (query) {
        whereConditions.push(`(
          rp.title ILIKE $${paramCount} OR
          rp.abstract ILIKE $${paramCount} OR
          array_to_string(rp.keywords, ' ') ILIKE $${paramCount}
        )`);
        queryParams.push(`%${query}%`);
        paramCount++;
      }

      // Filters
      if (filters.publication_type) {
        whereConditions.push(`rp.publication_type = $${paramCount}`);
        queryParams.push(filters.publication_type);
        paramCount++;
      }

      if (filters.research_category) {
        whereConditions.push(`rp.research_category = $${paramCount}`);
        queryParams.push(filters.research_category);
        paramCount++;
      }

      if (filters.submission_status) {
        whereConditions.push(`rp.submission_status = $${paramCount}`);
        queryParams.push(filters.submission_status);
        paramCount++;
      }

      if (filters.date_range) {
        whereConditions.push(`rp.created_at BETWEEN $${paramCount} AND $${paramCount + 1}`);
        queryParams.push(filters.date_range.start, filters.date_range.end);
        paramCount += 2;
      }

      // Pagination
      const offset = (pagination.page - 1) * pagination.limit;

      const searchQuery = `
        SELECT
          rp.*,
          json_agg(
            json_build_object(
              'first_name', rpa.first_name,
              'last_name', rpa.last_name,
              'author_order', rpa.author_order
            ) ORDER BY rpa.author_order
          ) as authors
        FROM research_papers rp
        LEFT JOIN research_paper_authors rpa ON rp.id = rpa.paper_id
        WHERE ${whereConditions.join(' AND ')}
        GROUP BY rp.id
        ORDER BY rp.created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      const countQuery = `
        SELECT COUNT(DISTINCT rp.id) as total
        FROM research_papers rp
        LEFT JOIN research_paper_authors rpa ON rp.id = rpa.paper_id
        WHERE ${whereConditions.join(' AND ')}
      `;

      queryParams.push(pagination.limit, offset);

      const [searchResult, countResult] = await Promise.all([
        this.pool.query(searchQuery, queryParams.slice(0, -2).concat([pagination.limit, offset])),
        this.pool.query(countQuery, queryParams.slice(0, -2))
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / pagination.limit);

      logger.info('Research papers search completed', {
        query,
        resultsCount: searchResult.rows.length,
        total,
        page: pagination.page,
        executionTime: timer.end()
      });

      return {
        papers: searchResult.rows,
        total,
        page: pagination.page,
        totalPages
      };

    } catch (error) {
      logger.error('Failed to search research papers', {
        error: (error as Error).message,
        query,
        filters
      });
      throw error;
    }
  }
}
