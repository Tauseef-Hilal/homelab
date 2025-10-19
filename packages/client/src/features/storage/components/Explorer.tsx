"use client";

import { useEffect } from "react";
import { UseQueryResult } from "@tanstack/react-query";
import { useListDirectory } from "../hooks/useListDirectory";
import useDriveStore from "../stores/driveStore";
import ExplorerContent from "./ExplorerContent";
import ExplorerHeader from "./ExplorerHeader";
import { Button } from "@client/components/ui/button";
import { ListDirectoryResponse } from "@shared/schemas/storage/response/folder.schema";

const Explorer: React.FC = () => {
  const { path, push, stack, stackIdx, selectedItems, deselectAll } =
    useDriveStore();
  const query = useListDirectory(path, true);

  useEffect(() => {
    if (!query.data) return;

    const currFolder = stack[stackIdx];
    const newFolder = query.data.folder;

    if (!currFolder || currFolder.id != newFolder.id) {
      push(query.data.folder);
    }
  }, [query.data]);

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

      <ExplorerContent
        listQuery={query as UseQueryResult<ListDirectoryResponse>}
      />
    </div>
  );
};

export default Explorer;
