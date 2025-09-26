import api from '@client/lib/api';

export async function downloadFile(fileId: string) {
  const res = await api.get(`/storage/file/${fileId}/download`, {
    responseType: 'blob',
  });

  const blob = new Blob([res.data], {
    type: res.data.type || 'application/octet-stream',
  });

  return blob;
}
