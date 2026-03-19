'use client';

import { useCallback } from 'react';
import { File, Folder } from '../types/storage.types';
import useDriveStore from '../stores/drive.store';

export function useSelect() {
  const selectItem = useDriveStore((s) => s.selectItem);
  const deselectItem = useDriveStore((s) => s.deselectItem);
  const selectedItems = useDriveStore((s) => s.selectedItems);

  const isSelected = useCallback(
    (item: File | Folder) => {
      for (const i of selectedItems) if (i.id == item.id) return true;
      return false;
    },
    [selectedItems],
  );

  const onSelect = useCallback(
    (child: File | Folder) => {
      if (isSelected(child)) {
        deselectItem(child);
      } else {
        selectItem(child);
      }
    },
    [isSelected, deselectItem, selectItem],
  );

  return { selectedItems, isSelected, onSelect, selectItem };
}
