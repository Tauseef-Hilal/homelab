'use client';

import useDriveStore from '../stores/driveStore';
import { File, Folder } from '../types/storage.types';

export function useSelect() {
  const { selectedItems, selectItem, deselectItem } = useDriveStore();

  const isSelected = (item: File | Folder) => {
    for (const i of selectedItems) if (i.id == item.id) return true;
    return false;
  };

  const onSelect = (child: File | Folder) => {
    if (isSelected(child)) {
      deselectItem(child);
    } else {
      selectItem(child);
    }
  };

  return { selectedItems, isSelected, onSelect, selectItem };
}
