import { File } from "../types/storage.types";
import Image from "next/image";
import useAuthStore from "@client/features/auth/stores/auth.store";
import { cx } from "class-variance-authority";
import { Button } from "@client/components/ui/button";
import { IoIosCloseCircle } from "react-icons/io";

interface PreviewProps {
  file: File;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Preview: React.FC<PreviewProps> = ({
  file,
  open,
  setOpen,
}) => {
  const token = useAuthStore().accessToken;
  const src = `${process.env.NEXT_PUBLIC_API_BASE_URL}/storage/file/${file.id}/preview?token=${token}`;

  let element = null;
  if (
    file.mimeType.startsWith("video/") ||
    file.mimeType.startsWith("audio/")
  ) {
    element = (
      <video
        src={src}
        className="max-w-full max-h-full object-contain"
        controls
      />
    );
  } else if (file.mimeType.startsWith("image/")) {
    element = (
      <Image
        width={300}
        height={300}
        src={src}
        alt="Preview"
        className="max-w-full max-h-full object-cover"
      />
    );
  } else {
    element = <p>Preview not available for this file</p>;
  }

  return (
    <div
      style={{ display: open ? "flex" : "none" }}
      className={cx(
        "fixed w-full h-full top-0 left-0",
        "justify-center items-center",
        "bg-black"
      )}
    >
      <div className="relative max-w-full max-h-full">
        {element}
        <IoIosCloseCircle
          size={48}
          className="absolute right-0 top-0 rounded-full shadow text-white"
          onClick={() => setOpen(false)}
        />
      </div>
    </div>
  );
};

export default Preview;
