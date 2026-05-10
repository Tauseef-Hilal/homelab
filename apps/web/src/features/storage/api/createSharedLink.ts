import api from '@client/lib/api';
import { requestSchemas } from '@homelab/contracts/schemas/sharing';

export async function createSharedLink(
  data: requestSchemas.ShareLinkInput & { itemId: string },
) {
  await api.post(`/sharing/${data.itemId}/link`, data);
}
