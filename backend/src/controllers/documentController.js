const DocumentError = require('../services/documentError');

function createDocumentController(service) {
  return {
    upload: async (req, res, next) => {
      try {
        const document = await service.upload(req.file);
        res.status(201).json({ document });
      } catch (error) {
        next(error);
      }
    },

    list: (req, res, next) => {
      try {
        res.json({ documents: service.listDocuments() });
      } catch (error) {
        next(error);
      }
    },

    download: async (req, res, next) => {
      try {
        const file = await service.getDownload(req.params.id);
        res.type(file.contentType);
        res.download(file.path, file.originalName, (error) => {
          if (error && !res.headersSent) {
            next(error);
          }
        });
      } catch (error) {
        if (error instanceof DocumentError && error.code === 'DOCUMENT_NOT_FOUND') {
          next(error);
          return;
        }
        next(error);
      }
    }
  };
}

module.exports = createDocumentController;