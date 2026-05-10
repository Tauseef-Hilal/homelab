import { create } from 'zustand';
import { Entry, File, Folder } from '../types/storage.types';
import { isFolder } from '@client/lib/utils';

export type ViewMode = 'grid' | 'list';
export type Clipboard = { type: 'copy' | 'move'; items: Entry[] };
export type ViewContext = 'personal' | 'shared' | 'link' | 'recent' | 'starred';

export type HistoryEntry = {
  path: string;
  ownerId?: string;
  shareToken?: string;
  viewContext: ViewContext;
};

type DriveState = {
  path: string;
  inputPath: string;

  ownerId?: string;
  shareToken?: string;
  viewContext: ViewContext;

  history: HistoryEntry[];
  historyIndex: number;

  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  selectedItems: Entry[];
  clipboard: Clipboard;

  navigate: (
    path: string,
    options?: {
      ownerId?: string | null;
      shareToken?: string | null;
      viewContext?: ViewContext;
      replace?: boolean;
    },
  ) => void;
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

  ownerId: undefined,
  shareToken: undefined,
  viewContext: 'personal',

  history: [{ path: '/', viewContext: 'personal' }],
  historyIndex: 0,

  selectedItems: [],
  clipboard: { type: 'copy', items: [] },

  viewMode: 'grid',
  setViewMode: (mode) => set({ viewMode: mode }),

  navigate: (path, options = {}) => {
    const state = get();
    
    // We allow explicit null to unset values, otherwise we keep existing state
    const targetOwnerId = options.ownerId !== undefined 
      ? (options.ownerId === null ? undefined : options.ownerId) 
      : state.ownerId;
      
    const targetShareToken = options.shareToken !== undefined 
      ? (options.shareToken === null ? undefined : options.shareToken) 
      : state.shareToken;
      
    const targetViewContext = options.viewContext !== undefined 
      ? options.viewContext 
      : state.viewContext;

    const newEntry: HistoryEntry = {
      path,
      ownerId: targetOwnerId,
      shareToken: targetShareToken,
      viewContext: targetViewContext,
    };

    let nextHistory = state.history.slice(0, state.historyIndex + 1);
    let nextIndex = state.historyIndex;

    if (options.replace) {
      if (nextHistory.length > 0) {
        nextHistory[nextHistory.length - 1] = newEntry;
      } else {
        nextHistory = [newEntry];
        nextIndex = 0;
      }
    } else {
      const lastEntry = nextHistory[nextHistory.length - 1];
      if (
        !lastEntry ||
        lastEntry.path !== newEntry.path ||
        lastEntry.ownerId !== newEntry.ownerId ||
        lastEntry.shareToken !== newEntry.shareToken ||
        lastEntry.viewContext !== newEntry.viewContext
      ) {
        nextHistory.push(newEntry);
        nextIndex = nextHistory.length - 1;
      }
    }

    set({
      path,
      inputPath: path,
      ownerId: targetOwnerId,
      shareToken: targetShareToken,
      viewContext: targetViewContext,
      history: nextHistory,
      historyIndex: nextIndex,
      selectedItems: [],
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
    const entry = history[newIndex];

    set({
      historyIndex: newIndex,
      path: entry.path,
      inputPath: entry.path,
      ownerId: entry.ownerId,
      shareToken: entry.shareToken,
      viewContext: entry.viewContext,
      selectedItems: [],
    });
  },

  goForward: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    const entry = history[newIndex];

    set({
      historyIndex: newIndex,
      path: entry.path,
      inputPath: entry.path,
      ownerId: entry.ownerId,
      shareToken: entry.shareToken,
      viewContext: entry.viewContext,
      selectedItems: [],
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
