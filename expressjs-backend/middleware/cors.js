const cors = require('cors');

// CORS middleware
const corsMiddleware = cors({
  origin: [
    'http://localhost:3000',
    'https://glide-v3.vercel.app',
    'https://glide-v3-git-main.vercel.app',
    'https://glide-v3-*.vercel.app',
    'https://glide-53ye.vercel.app',
    'https://glide-jet.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

module.exports = corsMiddleware;
