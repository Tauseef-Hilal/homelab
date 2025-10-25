import { LogoutDialog } from "@client/features/auth/components/LogoutDialog";
import BackButton from "./BackButton";
import ThemeSwitch from "./ThemeSwitch";

interface HeaderProps {
  title: string;
  icon: React.ReactNode;
  showBackBtn?: boolean;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  icon,
  showBackBtn,
  className,
}) => {
  return (
    <header className={className ?? ""}>
      <nav className="flex justify-between items-center border-b-1 p-4">
        <div className="flex gap-2 items-center">
          {showBackBtn && <BackButton />}
          <p className="text-xl font-bold flex items-center gap-2">
            {icon} {title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitch />
          <LogoutDialog />
        </div>
      </nav>
    </header>
  );
};

export default Header;
