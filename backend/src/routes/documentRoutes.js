const crypto = require('node:crypto');
const fs = require('node:fs');
const express = require('express');
const multer = require('multer');

function createDocumentRouter(controller, { storageDirectory, maxFileSize }) {
  fs.mkdirSync(storageDirectory, { recursive: true });

  const storage = multer.diskStorage({
    destination: storageDirectory,
    filename: (req, file, callback) => callback(null, crypto.randomUUID())
  });
  const upload = multer({
    storage,
    limits: {
      fileSize: maxFileSize,
      files: 1,
      fields: 0,
      parts: 1
    }
  });
  const router = express.Router();

  router.post('/upload', upload.single('file'), controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  return router;
}

module.exports = createDocumentRouter;