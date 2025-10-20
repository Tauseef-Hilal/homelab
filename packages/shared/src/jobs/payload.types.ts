export interface JobPayload {
  prismaJobId: string;
  requestId: string;
  userId: string;
}

export interface CopyJobPayload extends JobPayload {
  items: { type: 'folder' | 'file'; id: string }[];
  destFolderId: string;
}

export interface ThumbnailJobPayload extends JobPayload {
  fileId: string;
  filePath: string;
  mimeType: string;
}

export interface ZipJobPayload extends JobPayload {
  folderId: string;
  folderPath: string;
}
