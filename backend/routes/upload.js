const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/certificate', protect, upload.single('certificate'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({
    url: req.file.path,        // Cloudinary secure_url
    fileName: req.file.originalname
  });
});

module.exports = router;