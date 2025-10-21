"use client";

import useDriveStore from "../stores/driveStore";
import ExplorerContent from "./ExplorerContent";
import ExplorerHeader from "./ExplorerHeader";
import { Button } from "@client/components/ui/button";

const Explorer: React.FC = () => {
  const { selectedItems, deselectAll } =
    useDriveStore();
  

  return (
    <div className="p-4 h-full">
      {selectedItems.length == 0 ? (
        <ExplorerHeader />
      ) : (
        <div className="flex justify-between items-center">
          <Button variant={"outline"} onClick={deselectAll}>
            Cancel
          </Button>{" "}
          <p>{selectedItems.length} items selected</p>
        </div>
      )}

      <ExplorerContent />
    </div>
  );
};

export default Explorer;
