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
import ShareDialog from "./ShareDialog";

interface FileSystemEntryProps {
  child: File | Folder;
  parentPath: string;
}

const FileSystemEntry: React.FC<FileSystemEntryProps> = memo(
  ({ child, parentPath }) => {
    const queryClient = useQueryClient();

    const [showPreview, setShowPreview] = useState(false);
    const [showRename, setShowRename] = useState(false);
    const [showShare, setShowShare] = useState(false);

    const { selectedItems, isSelected, onSelect, selectItem } = useSelect();

    const viewContext = useDriveStore((s) => s.viewContext);
    const setClipboard = useDriveStore((s) => s.setClipboard);
    const deselectAll = useDriveStore((s) => s.deselectAll);
    const navigate = useDriveStore((s) => s.navigate);
    const viewMode = useDriveStore((s) => s.viewMode);
    const shareToken = useDriveStore((s) => s.shareToken);

    const folder = isFolder(child);
    const selected = isSelected(child);
    const isGrid = viewMode === "grid";

    const canWrite = true;
    const canShare = true;
    const canCopy = true;
    const canDelete = true;
    const canRead = true;

    const thumbnailUrl = `${env.API_URL}/storage/file/thumbnail/${child.userId}/${child.id}`;

    const entryItem = {
      id: child.id,
      type: folder ? "folder" : ("file" as "folder" | "file"),
    };

    const lp = useLongPress<HTMLDivElement>((x, y) => {
      const el = document.elementFromPoint(x, y);
      el?.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          clientX: x,
          clientY: y,
        }),
      );
    });

    const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
      e.stopPropagation();
      lp.onTouchStart(e);
    };
    const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
      e.stopPropagation();
      lp.onTouchEnd(e);
    };
    const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
      e.stopPropagation();
      lp.onTouchMove(e);
    };

    /* ---------- Click logic ---------- */

    const clickHandler = useCallback(() => {
      if (selectedItems.length > 0) {
        onSelect(child);
        return;
      }

      if (folder) navigate(child.fullPath, { ownerId: child.userId });
      else setShowPreview(true);
    }, [selectedItems.length, child, folder, navigate, onSelect]);

    const doubleClickHandler = useCallback(() => {
      if (folder) navigate(child.fullPath, { ownerId: child.userId });
      else setShowPreview(true);
    }, [child, folder, navigate]);

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
            invalidateQueries(queryClient, [
              ["drive", viewContext, parentPath],
              ["stats"],
            ]),
          () =>
            invalidateQueries(queryClient, [
              ["drive", viewContext, parentPath],
              ["stats"],
            ]),
        ),
      onError: (err) => toast.error(err),
    });

    const downloadHandler = () => {
      downloadMutation.mutate({
        items: selected ? selectedItems : [entryItem],
        shareToken,
      });
      deselectAll();
    };

    const deleteHandler = () => {
      deleteMutation.mutate({
        items: selected ? selectedItems : [entryItem],
        shareToken,
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
        onContextMenu={(e) => e.stopPropagation()}
        className={cx(
          "relative group",
          "flex flex-col items-center justify-start",
          "gap-3 p-4 w-[120px] md:w-[140px]",
          "rounded-2xl cursor-pointer select-none",
          "transition-all duration-300 ease-out",
          "hover:bg-muted/80 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
          selected && "bg-primary/10 shadow-inner ring-1 ring-primary/20",
        )}
      >
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          {selected ? (
            <IoCheckmarkCircle className="text-primary bg-background rounded-full" size={20} />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-primary/20 bg-background/50 backdrop-blur-sm" />
          )}
        </div>

        <div className={cx(
          "flex items-center justify-center h-[80px] w-full rounded-xl transition-all duration-300",
          (folder || !(child as File).hasThumbnail) && "bg-muted/30 group-hover:bg-primary/5",
          selected && "bg-primary/5"
        )}>
          {folder ? (
            <div className="relative">
              <FaFolder size={56} className="text-yellow-400 drop-shadow-md" />
              <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 to-transparent rounded-lg" />
            </div>
          ) : child.hasThumbnail ? (
            <div className="relative group/thumb">
              <Image
                unoptimized
                width={80}
                height={80}
                src={thumbnailUrl}
                alt={child.name}
                className="object-cover rounded-xl h-[80px] w-[80px] shadow-sm transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl" />
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
              <FaFile size={32} />
            </div>
          )}
        </div>

        <p className={cx(
          "text-xs md:text-sm font-semibold text-center leading-tight line-clamp-2 break-words transition-colors px-1",
          selected ? "text-primary" : "text-foreground/80 group-hover:text-foreground"
        )}>
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
        onContextMenu={(e) => e.stopPropagation()}
        className={cx(
          "relative grid grid-cols-[40px_1fr] sm:grid-cols-[48px_1fr_100px_140px] items-center",
          "px-3 py-2 sm:px-4 sm:py-3 gap-3 sm:gap-4 rounded-xl cursor-pointer select-none",
          "transition-all duration-200",
          "hover:bg-muted/80 hover:shadow-sm",
          selected && "bg-primary/5 ring-1 ring-inset ring-primary/10",
        )}
      >
        <div className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-muted/30 group-hover:bg-primary/5 transition-colors">
          {folder ? (
            <FaFolder size={22} className="text-yellow-400" />
          ) : child.hasThumbnail ? (
            <div className="relative h-8 w-8">
              <Image
                unoptimized
                width={32}
                height={32}
                src={thumbnailUrl}
                alt={child.name}
                className="h-full w-full object-cover rounded-md shadow-sm"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-md" />
            </div>
          ) : (
            <FaFile size={20} className="text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <p className={cx(
            "truncate text-sm font-bold tracking-tight",
            selected ? "text-primary" : "text-foreground"
          )}>{child.name}</p>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium sm:hidden">
            {folder ? 'Folder' : size}
          </span>
        </div>

        <span className="hidden sm:block text-sm font-medium text-muted-foreground text-right">{size}</span>

        <span className="hidden sm:block text-sm font-medium text-muted-foreground text-right">
          {modified}
        </span>

        {selected && (
          <div className="absolute right-4 flex items-center h-full">
            <IoCheckmarkCircle size={20} className="text-primary bg-background rounded-full" />
          </div>
        )}
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
            <ContextMenuItem
              onClick={() => setShowRename(true)}
              disabled={!canWrite}
            >
              Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={() => selectItem(child)}>
              Select
            </ContextMenuItem>
            <ContextMenuItem onClick={copyHandler} disabled={!canCopy}>
              Copy
            </ContextMenuItem>
            <ContextMenuItem onClick={cutHandler} disabled={!canWrite}>
              Cut
            </ContextMenuItem>
            <ContextMenuItem onClick={downloadHandler} disabled={!canRead}>
              Download
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => setShowShare(true)}
              disabled={!canShare}
            >
              Share
            </ContextMenuItem>
            <ContextMenuItem onClick={deleteHandler} disabled={!canDelete}>
              Delete
            </ContextMenuItem>
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

        <ShareDialog open={showShare} setOpen={setShowShare} item={child} />

        {!folder && (
          <Preview open={showPreview} setOpen={setShowPreview} file={child} />
        )}
      </>
    );
  },
);

FileSystemEntry.displayName = "FileSystemEntry";

export default FileSystemEntry;
