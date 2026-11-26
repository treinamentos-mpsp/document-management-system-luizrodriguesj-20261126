const crypto = require('node:crypto');
const DocumentError = require('./documentError');
const detectMimeType = require('./detectMimeType');
const DocumentFileRepository = require('../repositories/documentFileRepository');

function mapStorageError(error, { missingFileCode } = {}) {
  if (error instanceof DocumentError) {
    return error;
  }

  if (error.code === 'ENOENT' && missingFileCode) {
    return new DocumentError(missingFileCode);
  }

  return new DocumentError('STORAGE_ERROR');
}

function toPublicDocument(document) {
  const { id, originalName, size, uploadedAt, owner } = document;
  return { id, originalName, size, uploadedAt, owner };
}

class DocumentService {
  constructor(repository, { allowedMimeTypes, fileRepository }) {
    this.repository = repository;
    this.fileRepository = fileRepository;
    this.allowedMimeTypes = new Set(allowedMimeTypes);
  }

  async upload(file) {
    if (!file) {
      throw new DocumentError('FILE_REQUIRED');
    }

    try {
      const contents = await this.fileRepository.read(file.path);
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
      let documentError = mapStorageError(error);
      try {
        await this.fileRepository.remove(file.path);
      } catch {
        documentError = new DocumentError('STORAGE_ERROR');
      }

      throw documentError;
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
      if (!await this.fileRepository.isFile(document.path)) {
        throw new DocumentError('DOCUMENT_NOT_FOUND');
      }
    } catch (error) {
      throw mapStorageError(error, { missingFileCode: 'DOCUMENT_NOT_FOUND' });
    }

    return {
      path: document.path,
      originalName: document.originalName,
      contentType: document.contentType
    };
  }
}

module.exports = DocumentService;