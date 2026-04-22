const cors = require('cors');

// Development CORS configuration - allows all origins
const corsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-access-token"],
  exposedHeaders: ["set-cookie"],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

const corsMiddleware = cors(corsOptions);

// Handle preflight requests
const corsPreflight = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
};

module.exports = { corsMiddleware, corsPreflight };
