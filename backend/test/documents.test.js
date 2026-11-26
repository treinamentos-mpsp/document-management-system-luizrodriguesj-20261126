const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../src/app');

test('upload, listagem, download e validacoes de documentos', async () => {
  const storageDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const server = createApp({ storageDirectory, maxFileSize: 128 }).listen(0);

  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    async function uploadFile(blob, filename) {
      const formData = new FormData();
      if (blob) {
        formData.append('file', blob, filename);
      }

      return fetch(`${baseUrl}/upload`, {
        method: 'POST',
        body: formData
      });
    }

    const uploadResponse = await uploadFile(new Blob(['hello DMS']), 'hello.txt');
    assert.equal(uploadResponse.status, 201, await uploadResponse.clone().text());
    const { document } = await uploadResponse.json();
    assert.equal(document.originalName, 'hello.txt');
    assert.equal(document.size, 9);
    assert.equal(document.owner, 'local-user');
    assert.equal('path' in document, false);

    const listResponse = await fetch(`${baseUrl}/documents`);
    assert.deepEqual((await listResponse.json()).documents, [document]);

    const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
    assert.equal(downloadResponse.status, 200);
    assert.equal(await downloadResponse.text(), 'hello DMS');
    assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);

    const missingFileResponse = await uploadFile();
    assert.equal(missingFileResponse.status, 400);
    assert.equal((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');

    const invalidTypeResponse = await uploadFile(
      new Blob([new Uint8Array([0, 1, 2])], { type: 'application/pdf' }),
      'invalid.pdf'
    );
    assert.equal(invalidTypeResponse.status, 415);
    assert.equal((await invalidTypeResponse.json()).error.code, 'UNSUPPORTED_MEDIA_TYPE');

    const oversizedResponse = await uploadFile(new Blob(['x'.repeat(129)]), 'large.txt');
    assert.equal(oversizedResponse.status, 413);
    assert.equal((await oversizedResponse.json()).error.code, 'FILE_TOO_LARGE');

    const missingDocumentResponse = await fetch(`${baseUrl}/documents/missing/download`);
    assert.equal(missingDocumentResponse.status, 404);
    assert.equal((await missingDocumentResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');
  } finally {
    const closeServer = new Promise((resolve) => server.close(resolve));
    server.closeAllConnections();
    await closeServer;
    await fs.rm(storageDirectory, { recursive: true, force: true });
  }
});