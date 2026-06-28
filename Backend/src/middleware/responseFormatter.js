/**
 * Centralized API response formatter middleware.
 * Intercepts res.json to guarantee standardized Success and Failure formats.
 */
export default (req, res, next) => {
  const originalJson = res.json;

  res.json = function (body) {
    if (body && typeof body === 'object') {
      // If the response is already in the standardized success format
      if (body.success === true) {
        return originalJson.call(this, body);
      }

      // If the response is already in the standardized failure format
      if (body.success === false && body.error !== undefined) {
        return originalJson.call(this, body);
      }

      // 1. Success Responses (status === 'success' or statusCode < 400)
      if (body.status === 'success' || (res.statusCode < 400 && body.success !== false)) {
        const { status, message, data, ...rest } = body;
        
        let mergedData = {};
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          mergedData = { ...data, ...rest };
        } else if (data !== undefined) {
          mergedData = data;
        } else {
          mergedData = rest;
        }

        return originalJson.call(this, {
          success: true,
          message: message || 'Operation successful',
          data: mergedData,
        });
      }

      // 2. Failure Responses (statusCode >= 400)
      if (res.statusCode >= 400 || body.success === false) {
        const { status, message, error, ...rest } = body;
        
        let errorDetails = error || rest || {};
        // If error is a string, wrap it in an object
        if (typeof errorDetails === 'string') {
          errorDetails = { message: errorDetails };
        }

        return originalJson.call(this, {
          success: false,
          message: message || 'An error occurred on the server',
          error: errorDetails,
        });
      }
    }

    return originalJson.call(this, body);
  };

  next();
};
