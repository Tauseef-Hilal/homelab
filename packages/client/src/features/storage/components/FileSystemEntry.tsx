"use client";

import { FaFile, FaFolder } from "react-icons/fa6";
import { File, Folder } from "../types/storage.types";
import Image from "next/image";
import { useState } from "react";
import Preview from "./Preview";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@client/components/ui/context-menu";
import { cx } from "class-variance-authority";
import { useSelect } from "../hooks/useSelect";
import { isFolder } from "@client/lib/utils";
import useDriveStore from "../stores/driveStore";

interface FileSystemEntryProps {
  child: File | Folder;
}

const FileSystemEntry: React.FC<FileSystemEntryProps> = ({ child }) => {
  const [showPreview, setShowPreview] = useState(false);
  // const [showRename, setShowRename] = useState(false);
  const { selectedItems, isSelected, onSelect, selectItem } = useSelect();
  const { setPath, setClipboard, deselectAll } = useDriveStore();

  const thumbnailUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${child.userId}/thumbnails/${child.id}.webp`;

  const clickHandler = () => {
    if (selectedItems.length > 0) {
      onSelect(child);
      return;
    }

    if (isFolder(child)) {
      setPath(child.fullPath);
    } else {
      setShowPreview(true);
    }
  };

  const copyHandler = () => {
    if (selectedItems.length > 0) {
      setClipboard(selectedItems);
      return deselectAll();
    }

    setClipboard([{ id: child.id, type: isFolder(child) ? "folder" : "file" }]);
    deselectAll();
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            key={child.id}
            onClick={clickHandler}
            className={cx(
              "p-4 w-20 flex flex-col items-center justify-start gap-2",
              isSelected(child) && "bg-blue-400 rounded"
            )}
          >
            {isFolder(child) ? (
              <>
                <FaFolder size={56} className="text-yellow-400" />
                <p className="text-sm truncate w-full text-center">
                  {child.name}
                </p>
              </>
            ) : (
              <>
                {child.hasThumbnail ? (
                  <Image
                    width={56}
                    height={56}
                    src={thumbnailUrl}
                    alt="Thumbnail"
                    className="object-cover h-[56px] w-[56px] rounded"
                  />
                ) : (
                  <FaFile size={56} className="text-neutral-200" />
                )}

                <p className="text-sm truncate w-full text-center">
                  {child.name}
                </p>
              </>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={() => {}}>Download</ContextMenuItem>
          {/* <ContextMenuItem onClick={() => setShowRename(true)}>
            Rename
          </ContextMenuItem> */}
          <ContextMenuItem onClick={() => selectItem(child)}>
            Select
          </ContextMenuItem>
          <ContextMenuItem onClick={copyHandler}>Copy</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* <Rename open={showRename} setOpen={setShowRename} item={child} /> */}

      {!isFolder(child) && (
        <Preview open={showPreview} setOpen={setShowPreview} file={child} />
      )}
    </div>
  );
};

export default FileSystemEntry;
