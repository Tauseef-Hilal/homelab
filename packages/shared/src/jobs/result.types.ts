export type ZipJobResult = {
  zipPath: string;
  zippedAt: string;
};

export type ThumbnailJobResult = {
  thumbnailPath: string;
  generatedAt: string;
};

export type CopyJobResult = {
  destPath: string;
  copiedAt: string;
};
