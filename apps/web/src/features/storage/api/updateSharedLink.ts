import api from '@client/lib/api';
import { requestSchemas } from '@homelab/contracts/schemas/sharing';

export async function updateSharedLink(
  data: requestSchemas.UpdateLinkInput & { token: string },
) {
  await api.put(`/sharing/${data.token}`, data);
}
