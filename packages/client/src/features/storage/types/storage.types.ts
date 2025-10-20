import { ListDirectoryResponse } from '@shared/schemas/storage/response/folder.schema';

export type Folder = ListDirectoryResponse['folder']['children'][0];
export type File = ListDirectoryResponse['folder']['files'][0];
export type Entry = { id: string; type: 'file' | 'folder' };
