import { useRef, useState } from 'react';
import { formatFileSize } from '../services/formatters.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_FILES = '.pdf,.txt,.doc,.docx,.png,.jpg,.jpeg';

export default function UploadComponent({ onUpload }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  function selectFile(file) {
    setError('');
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setError('O arquivo excede o limite de 10 MB.');
      return;
    }
    setSelectedFile(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile || isUploading) {
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label
        className={`drop-zone${isDragging ? ' is-dragging' : ''}${selectedFile ? ' has-file' : ''}`}
        htmlFor="document-file"
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          id="document-file"
          className="file-input"
          type="file"
          accept={ACCEPTED_FILES}
          onChange={(event) => selectFile(event.target.files[0])}
          disabled={isUploading}
        />
        <span className="upload-symbol" aria-hidden="true">↑</span>
        <span className="drop-copy">
          <strong>{selectedFile ? selectedFile.name : 'Arraste um arquivo ou escolha no dispositivo'}</strong>
          <span>{selectedFile ? formatFileSize(selectedFile.size) : 'PDF, DOC, DOCX, TXT, PNG ou JPEG · até 10 MB'}</span>
        </span>
        <span className="choose-file">Escolher arquivo</span>
      </label>

      <div className="upload-actions">
        <p className="upload-feedback" role={error ? 'alert' : 'status'}>
          {error || (selectedFile ? 'Arquivo pronto para envio.' : ' ')}
        </p>
        <button className="primary-button" type="submit" disabled={!selectedFile || isUploading}>
          <span aria-hidden="true">{isUploading ? '…' : '+'}</span>
          {isUploading ? 'Enviando' : 'Enviar arquivo'}
        </button>
      </div>
    </form>
  );
}