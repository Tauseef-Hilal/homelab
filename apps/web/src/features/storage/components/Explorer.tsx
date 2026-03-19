"use client";

import useDriveStore from "../stores/drive.store";
import ExplorerContent from "./ExplorerContent";
import ExplorerHeader from "./ExplorerHeader";
import { Button } from "@client/components/ui/button";
import { XIcon } from "lucide-react";

const Explorer: React.FC = () => {
  const selectedCount = useDriveStore((s) => s.selectedItems.length);
  const deselectAll = useDriveStore((s) => s.deselectAll);

  const hasSelection = selectedCount > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="p-3 border-b bg-background/60 backdrop-blur flex items-center justify-between transition-all">
        {!hasSelection ? (
          <ExplorerHeader />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={deselectAll}
                className="rounded-md"
              >
                <XIcon size={18} />
              </Button>

              <p className="text-sm font-medium">
                {selectedCount} item{selectedCount > 1 && "s"} selected
              </p>
            </div>

            {/* Future bulk actions area */}
            <div className="flex items-center gap-2">
              {/* Example placeholder */}
              {/* <Button size="sm" variant="outline">Delete</Button> */}
            </div>
          </>
        )}
      </div>

      {/* Explorer content */}
      <div className="flex-1 overflow-hidden p-4">
        <ExplorerContent />
      </div>
    </div>
  );
};

export default Explorer;
