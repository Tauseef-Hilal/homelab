import { Readable } from 'stream';
import type { BlobStore } from '../contracts';

export interface ChunkReference {
  blobKey: string;
  size: number;
}

export class FileContentReader {
  constructor(private readonly blobs: BlobStore) {}

  /**
   * Assembles multiple physical blob chunks into a single logical
   * readable stream. Supports HTTP byte-range requests for video
   * streaming and resumable downloads.
   */
  openFile(
    chunks: ChunkReference[],
    range?: { start?: number; end?: number },
  ): Readable {
    const { start = 0, end = Infinity } = range || {};
    const blobs = this.blobs;

    async function* generateChunks() {
      let currentOffset = 0;

      for (const chunk of chunks) {
        const chunkStart = currentOffset;
        const chunkEnd = currentOffset + chunk.size - 1;

        // Determine if this specific chunk contains bytes
        // requested by the range
        if (chunkEnd >= start && chunkStart <= end) {
          const readStart = Math.max(0, start - chunkStart);
          const readEnd = Math.min(chunk.size - 1, end - chunkStart);

          // Ask the provider for just the bytes we need from this chunk
          const stream = blobs.openRead(chunk.blobKey, {
            start: readStart,
            end: readEnd,
          });

          // Yield buffers as they arrive from the underlying provider
          for await (const data of stream) {
            yield data;
          }
        }

        currentOffset += chunk.size;

        // Short-circuit if we have fulfilled the entire requested range
        if (currentOffset > end) break;
      }
    }

    // Wrap the async generator in a native Node.js Readable stream
    return Readable.from(generateChunks());
  }
}
