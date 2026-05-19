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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@client/components/ui/dropdown-menu";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  PenIcon,
  CheckSquareIcon,
  CopyIcon,
  ScissorsIcon,
  DownloadIcon,
  Share2Icon,
  Trash2Icon,
} from "lucide-react";

import { useSelect } from "../hooks/useSelect";
import {
  formatSize,
  invalidateQueries,
  isFolder,
  pollJobData,
} from "@client/lib/utils";
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
        onClick={clickHandler}
        onDoubleClick={doubleClickHandler}
        onContextMenu={(e) => e.stopPropagation()}
        className={cx(
          "relative group",
          "flex flex-col items-center justify-start",
          "w-[140px] md:w-[160px]",
          "bg-muted/30 hover:bg-muted/50",
          "rounded-2xl cursor-pointer select-none overflow-hidden",
          "transition-all duration-300 ease-out",
          "border border-border/40 hover:border-border/80",
          "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
          selected && "bg-primary/10 border-primary/30 shadow-md ring-1 ring-primary/20",
        )}
      >
        {/* Absolute Selection Checkmark */}
        {selected && (
          <div className="absolute top-2 right-2 z-20 animate-in fade-in zoom-in duration-200">
            <IoCheckmarkCircle className="text-primary bg-background rounded-full drop-shadow-sm" size={20} />
          </div>
        )}

        {/* Thumbnail/Icon Container */}
        <div className={cx(
          "relative flex items-center justify-center h-[100px] md:h-[120px] w-full transition-all duration-300 overflow-hidden",
          folder ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/5 dark:from-yellow-500/20 dark:to-orange-500/10 group-hover:from-yellow-500/20 group-hover:to-orange-500/10 dark:group-hover:from-yellow-500/30 dark:group-hover:to-orange-500/20" :
          child.hasThumbnail ? "bg-transparent" :
          "bg-gradient-to-br from-muted/30 to-muted/10 group-hover:from-muted/50 group-hover:to-muted/20",
          selected && "ring-1 ring-primary/30 ring-inset"
        )}>
          {folder ? (
            <div className="relative group-hover:scale-110 transition-transform duration-500 ease-out">
              <FaFolder size={64} className="text-yellow-400 drop-shadow-md" />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 dark:from-white/5 to-transparent mix-blend-overlay" />
            </div>
          ) : child.hasThumbnail ? (
            <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out">
              <Image
                unoptimized
                fill
                src={thumbnailUrl}
                alt={child.name}
                className="object-cover"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5" />
            </div>
          ) : (
            <div className="text-muted-foreground/60 group-hover:text-primary/70 transition-colors duration-500 group-hover:scale-110">
              <FaFile size={44} className="drop-shadow-sm" />
            </div>
          )}
        </div>

        {/* Bottom Segment (Unified & Premium) */}
        <div className="flex flex-row items-center justify-between w-full h-[46px] px-3 bg-muted/40 group-hover:bg-muted/60 transition-colors">
          <div className="flex items-center flex-1 min-w-0 pr-2">
            <p className={cx(
              "text-[13px] md:text-sm font-medium truncate transition-colors w-full",
              selected ? "text-primary font-semibold" : "text-foreground/80 group-hover:text-foreground"
            )} title={child.name}>
              {child.name}
            </p>
          </div>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-background/80 dark:hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all shrink-0 hover:shadow-sm">
              <BsThreeDotsVertical size={14} />
            </button>
          </DropdownMenuTrigger>
        </div>
      </div>
    );

    /* ================================================= */
    /* ================= LIST VIEW ===================== */
    /* ================================================= */

    const listView = (
      <div
        onClick={clickHandler}
        onDoubleClick={doubleClickHandler}
        onContextMenu={(e) => e.stopPropagation()}
        className={cx(
          "relative grid grid-cols-[40px_1fr_32px] sm:grid-cols-[48px_1fr_100px_140px_32px] items-center",
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
            "truncate text-base tracking-tight",
            selected ? "text-primary" : "text-foreground"
          )}>{child.name}</p>
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium sm:hidden">
            {folder ? 'Folder' : size}
          </span>
        </div>

        <span className="hidden sm:block text-base font-medium text-muted-foreground text-right">{size}</span>

        <span className="hidden sm:block text-base font-medium text-muted-foreground text-right">
          {modified}
        </span>

        <div className="flex items-center justify-end">
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="flex items-center justify-center p-1.5 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <BsThreeDotsVertical size={16} />
            </button>
          </DropdownMenuTrigger>
        </div>

        {selected && (
          <div className="absolute right-10 sm:right-12 flex items-center h-full">
            <IoCheckmarkCircle size={20} className="text-primary bg-background rounded-full" />
          </div>
        )}
      </div>
    );

    /* ================================================= */

    return (
      <>
        <DropdownMenu>
          {isGrid ? gridView : listView}

          <DropdownMenuContent className="w-48">
            <DropdownMenuItem
              onClick={() => setShowRename(true)}
              disabled={!canWrite}
            >
              <PenIcon size={16} className="mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => selectItem(child)}>
              <CheckSquareIcon size={16} className="mr-2" />
              Select
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyHandler} disabled={!canCopy}>
              <CopyIcon size={16} className="mr-2" />
              Copy
            </DropdownMenuItem>
            <DropdownMenuItem onClick={cutHandler} disabled={!canWrite}>
              <ScissorsIcon size={16} className="mr-2" />
              Cut
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadHandler} disabled={!canRead}>
              <DownloadIcon size={16} className="mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowShare(true)}
              disabled={!canShare}
            >
              <Share2Icon size={16} className="mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={deleteHandler} disabled={!canDelete}>
              <Trash2Icon size={16} className="mr-2 text-destructive" />
              <span className="text-destructive">Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
