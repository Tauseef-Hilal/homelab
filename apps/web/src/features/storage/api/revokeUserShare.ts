import api from '@client/lib/api';
import { requestSchemas } from '@homelab/contracts/schemas/sharing';

export async function revokeUserShare(
  data: requestSchemas.RevokeUserShareInput & { itemId: string },
) {
  await api.delete(`/sharing/${data.itemId}/user`, { data });
}
