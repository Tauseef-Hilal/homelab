"use client";

import { File, Folder } from "../types/storage.types";
import Image from "next/image";
import { cx } from "class-variance-authority";
import { IoIosCheckmarkCircle, IoIosCloseCircle } from "react-icons/io";
import { FaFile } from "react-icons/fa6";
import { Input } from "@client/components/ui/input";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@client/components/ui/button";
import useDriveStore from "../stores/driveStore";
import { toast } from "sonner";
import { isFolder } from "@client/lib/utils";
import z from "zod";
import { useMoveItems } from "../hooks/useMoveItems";
import { getJob } from "../api/getJob";

interface RenameProps {
  item: File | Folder;
  open: boolean;
  setOpen: (open: boolean) => void;
  refetch: () => void;
}

const schema = z.object({
  name: z
    .string()
    .min(1, "Folder name can't be empty")
    .max(255, "Name too long")
    .refine(
      (name) =>
        !name.includes(".") && !name.includes("/") && !name.includes("\\"),
      "Name cannot include dots or slashes"
    ),
});

type RenameInput = z.infer<typeof schema>;

const Rename: React.FC<RenameProps> = ({ item, open, setOpen, refetch }) => {
  const ext = item.name.split(".").at(-1);
  const [name, setName] = useState(item.name.replace(`.${ext}`, ""));
  const thumbnailUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${item.userId}/thumbnails/${item.id}.webp`;

  useEffect(() => setName(item.name.replace(`.${ext}`, "")), [open]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string }>({
    resolver: zodResolver(schema),
  });

  const mutation = useMoveItems({
    onSuccess: ({ job }) => {
      const toastId = `toast-${job.id}`;
      toast.loading(`Renaming ${item.name} to ${name}`, { id: toastId });

      const interval = setInterval(async () => {
        try {
          const jobRes = await getJob(job.id);
          const status = jobRes.job.status;

          switch (status) {
            case "completed":
              toast.success(`Renamed ${item.name} to ${name}`, { id: toastId });
              clearInterval(interval);
              setOpen(false);
              refetch();
              break;

            case "processing":
              toast.loading(`Renaming ${item.name} to ${name}`, {
                id: toastId,
              });
              break;

            case "failed":
              toast.error("Failed to rename", { id: toastId });
              clearInterval(interval);
              refetch();
              break;

            default:
              toast.loading("Move job enqueued", { id: toastId });
              break;
          }
        } catch {
          toast.error("Failed to fetch job status", { id: toastId });
          clearInterval(interval);
        }
      }, 1000);
    },
    onError: (err) => {
      toast(err);
    },
  });

  const onSubmit = (data: RenameInput) =>
    mutation.mutate({
      destinationFolderId: isFolder(item) ? item.parentId : undefined,
      items: [
        {
          id: item.id,
          newName: data.name,
          type: isFolder(item) ? "folder" : "file",
        },
      ],
    });

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
        {!isFolder(item) && item.hasThumbnail ? (
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
            {errors.name && errors.name.message}
          </p>
          <div className="flex items-center">
            <Input
              type="text"
              value={name}
              className="bg-white"
              {...register("name", {
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
