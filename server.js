// server.js - A simple Express server to proxy OpenAI API requests
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory with proper options

// OpenAI API proxy endpoint
app.post('/api/chat', async (req, res) => {
  try {
    // Get messages from request body
    const { messages } = req.body;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    // Get response data
    const data = await response.json();

    // Send response back to client
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Add placeholder image endpoint for demo
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  res.set('Content-Type', 'image/svg+xml');
  res.send(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#4CAF50" opacity="0.3"/>
    <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#263238" 
          text-anchor="middle" dominant-baseline="middle">HolistiQ</text>
  </svg>`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server - listen on 0.0.0.0 to make it accessible externally
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});