import { File, Folder } from '@client/features/storage/types/storage.types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isFolder(item: File | Folder): item is Folder {
  return (item as Folder).parentId !== undefined;
}
