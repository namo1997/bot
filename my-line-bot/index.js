// index.js
// Import required libraries
const express = require('express');
const line = require('@line/bot-sdk');
const { OpenAI } = require('openai');
require('dotenv').config(); // To load environment variables from .env file

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

// --- Webhook Endpoint ---
// This is the endpoint that LINE will send messages to.
// The path '/webhook' can be customized.
app.post('/webhook', line.middleware(lineConfig), (req, res) => {
  // The line.middleware will validate the request signature for you.
  // req.body.events will be an array of event objects.
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('Error processing events:', err);
      res.status(500).end();
    });
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

// Add a simple health check endpoint
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// --- Start Server ---
const port = process.env.PORT || 3000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Chatbot server is running on port ${port}`);
});
