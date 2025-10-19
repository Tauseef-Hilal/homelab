'use client';

import useDriveStore from '../stores/driveStore';
import { File, Folder } from '../types/storage.types';

export function useSelect() {
  const { selectedItems, selectItem, deselectItem } = useDriveStore();

  const onSelect = (child: File | Folder) => {
    if (selectedItems.includes(child)) {
      deselectItem(child);
    } else {
      selectItem(child);
    }
  };

  const isSelected = (item: File) => {
    for (const i of selectedItems) if (i.id == item.id) return true;
    return false;
  };

  return { selectedItems, isSelected, onSelect, selectItem };
}
