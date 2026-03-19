import { LogoutDialog } from "@client/features/auth/components/LogoutDialog";
import BackButton from "./BackButton";
import ThemeSwitch from "./ThemeSwitch";
import StorageStats from "@client/features/storage/components/Stats";
import { cx } from "class-variance-authority";

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
    <header
      className={cx(
        "sticky top-0 z-40",
        "bg-background/70 backdrop-blur",
        "border-b",
        className,
      )}
    >
      <nav className="flex items-center justify-between px-3 sm:px-5 py-3">
        {/* Left */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {showBackBtn && <BackButton />}

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-muted-foreground flex items-center shrink-0">
              {icon}
            </span>

            <h1 className="font-semibold text-base sm:text-lg truncate">
              {title}
            </h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <StorageStats />
          <ThemeSwitch />
          <LogoutDialog />
        </div>
      </nav>
    </header>
  );
};

export default Header;
