import multer from 'multer';

export const notFound = (req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.message || 'Internal server error';

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Each uploaded image must be 5 MB or smaller.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'You can upload a maximum of 5 images per complaint.';
    } else {
      message = `Upload error: ${err.message}`;
    }
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join('. ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier format.';
  } else if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account or record with that ${duplicateField} already exists.`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
