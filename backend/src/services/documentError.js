class DocumentError extends Error {
  constructor(code) {
    super(code);
    this.name = 'DocumentError';
    this.code = code;
  }
}

module.exports = DocumentError;