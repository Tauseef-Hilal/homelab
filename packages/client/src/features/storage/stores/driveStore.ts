import { create } from 'zustand';
import {
  CreateFolderResponse,
  ListDirectoryResponse,
} from '@shared/schemas/storage/response/folder.schema';

type DriveState = {
  path: string;
  stack: ListDirectoryResponse['folder'][];
  stackIdx: number;
  setPath: (path: string) => void;
  push: (folder: ListDirectoryResponse['folder']) => void;
  moveBackward: () => void;
  moveForward: () => void;
  addFolder: (folder: CreateFolderResponse['folder']) => void;
};

const useDriveStore = create<DriveState>((set, getState) => ({
  path: '/',
  stack: [],
  stackIdx: 0,
  setPath: (path) => set({ path }),
  push: (folder) => {
    const state = getState();
    const stack = state.stack.slice(0, state.stackIdx + 1);
    set({ stack: [...stack, folder], stackIdx: stack.length });
  },
  moveBackward: () => {
    const { stackIdx, stack } = getState();
    if (stackIdx == 0) return;
    set({ stackIdx: stackIdx - 1, path: stack[stackIdx - 1].fullPath });
  },
  moveForward: () => {
    const { stackIdx, stack } = getState();
    if (stackIdx == stack.length - 1) return;
    set({ stackIdx: stackIdx + 1, path: stack[stackIdx + 1].fullPath });
  },
  addFolder: (folder) =>
    set((state) => {
      const stack = [...state.stack];
      const currentFolder = stack.at(-1);

      if (currentFolder) {
        currentFolder.children = [...currentFolder.children, folder];
      }

      return { stack };
    }),
}));

export default useDriveStore;
