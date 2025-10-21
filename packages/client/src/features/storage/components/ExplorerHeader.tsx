"use client";

import { Button } from "@client/components/ui/button";
import { Input } from "@client/components/ui/input";
import { ArrowLeft, ArrowRight } from "lucide-react";
import useDriveStore from "../stores/driveStore";
import { useEffect } from "react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

interface ExplorerHeaderProps {}

const ExplorerHeader: React.FC<ExplorerHeaderProps> = ({}) => {
  const { inputPath, setInputPath, moveBackward, moveForward, setPath } =
    useDriveStore();
  const debouncedPath = useDebouncedValue(inputPath, 1000);

  useEffect(() => {
    setPath(debouncedPath);
  }, [debouncedPath]);

  return (
    <div className="flex gap-4">
      <div className="flex gap-1">
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
        value={inputPath}
        className="w-full text-sm"
        onChange={(e) => {
          setInputPath(e.target.value);
        }}
      />
    </div>
  );
};

export default ExplorerHeader;
