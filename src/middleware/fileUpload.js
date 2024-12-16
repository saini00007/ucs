import multer from 'multer';
import AppError from '../utils/AppError.js';

// Helper to convert MB to bytes
const mbToBytes = (mb) => mb * 1024 * 1024;

// Define allowed file types and their configurations
const FILE_TYPES = {
  PDF: {
    mimeTypes: ['application/pdf'],
    errorMessage: 'Only PDF files are allowed for this upload.'
  },
  IMAGE_PNG: {
    mimeTypes: ['image/png'],
    errorMessage: 'Only PNG files are allowed for this upload.'
  }
};

// General upload middleware configuration
const createUploadMiddleware = (config) => {
  const storage = multer.memoryStorage();
  const fieldSizeLimits = {};
  const allowedMimeTypes = new Set();

  // Process config to get fieldSizeLimits and allowed mime types for each field
  config.forEach(({ fieldName, maxSizeMB, maxFiles, fileTypes }) => {
    fileTypes.forEach(type => {
      if (!FILE_TYPES[type]) {
        throw new AppError(`Invalid file type configuration: ${type}`, 400);  // AppError for invalid type
      }
      const mimeTypes = FILE_TYPES[type].mimeTypes;
      mimeTypes.forEach(mimeType => {
        allowedMimeTypes.add(mimeType);
        fieldSizeLimits[fieldName] = mbToBytes(maxSizeMB);
      });
    });
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: Math.max(...Object.values(fieldSizeLimits)),
      files: config.reduce((acc, { maxFiles }) => acc + maxFiles, 0),
    },
    fileFilter: (req, file, cb) => {
      if (allowedMimeTypes.has(file.mimetype)) {
        file.sizeLimit = fieldSizeLimits[file.fieldname];
        cb(null, true);
      } else {
        cb(new AppError('Invalid file type.', 400));  // AppError for invalid file type
      }
    }
  });

  return (req, res, next) => {
    const fields = config.map(({ fieldName, maxFiles }) => ({
      name: fieldName,
      maxCount: maxFiles
    }));

    upload.fields(fields)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // If MulterError, return specific message
        return next(new AppError(`File upload error: ${err.message}`, 400));
      } else if (err) {
        // Any other errors
        return next(new AppError(err.message, 400));
      }
      next();
    });
  };
};

// Middleware for different file types and sizes
const uploadMiddleware = {
  evidenceFiles: (maxSizeMB = 100, maxFiles = 10, fileTypes = ['PDF']) => {
    return createUploadMiddleware([
      { fieldName: 'files', maxSizeMB, maxFiles, fileTypes }
    ]);
  },
  companyLogo: (maxSizeMB = 5, maxFiles = 1, fileTypes = ['IMAGE_PNG']) => {
    return createUploadMiddleware([
      { fieldName: 'companyLogo', maxSizeMB, maxFiles, fileTypes }
    ]);
  }
};

export default uploadMiddleware;
