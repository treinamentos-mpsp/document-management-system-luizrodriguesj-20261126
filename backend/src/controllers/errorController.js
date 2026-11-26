const multer = require('multer');
const DocumentError = require('../services/documentError');

const ERROR_RESPONSES = {
  FILE_REQUIRED: { status: 400, message: 'Envie um arquivo no campo "file".' },
  INVALID_UPLOAD: { status: 400, message: 'A requisicao de upload e invalida.' },
  DOCUMENT_NOT_FOUND: { status: 404, message: 'Documento nao encontrado.' },
  FILE_TOO_LARGE: { status: 413, message: 'O arquivo excede o tamanho maximo permitido.' },
  UNSUPPORTED_MEDIA_TYPE: { status: 415, message: 'O tipo de arquivo nao e permitido.' },
  STORAGE_ERROR: { status: 500, message: 'Nao foi possivel acessar o armazenamento local.' },
  INTERNAL_ERROR: { status: 500, message: 'Ocorreu um erro interno.' }
};

function getErrorCode(error) {
  if (error instanceof DocumentError) {
    return error.code;
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return 'FILE_TOO_LARGE';
    }
    return 'INVALID_UPLOAD';
  }

  if (error.code && error.code !== 'INTERNAL_ERROR') {
    return 'STORAGE_ERROR';
  }

  return 'INTERNAL_ERROR';
}

function handleError(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const code = getErrorCode(error);
  const response = ERROR_RESPONSES[code] || ERROR_RESPONSES.INTERNAL_ERROR;
  res.status(response.status).json({
    error: {
      code,
      message: response.message
    }
  });
}

module.exports = handleError;