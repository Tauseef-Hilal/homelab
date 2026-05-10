import api from '@client/lib/api';
import { requestSchemas } from '@homelab/contracts/schemas/sharing';

export async function updateUserShare(
  data: requestSchemas.UpdateUserShareInput & { itemId: string },
) {
  await api.put(`/sharing/${data.itemId}/user`, data);
}
