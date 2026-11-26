import { useState } from 'react';
import { downloadDocument } from '../services/documentApi.js';

export default function DownloadButton({ document, onError = () => {} }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadDocument(document);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button
      className="download-button"
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      aria-label={`Baixar ${document.originalName}`}
      title="Baixar arquivo"
    >
      <span aria-hidden="true">{isDownloading ? '…' : '↓'}</span>
      <span>{isDownloading ? 'Baixando' : 'Baixar'}</span>
    </button>
  );
}