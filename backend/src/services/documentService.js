const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const DocumentError = require('./documentError');
const detectMimeType = require('./detectMimeType');

function toPublicDocument(document) {
  const { id, originalName, size, uploadedAt, owner } = document;
  return { id, originalName, size, uploadedAt, owner };
}

class DocumentService {
  constructor(repository, { allowedMimeTypes }) {
    this.repository = repository;
    this.allowedMimeTypes = new Set(allowedMimeTypes);
  }

  async upload(file) {
    if (!file) {
      throw new DocumentError('FILE_REQUIRED');
    }

    try {
      const contents = await fs.readFile(file.path);
      const contentType = detectMimeType(contents);
      if (!contentType || !this.allowedMimeTypes.has(contentType)) {
        throw new DocumentError('UNSUPPORTED_MEDIA_TYPE');
      }

      const document = {
        id: crypto.randomUUID(),
        originalName: file.originalname,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner: 'local-user',
        path: file.path,
        contentType
      };

      this.repository.save(document);
      return toPublicDocument(document);
    } catch (error) {
      await fs.unlink(file.path).catch(() => {});
      if (error instanceof DocumentError) {
        throw error;
      }

      throw new DocumentError('STORAGE_ERROR');
    }
  }

  listDocuments() {
    return this.repository.findAll()
      .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))
      .map(toPublicDocument);
  }

  async getDownload(id) {
    const document = this.repository.findById(id);
    if (!document) {
      throw new DocumentError('DOCUMENT_NOT_FOUND');
    }

    try {
      const file = await fs.stat(document.path);
      if (!file.isFile()) {
        throw new DocumentError('DOCUMENT_NOT_FOUND');
      }
    } catch (error) {
      if (error instanceof DocumentError) {
        throw error;
      }
      if (error.code === 'ENOENT') {
        throw new DocumentError('DOCUMENT_NOT_FOUND');
      }

      throw new DocumentError('STORAGE_ERROR');
    }

    return {
      path: document.path,
      originalName: document.originalName,
      contentType: document.contentType
    };
  }
}

module.exports = DocumentService;