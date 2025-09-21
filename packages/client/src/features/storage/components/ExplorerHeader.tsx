"use client";

import { Button } from "@client/components/ui/button";
import { Input } from "@client/components/ui/input";
import { ArrowLeft, ArrowRight } from "lucide-react";
import useDriveStore from "../stores/driveStore";
import { UseMutationResult } from "@tanstack/react-query";
import { ListDirectoryResponse } from "@shared/schemas/storage/response/folder.schema";

interface ExplorerHeaderProps {
  mutation: UseMutationResult<ListDirectoryResponse>;
}

const ExplorerHeader: React.FC<ExplorerHeaderProps> = ({ mutation }) => {
  const { path, moveBackward, moveForward, setPath } = useDriveStore();

  return (
    <div className="grid grid-flow-col">
      <div>
        <Button
          variant={"outline"}
          className="rounded-full"
          onClick={() => moveBackward()}
        >
          <ArrowLeft />
        </Button>
        <Button
          variant={"outline"}
          className="rounded-full"
          onClick={() => moveForward()}
        >
          <ArrowRight />
        </Button>
      </div>
      <Input
        type="text"
        value={path}
        className="w-min text-sm"
        onChange={(e) => setPath(e.target.value)}
        onKeyUp={(e) => {
          if (e.key == "Enter") {
            mutation.mutate({ path });
          }
        }}
      />
      <Button
        variant={"outline"}
        className="rounded-full"
        onClick={() => {
          mutation.mutate({ path });
        }}
      >
        Go
      </Button>
    </div>
  );
};

export default ExplorerHeader;
