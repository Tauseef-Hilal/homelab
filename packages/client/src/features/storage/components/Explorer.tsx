"use client";

import { UseMutationResult } from "@tanstack/react-query";
import { useListDirectory } from "../hooks/useListDirectory";
import useDriveStore from "../stores/driveStore";
import ExplorerContent from "./ExplorerContent";
import ExplorerHeader from "./ExplorerHeader";
import { ListDirectoryResponse } from "@shared/schemas/storage/response/folder.schema";

const Explorer: React.FC = () => {
  const { push } = useDriveStore();
  const mutation = useListDirectory({
    onError: (err) => {},
    onSuccess: (data) => push(data.folder),
  });

  return (
    <div className="p-4 h-full">
      <ExplorerHeader
        mutation={mutation as UseMutationResult<ListDirectoryResponse>}
      />
      <ExplorerContent
        mutation={mutation as UseMutationResult<ListDirectoryResponse>}
      />
    </div>
  );
};

export default Explorer;
