export type CopyJobPayload = {
  requestId: string;
  userId: string;
  srcFolderId: string;
  destFolderId: string;
  srcPath: string;
  destPath: string;
  prismaJobId: string;
};

export type CopyJobResult = {
  destPath: string;
  copiedAt: string;
};
