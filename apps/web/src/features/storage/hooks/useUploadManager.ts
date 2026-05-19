import axios from 'axios';
import { toast } from 'sonner';
import { uploadInit } from '../api/uploadInit';
import { UploadStatus, useUploadStore } from '../stores/upload.store';
import { uploadChunkCheck } from '../api/uploadChunkCheck';
import { uploadChunk } from '../api/uploadChunk';
import { uploadFinish } from '../api/uploadFinish';
import { uploadCancel } from '../api/uploadCancel';
import { MAX_CHUNK_SIZE } from '@homelab/contracts/constants';
import { ServerError } from '@homelab/contracts/types';

const MAX_CONCURRENT = 3;

const isActive = (status: UploadStatus) =>
  status === 'initiating' ||
  status === 'hashing' ||
  status === 'negotiating' ||
  status === 'uploading';

export function useUploadManager(shareToken: string | undefined) {
  const { items, addFiles, updateItem, removeItem, clear } = useUploadStore();

  function startUploads() {
    schedule();
  }

  function retryUploads() {
    const { items, updateItem } = useUploadStore.getState();

    items
      .filter((i) => i.status === 'failed')
      .forEach((i) => {
        updateItem(i.id, {
          status: 'pending',
          error: undefined,
          abortController: undefined,
        });
      });

    schedule();
  }

  function schedule() {
    const state = useUploadStore.getState();

    const pendingItems = state.items.filter((i) => i.status === 'pending');

    for (const item of pendingItems) {
      const latest = useUploadStore.getState();
      const running = latest.items.filter((i) => isActive(i.status)).length;

      if (running >= MAX_CONCURRENT) break;

      startUpload(item.id);
    }
  }

  async function startUpload(id: string) {
    const getItem = () =>
      useUploadStore.getState().items.find((i) => i.id === id);

    const isInterrupted = () => {
      const s = getItem()?.status;
      return s === 'paused' || s === 'canceled';
    };

    try {
      const item = getItem();
      if (!item || item.status !== 'pending') return;

      let { fileId, uploadId, chunks } = item;

      if (!fileId || !uploadId) {
        updateItem(id, { status: 'initiating' });
        const totalChunks = Math.ceil(item.file.size / MAX_CHUNK_SIZE);

        const initResult = await uploadInit(
          {
            name: item.file.name,
            mimeType: item.file.type,
            folderId: item.folderId,
            totalSize: item.file.size,
            totalChunks,
            shareToken,
          },
          id,
        );
        fileId = initResult.fileId;
        uploadId = initResult.uploadId;

        if (isInterrupted()) return;
        updateItem(id, { fileId, uploadId });
      }

      const totalChunks = Math.ceil(item.file.size / MAX_CHUNK_SIZE);
      if (!chunks || chunks.length < totalChunks) {
        updateItem(id, { status: 'hashing' });
        chunks = await hashChunks(item.file, id);
        if (isInterrupted()) return;
        updateItem(id, { chunks });
      }

      updateItem(id, { status: 'negotiating' });

      const { missingChunks } = await uploadChunkCheck({
        fileId: fileId!,
        uploadId: uploadId!,
        chunks: chunks!,
      });

      if (isInterrupted()) return;

      updateItem(id, { missingChunks, status: 'uploading' });

      await uploadMissingChunks(id);
      if (isInterrupted()) return;

      await uploadFinish({ uploadId: uploadId! });

      updateItem(id, { status: 'uploaded', progress: 1 });
    } catch (err: unknown) {
      if (
        (err instanceof Error && err.name === 'AbortError') ||
        axios.isCancel(err) ||
        isInterrupted()
      ) {
        return;
      }

      let errorMessage = 'Upload failed';

      if (axios.isAxiosError(err) && err.response?.data) {
        errorMessage = (err.response.data as ServerError).message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);

      updateItem(id, {
        status: 'failed',
        error: errorMessage,
      });
    } finally {
      schedule();
    }
  }

  async function uploadMissingChunks(id: string) {
    const getItem = () =>
      useUploadStore.getState().items.find((i) => i.id === id);

    const item = getItem();
    if (!item?.missingChunks || !item.chunks) return;

    const totalChunks = item.chunks.length;

    for (const index of item.missingChunks) {
      const current = getItem();
      if (current?.status !== 'uploading') break;

      // Re-calculate progress based on how many missing chunks remain
      const remainingMissing = current.missingChunks?.length ?? 0;

      const start = index * MAX_CHUNK_SIZE;
      const end = Math.min(start + MAX_CHUNK_SIZE, item.file.size);
      const blob = item.file.slice(start, end);

      const controller = new AbortController();
      updateItem(id, { abortController: controller });

      try {
        await uploadChunk(
          blob,
          {
            'upload-id': item.uploadId!,
            'file-id': item.fileId!,
            'chunk-index': index,
            'chunk-hash': item.chunks[index].hash,
          },
          controller.signal,
        );

        const nextItem = getItem();
        if (nextItem) {
          const nextMissing = (nextItem.missingChunks ?? []).filter(
            (m) => m !== index,
          );
          updateItem(id, {
            missingChunks: nextMissing,
            progress: (totalChunks - nextMissing.length) / totalChunks,
            abortController: undefined,
          });
        }
      } catch (err) {
        updateItem(id, { abortController: undefined });
        throw err;
      }
    }
  }

  async function hashChunks(file: File, id: string) {
    const getItem = () =>
      useUploadStore.getState().items.find((i) => i.id === id);

    const totalChunks = Math.ceil(file.size / MAX_CHUNK_SIZE);
    const item = getItem();
    const chunks = item?.chunks ? [...item.chunks] : [];

    for (let i = chunks.length; i < totalChunks; i++) {
      const current = getItem();
      if (current?.status !== 'hashing') break;

      const start = i * MAX_CHUNK_SIZE;
      const end = Math.min(start + MAX_CHUNK_SIZE, file.size);

      const buffer = await file.slice(start, end).arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);

      const hash = [...new Uint8Array(hashBuffer)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      chunks.push({ index: i, size: end - start, hash });

      // Update progress and chunks incrementally
      updateItem(id, {
        chunks: [...chunks],
        progress: chunks.length / totalChunks,
      });
    }

    return chunks;
  }

  function pauseUpload(id: string) {
    const item = useUploadStore.getState().items.find((i) => i.id === id);
    item?.abortController?.abort();
    updateItem(id, { status: 'paused', abortController: undefined });
    schedule();
  }

  function resumeUpload(id: string) {
    updateItem(id, { status: 'pending' });
    schedule();
  }

  async function cancelUpload(id: string) {
    const item = useUploadStore.getState().items.find((i) => i.id === id);

    item?.abortController?.abort();
    removeItem(id);

    if (item?.uploadId) {
      try {
        await uploadCancel({ uploadId: item.uploadId });
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.data) {
          toast.error(err.response.data);
          return;
        }

        toast.error('Cancel failed');
      }
    }

    schedule();
  }

  function retryUpload(id: string) {
    updateItem(id, { status: 'pending', error: undefined });
    schedule();
  }

  return {
    items,
    addFiles,
    startUploads,
    retryUploads,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    removeItem,
    clear,
  };
}
