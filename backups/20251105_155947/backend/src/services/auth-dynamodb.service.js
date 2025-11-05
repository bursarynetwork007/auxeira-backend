const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Table names from environment variables
const USERS_TABLE = process.env.USERS_TABLE || 'auxeira-users';
const SESSIONS_TABLE = process.env.SESSIONS_TABLE || 'auxeira-sessions';

class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
    this.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    this.BCRYPT_ROUNDS = 12;
  }

  /**
   * Register a new user
   */
  async register(userData) {
    try {
      const { email, password, firstName, lastName, role = 'founder' } = userData;

      // Validate input
      if (!email || !password || !firstName || !lastName) {
        return {
          success: false,
          message: 'Missing required fields: email, password, firstName, lastName',
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          message: 'Invalid email format',
        };
      }

      // Validate password strength
      if (password.length < 8) {
        return {
          success: false,
          message: 'Password must be at least 8 characters long',
        };
      }

      const normalizedEmail = email.toLowerCase();

      // Check if user already exists
      try {
        const existingUser = await docClient.send(new GetCommand({
          TableName: USERS_TABLE,
          Key: { email: normalizedEmail }
        }));

        if (existingUser.Item) {
          return {
            success: false,
            message: 'User with this email already exists',
          };
        }
      } catch (error) {
        console.error('Error checking existing user:', error);
        return {
          success: false,
          message: 'Error checking user existence',
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, this.BCRYPT_ROUNDS);

      // Generate user ID
      const userId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Create user object
      const user = {
        id: userId,
        email: normalizedEmail,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null,
        loginCount: 0,
        status: 'active'
      };

      // Save user to DynamoDB
      try {
        await docClient.send(new PutCommand({
          TableName: USERS_TABLE,
          Item: user,
          ConditionExpression: 'attribute_not_exists(email)' // Ensure no duplicate
        }));
      } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
          return {
            success: false,
            message: 'User with this email already exists',
          };
        }
        console.error('Error creating user:', error);
        return {
          success: false,
          message: 'Error creating user account',
        };
      }

      // Generate tokens
      const token = this.generateAccessToken({ userId, email: normalizedEmail, role });
      const refreshToken = this.generateRefreshToken({ userId, email: normalizedEmail });

      // Save session
      await this.saveSession(userId, refreshToken);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        message: 'User registered successfully',
        user: userWithoutPassword,
        token,
        refreshToken,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed due to server error',
      };
    }
  }

  /**
   * Login user
   */
  async login(loginData) {
    try {
      const { email, password } = loginData;

      if (!email || !password) {
        return {
          success: false,
          message: 'Email and password are required',
        };
      }

      const normalizedEmail = email.toLowerCase();

      // Get user from DynamoDB
      let user;
      try {
        const result = await docClient.send(new GetCommand({
          TableName: USERS_TABLE,
          Key: { email: normalizedEmail }
        }));

        user = result.Item;
      } catch (error) {
        console.error('Error fetching user:', error);
        return {
          success: false,
          message: 'Login failed',
        };
      }

      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Check if account is active
      if (user.status !== 'active') {
        return {
          success: false,
          message: 'Account is not active',
        };
      }

      // Verify password (support both 'password' and 'passwordHash' fields)
      const hashedPassword = user.password || user.passwordHash;
      if (!hashedPassword) {
        return {
          success: false,
          message: 'Account configuration error',
        };
      }
      
      const isPasswordValid = await bcrypt.compare(password, hashedPassword);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Update last login
      const now = new Date().toISOString();
      try {
        await docClient.send(new UpdateCommand({
          TableName: USERS_TABLE,
          Key: { email: normalizedEmail },
          UpdateExpression: 'SET lastLoginAt = :now, loginCount = loginCount + :inc, updatedAt = :now',
          ExpressionAttributeValues: {
            ':now': now,
            ':inc': 1
          }
        }));
      } catch (error) {
        console.error('Error updating login info:', error);
        // Continue with login even if update fails
      }

      // Generate tokens (use userId field from DynamoDB)
      const userId = user.userId || user.id;
      const token = this.generateAccessToken({ 
        userId: userId, 
        email: user.email, 
        role: user.role 
      });
      const refreshToken = this.generateRefreshToken({ 
        userId: userId, 
        email: user.email 
      });

      // Save session
      await this.saveSession(userId, refreshToken);

      // Return user without password (remove both possible password fields)
      const { password: _, passwordHash: __, ...userWithoutPassword } = user;
      userWithoutPassword.lastLoginAt = now;
      userWithoutPassword.loginCount = (user.loginCount || 0) + 1;

      return {
        success: true,
        message: 'Login successful',
        user: userWithoutPassword,
        token,
        refreshToken,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed due to server error',
      };
    }
  }

  /**
   * Verify token
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET);
      
      // Get user from DynamoDB to ensure they still exist and are active
      const result = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { email: decoded.email }
      }));

      const user = result.Item;
      if (!user || user.status !== 'active') {
        return {
          success: false,
          message: 'Invalid token or user not found',
        };
      }

      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        user: userWithoutPassword,
        decoded,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Invalid or expired token',
      };
    }
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, this.JWT_SECRET, { 
      expiresIn: this.JWT_EXPIRES_IN 
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, { 
      expiresIn: this.JWT_REFRESH_EXPIRES_IN 
    });
  }

  /**
   * Save session to DynamoDB
   */
  async saveSession(userId, refreshToken) {
    try {
      const sessionId = crypto.randomUUID();
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      await docClient.send(new PutCommand({
        TableName: SESSIONS_TABLE,
        Item: {
          sessionId,
          userId,
          refreshToken,
          createdAt: now,
          expiresAt,
          isActive: true
        }
      }));
    } catch (error) {
      console.error('Error saving session:', error);
      // Don't fail the login/register if session save fails
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      // Query by GSI if you have one, or scan (less efficient)
      const result = await docClient.send(new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: 'UserIdIndex', // You'll need to create this GSI
        KeyConditionExpression: 'id = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }));

      if (result.Items && result.Items.length > 0) {
        const { password: _, ...userWithoutPassword } = result.Items[0];
        return userWithoutPassword;
      }

      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }
}

module.exports = new AuthService();
