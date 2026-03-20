"use client";

import Image from "next/image";
import { memo, useState, useCallback } from "react";
import { cx } from "class-variance-authority";
import { FaFile, FaFolder } from "react-icons/fa6";
import { IoCheckmarkCircle } from "react-icons/io5";

import { File, Folder } from "../types/storage.types";
import Preview from "./Preview";
import Rename from "./Rename";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@client/components/ui/context-menu";

import { useSelect } from "../hooks/useSelect";
import {
  formatSize,
  invalidateQueries,
  isFolder,
  pollJobData,
} from "@client/lib/utils";
import { useLongPress } from "@client/hooks/useLongPress";
import { env } from "@client/config/env";

import useDriveStore from "../stores/drive.store";
import { useDownloadItems } from "../hooks/useDownloadItems";
import { useDeleteItems } from "../hooks/useDeleteItems";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface FileSystemEntryProps {
  child: File | Folder;
  parentPath: string;
}

const FileSystemEntry: React.FC<FileSystemEntryProps> = memo(
  ({ child, parentPath }) => {
    const queryClient = useQueryClient();

    const [showPreview, setShowPreview] = useState(false);
    const [showRename, setShowRename] = useState(false);

    const { selectedItems, isSelected, onSelect, selectItem } = useSelect();

    const setClipboard = useDriveStore((s) => s.setClipboard);
    const deselectAll = useDriveStore((s) => s.deselectAll);
    const navigate = useDriveStore((s) => s.navigate);
    const viewMode = useDriveStore((s) => s.viewMode);

    const folder = isFolder(child);
    const selected = isSelected(child);
    const isGrid = viewMode === "grid";

    const thumbnailUrl = `${env.API_URL}/storage/file/thumbnail/${child.userId}/${child.id}`;

    const entryItem = {
      id: child.id,
      type: folder ? "folder" : ("file" as "folder" | "file"),
    };

    const { onTouchStart, onTouchEnd, onTouchMove } =
      useLongPress<HTMLDivElement>((x, y) => {
        const el = document.elementFromPoint(x, y);
        el?.dispatchEvent(
          new MouseEvent("contextmenu", {
            bubbles: true,
            clientX: x,
            clientY: y,
          }),
        );
      });

    /* ---------- Click logic ---------- */

    const clickHandler = useCallback(() => {
      if (selectedItems.length > 0) {
        onSelect(child);
        return;
      }

      if (folder) navigate(child.fullPath);
      else setShowPreview(true);
    }, [selectedItems.length, child, folder]);

    const doubleClickHandler = useCallback(() => {
      if (folder) navigate(child.fullPath);
      else setShowPreview(true);
    }, [child, folder]);

    /* ---------- Clipboard ---------- */

    const copyHandler = () => {
      setClipboard({
        type: "copy",
        items: selected ? selectedItems : [entryItem],
      });
      deselectAll();
    };

    const cutHandler = () => {
      setClipboard({
        type: "move",
        items: selected ? selectedItems : [entryItem],
      });
      deselectAll();
    };

    /* ---------- Download/Delete ---------- */

    const downloadZip = (url: string) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = "download.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const downloadMutation = useDownloadItems({
      onSuccess: (data) =>
        pollJobData(
          data.job.id,
          {
            processing: "Zipping files for download",
            completed: "Starting download",
            failed: "Failed to copy files",
          },
          (result) => {
            if (result) {
              downloadZip((result as { downloadLink: string }).downloadLink);
            }
          },
        ),
      onError: (err) => toast.error(err),
    });

    const deleteMutation = useDeleteItems({
      onSuccess: (data) =>
        pollJobData(
          data.job.id,
          {
            processing: "Deleting files",
            completed: "Files deleted successfully",
            failed: "Failed to copy files",
          },
          () =>
            invalidateQueries(queryClient, [["list", parentPath], ["stats"]]),
          () =>
            invalidateQueries(queryClient, [["list", parentPath], ["stats"]]),
        ),
      onError: (err) => toast.error(err),
    });

    const downloadHandler = () => {
      downloadMutation.mutate({
        items: selected ? selectedItems : [entryItem],
      });
      deselectAll();
    };

    const deleteHandler = () => {
      deleteMutation.mutate({
        items: selected ? selectedItems : [entryItem],
      });
      deselectAll();
    };

    /* ---------- Helpers ---------- */

    const size =
      !folder && "size" in child && child.size ? formatSize(child.size) : "-";

    const modified =
      "updatedAt" in child
        ? new Date(child.updatedAt).toLocaleDateString()
        : "-";

    /* ================================================= */
    /* ================= GRID VIEW ===================== */
    /* ================================================= */

    const gridView = (
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
        onClick={clickHandler}
        onDoubleClick={doubleClickHandler}
        className={cx(
          "relative group",
          "flex flex-col items-center justify-start",
          "gap-2 p-3 w-[110px]",
          "rounded-lg cursor-pointer",
          "transition-colors",
          "hover:bg-muted",
          selected && "bg-primary/10",
        )}
      >
        {selected && (
          <IoCheckmarkCircle
            className="absolute top-1 right-1 text-primary"
            size={18}
          />
        )}

        <div className="flex items-center justify-center h-[60px]">
          {folder ? (
            <FaFolder size={50} className="text-yellow-400" />
          ) : child.hasThumbnail ? (
            <Image
              unoptimized
              width={60}
              height={60}
              src={thumbnailUrl}
              alt={child.name}
              className="object-cover rounded-md h-[60px] w-[60px]"
            />
          ) : (
            <FaFile size={50} className="text-muted-foreground" />
          )}
        </div>

        <p className="text-xs text-center leading-tight line-clamp-2 break-words">
          {child.name}
        </p>
      </div>
    );

    /* ================================================= */
    /* ================= LIST VIEW ===================== */
    /* ================================================= */

    const listView = (
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
        onClick={clickHandler}
        onDoubleClick={doubleClickHandler}
        className={cx(
          "relative grid grid-cols-[auto_1fr_120px_160px] items-center",
          "px-3 py-2 gap-3 rounded-md cursor-pointer",
          "hover:bg-muted/60",
          selected && "bg-primary/10",
        )}
      >
        {selected && (
          <IoCheckmarkCircle
            size={18}
            className="absolute right-3 text-primary"
          />
        )}

        <div className="flex items-center justify-center">
          {folder ? (
            <FaFolder size={20} className="text-yellow-400" />
          ) : child.hasThumbnail ? (
            <Image
              unoptimized
              width={28}
              height={28}
              src={thumbnailUrl}
              alt={child.name}
              className="h-[28px] object-cover rounded-md"
            />
          ) : (
            <FaFile size={20} className="text-muted-foreground" />
          )}
        </div>

        <p className="truncate text-sm font-medium">{child.name}</p>

        <span className="text-sm text-muted-foreground text-right">{size}</span>

        <span className="text-sm text-muted-foreground text-right">
          {modified}
        </span>
      </div>
    );

    /* ================================================= */

    return (
      <>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {isGrid ? gridView : listView}
          </ContextMenuTrigger>

          <ContextMenuContent>
            <ContextMenuItem onClick={() => setShowRename(true)}>
              Rename
            </ContextMenuItem>

            <ContextMenuItem onClick={() => selectItem(child)}>
              Select
            </ContextMenuItem>

            <ContextMenuItem onClick={copyHandler}>Copy</ContextMenuItem>

            <ContextMenuItem onClick={cutHandler}>Cut</ContextMenuItem>

            <ContextMenuItem onClick={downloadHandler}>
              Download
            </ContextMenuItem>

            <ContextMenuItem onClick={deleteHandler}>Delete</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        <Rename
          open={showRename}
          setOpen={setShowRename}
          item={child}
          parentPath={child.fullPath.substring(
            0,
            child.fullPath.lastIndexOf("/"),
          )}
        />

        {!folder && (
          <Preview open={showPreview} setOpen={setShowPreview} file={child} />
        )}
      </>
    );
  },
);

FileSystemEntry.displayName = "FileSystemEntry";

export default FileSystemEntry;
