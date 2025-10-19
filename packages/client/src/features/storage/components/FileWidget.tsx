"use client";

import { FaFile } from "react-icons/fa6";
import { File } from "../types/storage.types";
import Image from "next/image";
import { useState } from "react";
import Preview from "./Preview";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@client/components/ui/context-menu";
import { useDownloadFile } from "../hooks/useDownloadFile";
import Rename from "./Rename";
import { cx } from "class-variance-authority";
import { useSelect } from "../hooks/useSelect";

interface FileProps {
  child: File;
}

const FileWidget: React.FC<FileProps> = ({ child }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const { selectedItems, isSelected, onSelect, selectItem } = useSelect();

  const thumbnailUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${child.userId}/thumbnails/${child.id}.webp`;

  const downloadMutation = useDownloadFile({
    onSuccess: (blob) => {
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = child.name;
      document.body.appendChild(link);

      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    },
    onError: (error) => {},
  });

  const clickHandler = () => {
    if (selectedItems.length == 0) {
      setShowPreview(true);
      return;
    }

    onSelect(child);
  };


  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cx(
              "p-4 w-20 flex flex-col items-center justify-start gap-2",
              isSelected(child) && "bg-blue-400 rounded"
            )}
            onClick={clickHandler}
          >
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

            <p className="text-sm truncate w-full text-center">{child.name}</p>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={() => downloadMutation.mutate(child.id)}>
            Download
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setShowRename(true)}>
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => selectItem(child)}>
            Select
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Preview open={showPreview} setOpen={setShowPreview} file={child} />
      <Rename open={showRename} setOpen={setShowRename} file={child} />
    </div>
  );
};

export default FileWidget;
