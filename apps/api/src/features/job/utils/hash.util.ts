import crypto from 'crypto';

export function generateETag(data: any) {
  const hash = crypto
    .createHash('sha1')
    .update(JSON.stringify(data))
    .digest('base64');

  return `"${hash}"`;
}
