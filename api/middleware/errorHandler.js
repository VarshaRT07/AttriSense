// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Database connection errors
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Database connection failed',
      message: 'Unable to connect to the database'
    });
  }

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          error: 'Duplicate entry',
          message: 'A record with this information already exists'
        });
      case '23503': // Foreign key violation
        return res.status(400).json({
          error: 'Invalid reference',
          message: 'Referenced record does not exist'
        });
      case '23502': // Not null violation
        return res.status(400).json({
          error: 'Missing required field',
          message: 'Required field cannot be empty'
        });
      case '22P02': // Invalid input syntax
        return res.status(400).json({
          error: 'Invalid input',
          message: 'Invalid data format provided'
        });
      default:
        return res.status(500).json({
          error: 'Database error',
          message: 'An error occurred while processing your request'
        });
    }
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    message: 'An unexpected error occurred'
  });
};

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
};