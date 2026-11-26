const fs = require('node:fs/promises');

class DocumentFileRepository {
  read(filePath) {
    return fs.readFile(filePath);
  }

  async isFile(filePath) {
    const file = await fs.stat(filePath);
    return file.isFile();
  }

  remove(filePath) {
    return fs.unlink(filePath);
  }
}

module.exports = DocumentFileRepository;
