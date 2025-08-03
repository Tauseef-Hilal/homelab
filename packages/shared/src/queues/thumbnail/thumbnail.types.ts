export type ThumbnailJobPayload = {
  requestId: string;
  userId: string;
  fileId: string;
  filePath: string;
  mimeType: string;
};

export type ThumbnailJobResult = {
  thumbnailPath: string;
  generatedAt: string;
};
