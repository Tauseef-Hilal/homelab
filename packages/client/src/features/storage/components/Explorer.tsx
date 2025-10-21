"use client";

import useDriveStore from "../stores/driveStore";
import ExplorerContent from "./ExplorerContent";
import ExplorerHeader from "./ExplorerHeader";
import { Button } from "@client/components/ui/button";

const Explorer: React.FC = () => {
  const { selectedItems, selectAll, deselectAll } = useDriveStore();

  return (
    <div className="p-4 h-full flex flex-col gap-2">
      {selectedItems.length == 0 ? (
        <ExplorerHeader />
      ) : (
        <div className="flex justify-between items-center">
          <div>
            <Button variant={"outline"} onClick={deselectAll}>
              Cancel
            </Button>{" "}
            <Button variant={"outline"} onClick={selectAll}>
              Select All
            </Button>{" "}
          </div>
          <p>{selectedItems.length} items selected</p>
        </div>
      )}

      <ExplorerContent />
    </div>
  );
};

export default Explorer;
