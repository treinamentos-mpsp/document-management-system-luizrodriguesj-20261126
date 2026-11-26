const API_PREFIX = '/api';

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, options);
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está ativo.');
  }

  if (!response.ok) {
    let message = 'Não foi possível concluir a solicitação.';
    try {
      const payload = await response.json();
      message = payload.error?.message || message;
    } catch {
      message = 'Não foi possível concluir a solicitação.';
    }
    throw new Error(message);
  }

  return response;
}

export async function getDocuments() {
  const response = await request('/documents');
  const payload = await response.json();
  return Array.isArray(payload.documents) ? payload.documents : [];
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    body: formData
  });
  const payload = await response.json();
  return payload.document;
}

export async function downloadDocument(document) {
  const response = await request(`/documents/${encodeURIComponent(document.id)}/download`);
  const file = await response.blob();
  const objectUrl = URL.createObjectURL(file);
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = document.originalName;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}