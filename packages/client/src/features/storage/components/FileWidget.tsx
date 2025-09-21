import { FaFile } from "react-icons/fa6";
import { File } from "../types/storage.types";
import Image from "next/image";

interface FileProps {
  child: File;
}

const FileWidget: React.FC<FileProps> = ({ child }) => {
  const thumbnailUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${child.userId}/thumbnails/${child.id}.webp`;

  return (
    <div
      key={child.id}
      className="p-4 w-20 flex flex-col items-center justify-start gap-2"
    >
      {child.hasThumbnail ? (
        <Image
          width={56}
          height={56}
          src={thumbnailUrl}
          alt="Thumbnail"
          className="object-cover h-[56px] w-[56px] rounded"
        />
      ) : (
        <FaFile size={56} className="text-neutral-200" />
      )}

      <p className="text-sm truncate w-full text-center">{child.name}</p>
    </div>
  );
};

export default FileWidget;
