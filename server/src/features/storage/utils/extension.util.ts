import path from 'path';

export function getExtension(filename: string): string {
  const ext = path.extname(filename || '').toLowerCase();
  return ext.startsWith('.') ? ext.slice(1) : ext;
}
