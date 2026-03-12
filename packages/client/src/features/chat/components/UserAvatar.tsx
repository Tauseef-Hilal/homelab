import { User } from "@client/types/auth.types";
import { stringToHslColor } from "@client/lib/utils";

interface UserAvatarProps {
  user: User;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user }) => {
  return (
    <div
      style={{ backgroundColor: stringToHslColor(user.username) }}
      className="flex items-center justify-center h-9 w-9 rounded-full text-sm font-semibold text-white select-none"
    >
      {user.username[0].toUpperCase()}
    </div>
  );
};

export default UserAvatar;
