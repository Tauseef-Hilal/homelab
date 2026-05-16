"use client";

import Link from "next/link";
import { cx } from "class-variance-authority";
import { ArrowRightIcon } from "lucide-react";

interface Props {
  link: string;
  text: string;
  description?: string;
  icon: React.ReactNode;
}

const HomeLink: React.FC<Props> = ({ link, text, description, icon }) => {
  return (
    <Link
      href={link}
      className={cx(
        "group relative flex items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/5 dark:border-white/5",
        "bg-white/40 dark:bg-black/40 backdrop-blur-xl h-[12vh] min-h-[85px] max-h-[110px] sm:h-[14vh] sm:max-h-[140px]",
        "transition-all duration-500 hover:border-primary/30 hover:bg-white/60 dark:hover:bg-black/60",
        "overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20"
      )}
    >
      {/* Animated gradient hover effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br from-primary/10 via-transparent to-transparent" />

      <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-background to-muted border border-white/20 dark:border-white/10 text-primary shadow-sm group-hover:scale-110 transition-transform duration-500 ease-out shrink-0 z-10">
        {icon}
      </div>

      <div className="relative flex flex-col min-w-0 z-10 flex-1">
        <span className="font-heading font-bold text-xl sm:text-2xl text-foreground tracking-tight group-hover:text-primary transition-colors duration-300 leading-tight">
          {text}
        </span>
        {description && (
          <span className="text-sm sm:text-base text-muted-foreground font-medium leading-tight">
            {description}
          </span>
        )}
      </div>
      
      <div className="relative ml-auto flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out shrink-0 z-10">
        <ArrowRightIcon className="w-4 h-4" />
      </div>
    </Link>
  );
};

export default HomeLink;
