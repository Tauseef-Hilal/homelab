import { JobPayload } from '../queue.types';

export interface CopyJobPayload extends JobPayload {
  srcFolderId: string;
  destFolderId: string;
  srcPath: string;
  destPath: string;
}

export type CopyJobResult = {
  destPath: string;
  copiedAt: string;
};
