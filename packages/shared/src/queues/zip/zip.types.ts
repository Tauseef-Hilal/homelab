export type ZipJobPayload = {
  requestId: string;
  userId: string;
  prismaJobId: string;
  folderId: string;
  folderPath: string;
};

export type ZipJobResult = {
  zipPath: string;
  zippedAt: string;
};
