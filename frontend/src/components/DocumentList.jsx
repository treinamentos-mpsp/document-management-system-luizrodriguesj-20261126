import DownloadButton from './DownloadButton.jsx';
import { formatFileSize } from '../services/formatters.js';

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível';
  }
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export default function DocumentList({ documents, isLoading, onDownloadError }) {
  if (isLoading) {
    return <div className="list-state" role="status">Carregando documentos…</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="list-state empty-state">
        <span className="empty-mark" aria-hidden="true">—</span>
        <strong>Nenhum documento ainda</strong>
        <span>A biblioteca está pronta para receber seu primeiro arquivo.</span>
      </div>
    );
  }

  return (
    <div className="document-table-wrap">
      <table className="document-table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Tamanho</th>
            <th scope="col">Adicionado</th>
            <th scope="col"><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td className="file-name-cell">
                <span className="file-type-mark" aria-hidden="true">
                  {document.originalName.split('.').pop().slice(0, 3).toUpperCase()}
                </span>
                <span className="file-name" title={document.originalName}>{document.originalName}</span>
              </td>
              <td className="muted-cell">{formatFileSize(document.size)}</td>
              <td className="muted-cell">{formatDate(document.uploadedAt)}</td>
              <td className="action-cell">
                <DownloadButton document={document} onError={onDownloadError} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}