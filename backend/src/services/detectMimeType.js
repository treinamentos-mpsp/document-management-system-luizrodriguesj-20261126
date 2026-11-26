const MIME_TYPES = {
  pdf: 'application/pdf',
  text: 'text/plain',
  word: 'application/msword',
  wordProcessing: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  png: 'image/png',
  jpeg: 'image/jpeg',
  zip: 'application/zip'
};

function isUtf8Text(buffer) {
  if (buffer.includes(0)) {
    return false;
  }

  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

function detectMimeType(buffer) {
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return MIME_TYPES.pdf;
  }

  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return MIME_TYPES.png;
  }

  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return MIME_TYPES.jpeg;
  }

  if (buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) {
    return MIME_TYPES.word;
  }

  const isZip = buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  if (isZip) {
    if (buffer.includes(Buffer.from('[Content_Types].xml')) && buffer.includes(Buffer.from('word/document.xml'))) {
      return MIME_TYPES.wordProcessing;
    }

    return MIME_TYPES.zip;
  }

  return isUtf8Text(buffer) ? MIME_TYPES.text : null;
}

module.exports = detectMimeType;