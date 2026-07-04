require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Routes
const chatHandler = require('./api/chat');
const authHandler = require('./api/auth');

// Auth endpoints
app.post('/api/auth/:action', authHandler);
app.get('/api/auth/:action', authHandler);

// Chat endpoint (protected inside ./api/chat.js)
app.post('/api/chat', chatHandler);

app.listen(3001, () => {
  console.log('Server running on port 3001');
});

