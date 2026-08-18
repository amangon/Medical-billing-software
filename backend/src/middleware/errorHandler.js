/**
 * Custom error class for API-level validation errors.
 * `fieldErrors` maps field names to arrays of error messages.
 * `statusCode` defaults to 400 (Bad Request).
 */
export class ApiError extends Error {
  constructor(message, statusCode = 400, fieldErrors = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Joi / Zod / express-validator style validation errors
  if (err.name === 'ValidationError' || err.isJoi) {
    const fieldErrors = {};

    if (err.isJoi) {
      // Joi validation result
      for (const details of err.details) {
        const path = details.path && details.path.length ? details.path.join('.') : '_form';
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(details.message);
      }
    } else if (err.errors && typeof err.errors === 'object') {
      // Generic validation object
      for (const [key, value] of Object.entries(err.errors)) {
        if (Array.isArray(value)) {
          fieldErrors[key] = value;
        } else {
          fieldErrors[key] = [String(value)];
        }
      }
    }

    return res.status(400).json({
      message: err.message || 'Validation failed',
      fieldErrors,
    });
  }

  // ApiError with structured field errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      fieldErrors: err.fieldErrors || undefined,
    });
  }

  // Prisma duplicate / unique constraint errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({
      message: 'A record with this value already exists',
      fieldErrors: {
        [field]: ['This value is already in use'],
      },
    });
  }

  // Prisma record-not-found
  if (err.code === 'P2001' || err.code === 'P2025') {
    return res.status(404).json({
      message: 'Record not found',
    });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      message: 'Database error occurred',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
