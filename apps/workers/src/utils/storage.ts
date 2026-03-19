export function validateFolderCopyPaths(srcPath: string, destPath: string) {
  const normalize = (p: string) => p.replace(/\/+$/, '');
  const src = normalize(srcPath);
  const dest = normalize(destPath);

  if (dest === src || dest.startsWith(src + '/')) {
    throw new Error('Cannot copy a folder into its own subtree.');
  }
}
