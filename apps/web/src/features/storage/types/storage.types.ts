import { responseSchemas } from '@homelab/contracts/schemas/storage';

export type Folder =
  responseSchemas.ListDirectoryResponse['folder']['children'][0];
export type File = responseSchemas.ListDirectoryResponse['folder']['files'][0];
export type Entry = { id: string; type: 'file' | 'folder' };
