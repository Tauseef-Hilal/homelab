"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@client/components/ui/dialog";
import { Button } from "@client/components/ui/button";
import { Input } from "@client/components/ui/input";
import { Progress } from "@client/components/ui/progress";
import { Upload, X, Pause, Play, RotateCcw, Check } from "lucide-react";
import { useEffect, useRef } from "react";
import { useUploadManager } from "../hooks/useUploadManager";
import { useQueryClient } from "@tanstack/react-query";

interface UploadDialogProps {
  folderId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  folderPath: string;
}

export default function UploadDialog({
  folderId,
  open,
  setOpen,
  folderPath,
}: UploadDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    items,
    addFiles,
    startUploads,
    retryUploads,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    clear,
  } = useUploadManager();

  // Check if there are any files currently in a "working" state
  const isProcessing = items.some((i) =>
    ["initiating", "hashing", "negotiating", "uploading"].includes(i.status),
  );

  const finished = items.every((i) =>
    ["uploaded", "failed", "canceled"].includes(i.status),
  );

  const failed = items.some((i) => i.status === "failed");

  useEffect(() => {
    if (finished) {
      queryClient.invalidateQueries({
        queryKey: ["stats"],
      });
      queryClient.invalidateQueries({
        queryKey: ["list", folderPath],
      });
    }
  }, [finished, folderId, queryClient]); // Added missing dependencies

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles([...e.target.files], folderId);
      // Reset value so the same file can be picked again if removed
      e.target.value = "";
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open && !isProcessing) {
          clear();
        }

        setOpen(open);
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();

            if (failed) {
              retryUploads();
              return;
            }

            startUploads();
          }}
        >
          <label className="flex flex-col items-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted transition-colors">
            <Upload size={28} className="mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click or drag files</p>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {items.length > 0 && (
            <div className="space-y-2 max-h-52 overflow-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border rounded px-3 py-2 space-y-2"
                >
                  <div className="flex justify-between items-center text-sm">
                    <span className="truncate font-medium max-w-[70%]">
                      {item.file.name}
                    </span>

                    <div className="flex gap-2">
                      {item.status === "uploading" && (
                        <button
                          type="button"
                          onClick={() => pauseUpload(item.id)}
                        >
                          <Pause size={14} className="hover:text-primary" />
                        </button>
                      )}
                      {item.status === "paused" && (
                        <button
                          type="button"
                          onClick={() => resumeUpload(item.id)}
                        >
                          <Play size={14} className="hover:text-primary" />
                        </button>
                      )}
                      {item.status === "failed" && (
                        <button
                          type="button"
                          onClick={() => retryUpload(item.id)}
                        >
                          <RotateCcw size={14} className="hover:text-primary" />
                        </button>
                      )}
                      {item.status === "uploaded" ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => cancelUpload(item.id)}
                        >
                          <X size={14} className="hover:text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>

                  {["initiating", "hashing", "negotiating"].includes(
                    item.status,
                  ) && <Progress value={undefined} className="h-1" />}

                  {["uploading", "paused"].includes(item.status) && (
                    <Progress value={item.progress * 100} className="h-1" />
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isProcessing} className="w-full">
              {isProcessing
                ? "Uploading..."
                : failed
                  ? "Retry failed"
                  : "Start upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
