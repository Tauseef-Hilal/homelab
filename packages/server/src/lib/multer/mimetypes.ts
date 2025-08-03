const allowedMimeTypes = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'image/x-icon',

  // Video
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
  'video/3gpp',
  'video/3gpp2',

  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/flac',
  'audio/mp4',
  'audio/aac',

  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/rtf',
  'application/xml',
  'text/csv',

  // Code (optional)
  'application/javascript',
  'application/json',
  'application/x-sh',
  'text/html',
  'text/css',
  'text/x-python',
  'text/x-c',
  'text/x-c++',
  'text/x-java-source',
]);

export default allowedMimeTypes;
