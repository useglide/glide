const multer = require('multer');

// Configure multer for memory storage (files will be stored in memory as Buffer)
const storage = multer.memoryStorage();

// File filter to validate file types (optional - you can customize this)
const fileFilter = (req, file, cb) => {
  // Accept all file types for now - Canvas will handle validation
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10 // Maximum 10 files
  }
});

module.exports = {
  // Single file upload
  single: (fieldName) => upload.single(fieldName),
  
  // Multiple files upload
  multiple: (fieldName, maxCount) => upload.array(fieldName, maxCount),
  
  // Multiple files with different field names
  fields: (fields) => upload.fields(fields)
};
