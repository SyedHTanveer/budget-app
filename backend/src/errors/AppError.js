class AppError extends Error {
  constructor({ code, message, httpStatus = 500, meta, isOperational = true }) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.meta = meta;
    this.isOperational = isOperational;
  }
}

class ValidationError extends AppError {
  constructor(message, meta) { super({ code: 'VALIDATION_ERROR', message, httpStatus: 400, meta }); }
}
class AuthError extends AppError {
  constructor(message = 'Unauthorized', meta) { super({ code: 'AUTH_ERROR', message, httpStatus: 401, meta }); }
}
class NotFoundError extends AppError {
  constructor(message = 'Not Found', meta) { super({ code: 'NOT_FOUND', message, httpStatus: 404, meta }); }
}
class ConflictError extends AppError {
  constructor(message = 'Conflict', meta) { super({ code: 'CONFLICT', message, httpStatus: 409, meta }); }
}
class RateLimitError extends AppError {
  constructor(message = 'Too Many Requests', meta) { super({ code: 'RATE_LIMIT', message, httpStatus: 429, meta }); }
}
class ExternalServiceError extends AppError {
  constructor(service, message = 'External service error', meta) { super({ code: `${service.toUpperCase()}_ERROR`, message, httpStatus: 502, meta }); }
}

module.exports = { AppError, ValidationError, AuthError, NotFoundError, ConflictError, RateLimitError, ExternalServiceError };
