export type ThumbnailJobResult = {
  thumbnailPath: string;
  generatedAt: string;
};

export type CopyJobResult = {
  copiedAt: string;
};

export type MoveJobResult = {
  movedAt: string;
};

export type DeleteJobResult = {
  deletedAt: string;
};

export type ZipJobResult = {
  zipPath: string;
  zippedAt: string;
};
