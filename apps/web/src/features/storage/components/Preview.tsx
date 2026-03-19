import { File } from "../types/storage.types";
import Image from "next/image";
import useAuthStore from "@client/stores/auth.store";
import { IoClose } from "react-icons/io5";
import { useEffect, useRef } from "react";
import { cx } from "class-variance-authority";

interface PreviewProps {
  file: File;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Preview: React.FC<PreviewProps> = ({ file, open, setOpen }) => {
  const token = useAuthStore().accessToken;
  const videoRef = useRef<HTMLVideoElement>(null);

  const src = `${process.env.NEXT_PUBLIC_API_URL}/storage/file/${file.id}/preview?token=${token}`;

  const close = () => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    setOpen(false);
  };

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    if (open) window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  let element = null;

  if (
    file.mimeType.startsWith("video/") ||
    file.mimeType.startsWith("audio/")
  ) {
    element = (
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full h-full object-contain"
      />
    );
  } else if (file.mimeType.startsWith("image/")) {
    element = (
      <Image
        unoptimized
        src={src}
        alt="Preview"
        fill
        className="object-contain"
      />
    );
  } else {
    element = (
      <div className="flex items-center justify-center h-full text-white">
        Preview not available
      </div>
    );
  }

  return (
    <div
      onClick={close}
      className={cx(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/70 backdrop-blur-sm transition",
        open ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      <div onClick={(e) => e.stopPropagation()} className="relative">
        {/* Fixed preview frame */}
        <div
          className="
            relative
            w-[900px]
            h-[600px]
            max-w-[95vw]
            max-h-[85vh]
            bg-black
            rounded-xl
            overflow-hidden
            shadow-2xl
          "
        >
          {element}
        </div>

        {/* Close button */}
        <button
          onClick={close}
          className="
            absolute -top-3 -right-3
            w-10 h-10
            flex items-center justify-center
            rounded-full
            bg-white/10
            hover:bg-white/20
            backdrop-blur
            transition
          "
        >
          <IoClose size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default Preview;
