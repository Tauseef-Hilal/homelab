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

export function stringToHslColor(str: string, s = 70, l = 40): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360; // hue from 0–359
  return `hsl(${h}, ${s}%, ${l}%)`;
}

