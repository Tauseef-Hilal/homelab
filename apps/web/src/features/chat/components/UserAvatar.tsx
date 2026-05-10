import { User } from "@client/types/auth.types";
import { stringToHslColor } from "@client/lib/utils";

interface UserAvatarProps {
  user: User;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user }) => {
  const bgColor = stringToHslColor(user.username);
  
  return (
    <div
      style={{ backgroundColor: bgColor }}
      className="relative flex items-center justify-center h-10 w-10 rounded-[1.25rem] text-sm font-black text-white select-none shadow-lg shadow-black/5 ring-2 ring-background overflow-hidden group-hover:scale-105 transition-transform duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
      <span className="relative drop-shadow-md">
        {user.username[0].toUpperCase()}
      </span>
    </div>
  );
};

export default UserAvatar;
