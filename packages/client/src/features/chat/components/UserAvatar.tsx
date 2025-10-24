import { User } from "@client/features/auth/types/auth.types";
import { stringToHslColor } from "@client/lib/utils";
import { cx } from "class-variance-authority";

interface UserAvatarProps {
  user: User;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user }) => {
  return (
    <div
      style={{ backgroundColor: `${stringToHslColor(user.username)}` }}
      className={cx(
        "rounded-full h-10 min-w-10 flex justify-center items-center text-white"
      )}
    >
      {user.username[0]}
    </div>
  );
};

export default UserAvatar;
