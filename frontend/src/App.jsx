import { useEffect, useState } from 'react';
import { getDocuments, uploadDocument } from './services/documentApi.js';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notification, setNotification] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    getDocuments()
      .then((items) => {
        if (isMounted) {
          setDocuments(items);
          setLoadError('');
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(error.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  async function handleUpload(file) {
    const uploadedDocument = await uploadDocument(file);
    setDocuments((currentDocuments) => [
      uploadedDocument,
      ...currentDocuments.filter((document) => document.id !== uploadedDocument.id)
    ]);
    setLoadError('');
    setActionError('');
    setNotification(`${uploadedDocument.originalName} enviado com sucesso.`);
  }

  function handleRefresh() {
    setIsLoading(true);
    setLoadError('');
    setActionError('');
    setNotification('');
    setRefreshKey((currentKey) => currentKey + 1);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span className="brand-name">arquivo<span>local</span></span>
        </a>
        <div className="workspace-label">
          <span className="status-dot" aria-hidden="true" />
          Espaço local
        </div>
      </header>

      <main className="workspace">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">Biblioteca de arquivos</p>
            <h1 id="page-title">Documentos</h1>
            <p className="page-description">Seus arquivos, organizados em um só lugar.</p>
          </div>
          <div className="document-count" aria-label={`${documents.length} documentos`}>
            <span className="count-number">{documents.length.toString().padStart(2, '0')}</span>
            <span className="count-label">{documents.length === 1 ? 'documento' : 'documentos'}</span>
          </div>
        </section>

        <section className="upload-section" aria-labelledby="upload-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Adicionar à biblioteca</p>
              <h2 id="upload-title">Enviar um arquivo</h2>
            </div>
            <span className="section-index">01</span>
          </div>
          <UploadComponent onUpload={handleUpload} />
        </section>

        <section className="documents-section" aria-labelledby="documents-title">
          <div className="section-heading documents-heading">
            <div>
              <p className="eyebrow">Sua biblioteca</p>
              <h2 id="documents-title">Arquivos recentes</h2>
            </div>
            <button
              className="refresh-button"
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Atualizar lista de documentos"
              title="Atualizar"
            >
              <span aria-hidden="true" className={isLoading ? 'refresh-icon is-spinning' : 'refresh-icon'}>↻</span>
            </button>
          </div>

          {notification && <p className="notice" role="status">{notification}</p>}
          {actionError && <p className="action-error" role="alert">{actionError}</p>}
          {loadError ? (
            <div className="load-error" role="alert">
              <span>{loadError}</span>
              <button type="button" onClick={handleRefresh}>Tentar novamente</button>
            </div>
          ) : (
            <DocumentList
              documents={documents}
              isLoading={isLoading}
              onDownloadError={setActionError}
            />
          )}
        </section>
      </main>

      <footer className="app-footer">
        <span>ARQUIVO LOCAL</span>
        <span>Armazenamento nesta aplicação</span>
      </footer>
    </div>
  );
}
