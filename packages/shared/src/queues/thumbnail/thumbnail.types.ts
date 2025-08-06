import { JobPayload } from "../queue.types";

export interface ThumbnailJobPayload extends JobPayload  {
  fileId: string;
  filePath: string;
  mimeType: string;
};

export type ThumbnailJobResult = {
  thumbnailPath: string;
  generatedAt: string;
};
