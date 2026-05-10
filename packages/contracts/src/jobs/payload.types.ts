export interface JobPayload {
  requestId: string;
  userId: string;
}

export interface CopyJobPayload extends JobPayload {
  items: { type: 'folder' | 'file'; id: string }[];
  shareToken: string | undefined;
  destFolderId: string;
}

export interface MoveJobPayload extends JobPayload {
  items: { type: 'folder' | 'file'; id: string; newName?: string }[];
  shareToken: string | undefined;
  destFolderId: string;
}

export interface DeleteJobPayload extends JobPayload {
  items: { type: 'folder' | 'file'; id: string }[];
  shareToken: string | undefined;
}

export interface ThumbnailJobPayload extends JobPayload {
  fileId: string;
}

export interface ZipJobPayload extends JobPayload {
  items: { type: 'folder' | 'file'; id: string }[];
  shareToken: string | undefined;
}

export interface UploadCleanupJobPayload extends JobPayload {
  uploadId: string;
}
