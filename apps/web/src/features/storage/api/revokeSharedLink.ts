import api from '@client/lib/api';
import { requestSchemas } from '@homelab/contracts/schemas/sharing';

export async function revokeSharedLink(
  data: requestSchemas.RevokeSharedLinkInput,
) {
  await api.delete(`/sharing/${data.token}`, { data });
}
