"use client";

import { File } from "../types/storage.types";
import Image from "next/image";
import { cx } from "class-variance-authority";
import { IoIosCheckmarkCircle, IoIosCloseCircle } from "react-icons/io";
import { FaFile } from "react-icons/fa6";
import { Input } from "@client/components/ui/input";
import { useState } from "react";
import { useMoveFile } from "../hooks/useMoveFile";
import { useForm } from "react-hook-form";
import {
  MoveFileInput,
  moveFileSchema,
} from "@shared/schemas/storage/request/file.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@client/components/ui/button";
import useDriveStore from "../stores/driveStore";
import { toast } from "sonner";

interface RenameProps {
  file: File;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Rename: React.FC<RenameProps> = ({ file, open, setOpen }) => {
  const { renameFile } = useDriveStore();
  const ext = file.name.split(".").at(-1);
  const [name, setName] = useState(file.name.replace(`.${ext}`, ""));
  const thumbnailUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${file.userId}/thumbnails/${file.id}.webp`;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MoveFileInput>({
    resolver: zodResolver(moveFileSchema),
  });

  const mutation = useMoveFile(file.id, {
    onSuccess: () => {
      renameFile(file.id, `${name}.${ext}`);
      setOpen(false);
    },
    onError: (err) => {
      toast(err);
    },
  });

  const onSubmit = (data: MoveFileInput) => mutation.mutate(data);

  return (
    <div
      style={{ display: open ? "flex" : "none" }}
      className={cx(
        "fixed z-10 w-full h-full top-0 left-0",
        "justify-center items-center",
        "bg-black/70 backdrop-blur-xs"
      )}
    >
      <div className="fixed z-20 w-full h-full top-0 left-0 flex flex-col items-center justify-center gap-4">
        {file.hasThumbnail ? (
          <Image
            width={150}
            height={150}
            src={thumbnailUrl}
            alt="Thumbnail"
            className="object-cover h-[150px] w-[150px] rounded"
          />
        ) : (
          <FaFile size={56} className="text-neutral-150" />
        )}
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col items-center"
        >
          <p className="text-sm text-red-500">
            {errors.newFileName && errors.newFileName.message}
          </p>
          <div className="flex items-center">
            <Input
              type="text"
              value={name}
              className="bg-white"
              {...register("newFileName", {
                onChange: (e) => setName(e.target.value),
              })}
            />
            <div className="flex items-center">
              <IoIosCloseCircle
                size={36}
                className="right-0 top-0 rounded-full shadow text-red-500"
                onClick={() => setOpen(false)}
              />
              <button type="submit" disabled={mutation.isPending}>
                <IoIosCheckmarkCircle
                  size={36}
                  className={cx(
                    "right-0 top-0 rounded-full shadow text-green-500",
                    mutation.isPending && "animate-spin"
                  )}
                />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Rename;
