import multer from 'multer';

// Use memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // Limit file size to 100 MB
});

// Export the middleware for handling multiple files
export const uploadFiles = upload.array('files', 10); // Accept up to 10 files