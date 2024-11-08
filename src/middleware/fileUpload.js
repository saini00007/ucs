import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'));
    }
  },
});

export const uploadFiles = (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, messages: ['File size should not exceed 100 MB.'] });
      }
    } else if (err) {
      if (err.message === 'Only PDF files are allowed.') {
        return res.status(400).json({ success: false, messages: [err.message] });
      }
      return res.status(500).json({ success: false, messages: ['File upload error.'] });
    }
    next();
  });
};
