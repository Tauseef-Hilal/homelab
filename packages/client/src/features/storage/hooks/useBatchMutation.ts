'use client';

import { useState, useCallback } from 'react';

export type UseBatchMutationOptions<Input, Output> = {
  mutationFn: (input: Input) => Promise<Output>;
  onProgress?: (data: Output, idx: number, progress: number) => void;
  onSuccess?: () => void;
  onError?: () => void;
  delay?: number;
};

export function useBatchMutation<Input, Output>({
  mutationFn,
  onProgress,
  onSuccess,
  onError,
  delay = 50,
}: UseBatchMutationOptions<Input, Output>) {
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState<Input[]>([]);
  const [isPending, setIsProcessing] = useState(false);

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const processInputs = useCallback(
    async (inputs: Input[], initialProgress = 0) => {
      if (!inputs.length) return [];

      setIsProcessing(true);

      const total = inputs.length;
      const failedInputs: Input[] = [];
      let completed = 0;

      await Promise.allSettled(
        inputs.map(async (input, index) => {
          try {
            const data = await mutationFn(input);
            completed++;

            const progressPercent =
              initialProgress + (completed / total) * (100 - initialProgress);

            if (onProgress) {
              onProgress(data, index, progressPercent);
            }

            setProgress(progressPercent);
            if (delay) await sleep(delay);
          } catch {
            failedInputs.push(input);
          }
        })
      );

      if (failedInputs.length > 0) {
        onError?.call(null);
      } else {
        onSuccess?.call(null);
      }

      setFailed(failedInputs);
      setIsProcessing(false);

      return failedInputs;
    },
    [mutationFn, onProgress, onSuccess, onError, delay]
  );

  const mutate = useCallback(
    async (inputs: Input[]) => {
      if (!inputs.length) return;

      setProgress(0);
      await processInputs(inputs, 0);
    },
    [processInputs]
  );

  const retry = useCallback(async () => {
    if (!failed.length) return;

    await processInputs(failed, progress);
  }, [failed, progress, processInputs]);

  return { mutate, retry, progress, failed, setFailed, isPending };
}
