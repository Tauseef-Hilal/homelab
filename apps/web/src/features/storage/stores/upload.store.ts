import { create } from 'zustand';

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

  folderId: string;

  status: UploadStatus;
  progress: number;

  chunks?: ChunkMeta[];
  missingChunks?: number[];

  uploadId?: string;
  fileId?: string;

  abortController?: AbortController;

  error?: string;
};

type UploadStore = {
  items: UploadItem[];

  addFiles: (files: File[], folderId: string) => void;
  updateItem: (id: string, patch: Partial<UploadItem>) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

export const useUploadStore = create<UploadStore>((set) => ({
  items: [],

  addFiles: (files, folderId) =>
    set((s) => ({
      items: [
        ...s.items,
        ...files.map((file) => ({
          id: crypto.randomUUID(),
          file,
          folderId,
          status: 'pending' as UploadStatus,
          progress: 0,
        })),
      ],
    })),

  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    })),

  removeItem: (id) =>
    set((s) => ({
      items: s.items.filter((i) => i.id !== id),
    })),

  clear: () => set({ items: [] }),
}));
