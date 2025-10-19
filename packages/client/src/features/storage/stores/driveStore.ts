import { create } from 'zustand';
import {
  CreateFolderResponse,
  ListDirectoryResponse,
} from '@shared/schemas/storage/response/folder.schema';
import { UploadFileResponse } from '@shared/schemas/storage/response/file.schema';
import { File, Folder } from '../types/storage.types';

type DriveState = {
  inputPath: string;
  path: string;
  stack: ListDirectoryResponse['folder'][];
  stackIdx: number;
  selectedItems: (File | Folder)[];
  setPath: (path: string) => void;
  setInputPath: (path: string) => void;
  push: (folder: ListDirectoryResponse['folder']) => void;
  clearStack: () => void;
  moveBackward: () => void;
  moveForward: () => void;
  addFolder: (folder: CreateFolderResponse['folder']) => void;
  addFile: (file: UploadFileResponse['file']) => void;
  renameFile: (fileId: string, newName: string) => void;
  selectItem: (item: File | Folder) => void;
  deselectItem: (item: File | Folder) => void;
  deselectAll: () => void;
};

const useDriveStore = create<DriveState>((set, getState) => ({
  inputPath: '/',
  path: '/',
  stack: [],
  stackIdx: 0,
  selectedItems: [],
  setPath: (path) => set({ path, inputPath: path }),
  setInputPath: (path) => set({ inputPath: path }),
  push: (folder) => {
    const state = getState();
    const stack = state.stack.slice(0, state.stackIdx + 1);
    set({ stack: [...stack, folder], stackIdx: stack.length });
  },
  clearStack: () => set({ stack: [], stackIdx: 0 }),
  moveBackward: () => {
    const { stackIdx, stack } = getState();
    if (stackIdx == 0) return;

    const newPath = stack[stackIdx - 1].fullPath;
    set({ stackIdx: stackIdx - 1, path: newPath, inputPath: newPath });
  },
  moveForward: () => {
    const { stackIdx, stack } = getState();
    if (stackIdx == stack.length - 1) return;

    const newPath = stack[stackIdx + 1].fullPath;
    set({ stackIdx: stackIdx + 1, path: newPath, inputPath: newPath });
  },
  addFolder: (folder) =>
    set((state) => {
      const stack = [...state.stack];
      const currentFolder = stack.at(state.stackIdx);

      if (currentFolder) {
        currentFolder.children = [...currentFolder.children, folder];
      }

      return { ...state, stack };
    }),
  addFile: (file) =>
    set((state) => {
      const stack = [...state.stack];
      const currentFolder = stack.at(state.stackIdx);

      if (currentFolder) {
        currentFolder.files = [...currentFolder.files, file];
      }

      return { ...state, stack };
    }),
  renameFile: (fileId, newName) => {
    set((state) => {
      const stack = [...state.stack];
      const currentFolder = stack.at(state.stackIdx);

      if (currentFolder) {
        currentFolder.files = currentFolder.files.map((file) =>
          file.id == fileId ? { ...file, name: newName } : file
        );
      }

      return { ...state, stack };
    });
  },
  selectItem: (item: File | Folder) => {
    set((state) => {
      const newSelectedItems = [...state.selectedItems, item];
      return { ...state, selectedItems: newSelectedItems };
    });
  },
  deselectItem: (item: File | Folder) => {
    set((state) => {
      const newSelectedItems = state.selectedItems.filter(
        (i) => i.id != item.id
      );
      return { ...state, selectedItems: newSelectedItems };
    });
  },
  deselectAll: () => {
    set((state) => ({ ...state, selectedItems: [] }));
  },
}));

export default useDriveStore;
