// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const path = require('node:path');
const DocumentRepository = require('./repositories/documentRepository');
const DocumentService = require('./services/documentService');
const createDocumentController = require('./controllers/documentController');
const handleError = require('./controllers/errorController');
const createDocumentRouter = require('./routes/documentRoutes');

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg'
];

function parseMaxFileSize(value) {
  if (value === undefined) {
    return DEFAULT_MAX_FILE_SIZE;
  }

  const parsedValue = Number(value);
  if (!Number.isSafeInteger(parsedValue) || parsedValue < 1) {
    throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
  }

  return parsedValue;
}

function parseAllowedMimeTypes(value) {
  if (value === undefined) {
    return DEFAULT_ALLOWED_MIME_TYPES;
  }

  const mimeTypes = value.split(',').map((mimeType) => mimeType.trim()).filter(Boolean);
  if (mimeTypes.length === 0) {
    throw new Error('ALLOWED_MIME_TYPES deve conter ao menos um tipo MIME.');
  }

  return mimeTypes;
}

function createApp(options = {}) {
  const app = express();
  const storageDirectory = options.storageDirectory || path.resolve(__dirname, '../storage');
  const maxFileSize = options.maxFileSize || parseMaxFileSize(process.env.MAX_FILE_SIZE_BYTES);
  const allowedMimeTypes = options.allowedMimeTypes || parseAllowedMimeTypes(process.env.ALLOWED_MIME_TYPES);
  const repository = options.repository || new DocumentRepository();
  const service = new DocumentService(repository, { allowedMimeTypes });
  const controller = createDocumentController(service);

  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(createDocumentRouter(controller, { storageDirectory, maxFileSize }));
  app.use(handleError);

  return app;
}

const app = createApp();
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
