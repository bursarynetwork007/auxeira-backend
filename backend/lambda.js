const serverless = require('serverless-http');
const express = require('express');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const app = express();

// Middleware
app.use(express.json());

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Your existing Express middleware and routes
// Make sure to pass the docClient to your route handlers

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    tables: {
      users: process.env.USERS_TABLE,
      transactions: process.env.TRANSACTIONS_TABLE
    }
  });
});

// Example user route (you'll need to implement the actual logic)
app.get('/user/:userId', async (req, res) => {
  try {
    // Example of fetching a user from DynamoDB
    // const user = await getUser(req.params.userId, docClient);
    // res.json(user);
    res.json({ message: 'User endpoint', userId: req.params.userId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export the serverless app
module.exports.handler = serverless(app);

// For local development
if (process.env.NODE_ENV === 'development') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in development mode`);
  });
}
