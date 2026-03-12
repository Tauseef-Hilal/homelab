import { create } from 'zustand';
import { Entry, File, Folder } from '../types/storage.types';
import { isFolder } from '@client/lib/utils';

type Clipboard = { type: 'copy' | 'move'; items: Entry[] };
type ViewMode = 'grid' | 'list';

type DriveState = {
  path: string;
  inputPath: string;

  history: string[];
  historyIndex: number;

  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  selectedItems: Entry[];
  clipboard: Clipboard;

  navigate: (path: string) => void;
  replace: (path: string) => void;
  setInputPath: (path: string) => void;

  goBack: () => void;
  goForward: () => void;

  selectItem: (item: File | Folder) => void;
  deselectItem: (item: File | Folder) => void;
  deselectAll: () => void;
  selectAll: (items: (File | Folder)[]) => void;

  setClipboard: (clipboard: Clipboard) => void;
};

const useDriveStore = create<DriveState>((set, get) => ({
  path: '/',
  inputPath: '/',

  history: ['/'],
  historyIndex: 0,

  selectedItems: [],
  clipboard: { type: 'copy', items: [] },

  viewMode: 'grid',
  setViewMode: (mode) => set({ viewMode: mode }),

  navigate: (path) => {
    const { history, historyIndex } = get();

    const nextHistory = history.slice(0, historyIndex + 1);

    // prevent duplicate push
    if (nextHistory[nextHistory.length - 1] === path) {
      set({ path, inputPath: path });
      return;
    }

    nextHistory.push(path);

    set({
      path,
      inputPath: path,
      history: nextHistory,
      historyIndex: nextHistory.length - 1,
    });
  },

  replace: (path) => {
    set({
      path,
      inputPath: path,
    });
  },

  setInputPath: (path) => {
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    set({ inputPath: path });
  },

  goBack: () => {
    const { historyIndex, history } = get();
    if (historyIndex === 0) return;

    const newIndex = historyIndex - 1;
    const path = history[newIndex];

    set({
      historyIndex: newIndex,
      path,
      inputPath: path,
    });
  },

  goForward: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    const path = history[newIndex];

    set({
      historyIndex: newIndex,
      path,
      inputPath: path,
    });
  },

  selectItem: (item) =>
    set((state) => ({
      selectedItems: [
        ...state.selectedItems,
        {
          id: item.id,
          type: isFolder(item) ? 'folder' : 'file',
        },
      ],
    })),

  deselectItem: (item) =>
    set((state) => ({
      selectedItems: state.selectedItems.filter((i) => i.id !== item.id),
    })),

  deselectAll: () => set({ selectedItems: [] }),

  selectAll: (items) =>
    set({
      selectedItems: items.map((i) => ({
        id: i.id,
        type: isFolder(i) ? 'folder' : 'file',
      })),
    }),

  setClipboard: (clipboard) => set({ clipboard }),
}));

export default useDriveStore;
