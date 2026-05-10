import api from '@client/lib/api';
import { requestSchemas } from '@homelab/contracts/schemas/sharing';

export async function shareWithUser(
  data: requestSchemas.ShareWithUserInput & { itemId: string },
) {
  await api.post(`/sharing/${data.itemId}/user`, data);
}
