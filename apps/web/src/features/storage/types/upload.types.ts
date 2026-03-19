export type UploadStatus =
  | 'pending'
  | 'initiating'
  | 'hashing'
  | 'negotiating'
  | 'uploading'
  | 'paused'
  | 'failed'
  | 'uploaded'
  | 'canceled';

export type ChunkMeta = {
  index: number;
  size: number;
  hash: string;
};

export type UploadItem = {
  id: string;
  file: File;

  status: UploadStatus;

  progress: number;

  chunks?: ChunkMeta[];
  missingChunks?: number[];

  uploadId?: string;
  fileId?: string;

  abortController?: AbortController;

  error?: string;
};
