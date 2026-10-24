/**
 * Centralized error handling helpers.
 *
 * Response contract:
 *   error   -> { "success": false, "message": "..." }
 *   success -> { "success": true,  "message": "...", "data": {} }
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Wraps an async route handler so rejections reach the error middleware. */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/** Creates a 400 error. */
export function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

/** Creates a 404 error. */
export function notFoundError(message = 'Resource not found') {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
}

/** Throws 400 when an id path parameter is not a valid UUID. */
export function assertValidUuid(id, label = 'id') {
  if (!id || !UUID_RE.test(String(id))) {
    throw badRequest(`Invalid ${label}`);
  }
}

/**
 * Converts a Supabase/PostgREST error object into an Error with a proper
 * HTTP status code (unique violations -> 409, others -> 500).
 */
export function handleSupabaseError(error) {
  const err = new Error(error?.message || 'Database error');
  if (error?.code === '23505') {
    err.statusCode = 409;
    err.message = 'A record with the same unique value already exists';
  } else if (error?.code === '23503') {
    err.statusCode = 400;
    err.message = 'Related record does not exist';
  } else if (error?.code === '22P02') {
    err.statusCode = 400;
    err.message = 'Invalid value provided';
  } else {
    err.statusCode = 500;
  }
  return err;
}

/** 404 for unknown API routes. */
export function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/** Final error middleware — consistent shape, no internals leaked in production. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  }

  const message =
    status >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Something went wrong';

  res.status(status).json({
    success: false,
    message,
  });
}
