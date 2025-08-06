import { JobPayload } from '../queue.types';

export interface ZipJobPayload extends JobPayload {
  folderId: string;
  folderPath: string;
}

export type ZipJobResult = {
  zipPath: string;
  zippedAt: string;
};
