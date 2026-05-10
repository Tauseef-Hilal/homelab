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
        "glass shadow-sm border-b border-border/40",
        className,
      )}
    >
      <nav className="flex items-center justify-between px-4 sm:px-8 py-4">
        {/* Left */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {showBackBtn && (
            <div className="hover:scale-110 active:scale-95 transition-transform shrink-0">
              <BackButton />
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3 min-w-0 group">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0">
              {icon}
            </div>

            <h1 className="font-black text-sm sm:text-lg md:text-xl tracking-tight truncate text-foreground/90">
              {title}
            </h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 sm:gap-6 shrink-0 ml-2">
          <StorageStats />
          <div className="flex items-center gap-0.5 sm:gap-2">
            <ThemeSwitch />
            <div className="w-px h-6 bg-border/60 mx-0.5 sm:mx-2" />
            <LogoutDialog />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
