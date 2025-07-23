// index.js
// Import required libraries
const express = require('express');
const line = require('@line/bot-sdk');
const { OpenAI } = require('openai');
require('dotenv').config(); // To load environment variables from .env file

// Enable console logging for debugging
console.log('Starting bot service...');
console.log('Environment variables check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- RAILWAY_STATIC_URL:', process.env.RAILWAY_STATIC_URL);
console.log('- PUBLIC_URL:', process.env.PUBLIC_URL || 'web-staging-2c91.up.railway.app');
console.log('- CHANNEL_ACCESS_TOKEN:', process.env.CHANNEL_ACCESS_TOKEN ? 'Set' : 'Not set');
console.log('- CHANNEL_SECRET:', process.env.CHANNEL_SECRET ? 'Set' : 'Not set');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Not set');

// Validate required environment variables
const requiredEnvVars = ['CHANNEL_ACCESS_TOKEN', 'CHANNEL_SECRET', 'OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Error: Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// --- Configuration ---
// Load credentials from environment variables for security
const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
};

// --- Initialization ---
const app = express();
const lineClient = new line.Client(lineConfig);
const openai = new OpenAI(openaiConfig);

// Enable body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Webhook Endpoint ---
// This is the endpoint that LINE will send messages to.
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  console.log('Received webhook request');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const events = req.body.events;
    // Handle no events case
    if (!events || !events.length) {
      console.log('No events received');
      return res.status(200).json({ message: 'No events received' });
    }

    // Process all events
    const results = await Promise.all(events.map(handleEvent));
    console.log('Webhook processed successfully');
    return res.status(200).json({ results });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message
    });
  }
});

// --- Event Handler Function ---
// This function processes each event from the webhook.
async function handleEvent(event) {
  // We only handle message events that are of type 'text'.
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;
  const replyToken = event.replyToken;

  try {
    // --- Call OpenAI API ---
    console.log(`Received message from user: ${userMessage}`);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // You can choose other models like gpt-4
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant. Respond in Thai." 
        },
        { 
          role: "user", 
          content: userMessage 
        }
      ],
    });

    const botReply = completion.choices[0].message.content.trim();
    console.log(`OpenAI reply: ${botReply}`);

    // --- Create Reply Message for LINE ---
    const replyMessage = {
      type: 'text',
      text: botReply,
    };

    // --- Send Reply to LINE ---
    return lineClient.replyMessage(replyToken, replyMessage);

  } catch (error) {
    console.error('Error calling OpenAI or replying to LINE:', error);
    // Inform the user that an error occurred
    const errorMessage = {
      type: 'text',
      text: 'ขออภัยค่ะ เกิดข้อผิดพลาดบางอย่าง โปรดลองอีกครั้งในภายหลัง',
    };
    return lineClient.replyMessage(replyToken, errorMessage);
  }
}

// Add health check endpoints
app.get('/', (req, res) => {
  console.log('Health check request received');
  res.status(200).json({
    status: 'ok',
    message: 'Bot is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/webhook', (req, res) => {
  console.log('Webhook GET request received');
  res.status(200).json({
    status: 'ok',
    message: 'Webhook is ready'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// --- Start Server ---
const port = process.env.PORT || 3000;
const domain = process.env.PUBLIC_URL || 'web-staging-2c91.up.railway.app';
const webhookUrl = `https://${domain}/webhook`;

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Chatbot server is running on port ${port}`);
  console.log(`Server URL: https://${domain}`);
  console.log(`Webhook URL: ${webhookUrl}`);
  console.log('Please set this webhook URL in LINE Developers Console');
});
