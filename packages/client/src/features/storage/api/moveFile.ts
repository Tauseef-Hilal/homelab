import api from '@client/lib/api';
import { MoveFileInput } from '@shared/schemas/storage/request/file.schema';

export async function moveFile(fileId: string, data: MoveFileInput) {
  await api.patch(`/storage/file/${fileId}/move`, data);
}
