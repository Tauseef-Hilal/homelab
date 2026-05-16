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
      <nav className="flex items-center justify-between px-4 sm:px-8 h-16 sm:h-20">
        {/* Left */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 h-full">
          {showBackBtn && (
            <div className="hover:scale-110 active:scale-95 transition-transform shrink-0 flex items-center">
              <BackButton />
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3 min-w-0 group h-full">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0 flex items-center justify-center">
              {icon}
            </div>

            <h1 className="font-bold text-lg sm:text-xl md:text-2xl tracking-tight truncate text-foreground/90 leading-none">
              {title}
            </h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 sm:gap-6 shrink-0 ml-2 h-full">
          <div className="flex items-center">
            <StorageStats />
          </div>
          <div className="flex items-center gap-1 sm:gap-3 h-full">
            <ThemeSwitch />
            <div className="w-px h-6 bg-border/60 mx-1 sm:mx-2 self-center" />
            <div className="flex items-center">
              <LogoutDialog />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
