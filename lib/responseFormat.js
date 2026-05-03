/**
 * Consistent API Response Format
 * All endpoints return standardized response envelopes
 */

/**
 * Success response
 */
export function apiSuccess(data, meta = null) {
  const response = {
    success: true,
    data,
  };
  if (meta) {
    response.meta = meta;
  }
  return response;
}

/**
 * Error response
 */
export function apiError(code, message) {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

/**
 * Paginated response
 */
export function apiPaginated(results, page, totalPages, totalResults) {
  return {
    success: true,
    data: results,
    meta: {
      page,
      totalPages,
      totalResults,
    },
  };
}

/**
 * Send JSON response with proper status code
 */
export function sendResponse(res, statusCode, body) {
  return res.status(statusCode).json(body);
}

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};
