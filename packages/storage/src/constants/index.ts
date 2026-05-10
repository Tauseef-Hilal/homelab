export enum FilePermission {
  READ = 1 << 0,
  WRITE = 1 << 1,
  COPY = 1 << 2,
  DELETE = 1 << 4,
  SHARE = 1 << 5,
}

export const OWNER_PERMISSIONS =
  FilePermission.READ |
  FilePermission.WRITE |
  FilePermission.COPY |
  FilePermission.DELETE |
  FilePermission.SHARE;

export const READ_ONLY = FilePermission.READ;
