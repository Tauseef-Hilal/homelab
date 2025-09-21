import { FaFolder } from "react-icons/fa6";
import { Folder } from "../types/storage.types";

interface FolderProps {
  child: Folder;
  onClick: (path: string) => void;
}

const FolderWidget: React.FC<FolderProps> = ({ child, onClick }) => {
  return (
    <div
      key={child.id}
      onClick={() => onClick(child.fullPath)}
      className="p-4 w-20 flex flex-col items-center gap-2"
    >
      <FaFolder size={56} className="text-yellow-400" />
      <p className="text-sm truncate w-full text-center">{child.name}</p>
    </div>
  );
};

export default FolderWidget;
