"use client";

import Link from "next/link";
import { cx } from "class-variance-authority";

interface Props {
  link: string;
  text: string;
  icon: React.ReactNode;
}

const HomeLink: React.FC<Props> = ({ link, text, icon }) => {
  return (
    <Link
      href={link}
      className={cx(
        "group relative flex items-center gap-4 sm:gap-8 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-border/40",
        "bg-background hover:bg-muted/20",
        "transition-all duration-500 hover:border-primary/30 hover:shadow-[0_20px_60px_-15px_rgba(var(--primary),0.1)] active:scale-[0.99]",
      )}
    >
      <div className="flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-[1.25rem] sm:rounded-[2rem] bg-muted/40 text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner shrink-0">
        {icon}
      </div>

      <div className="flex flex-col min-w-0">
        <span className="font-black text-xl sm:text-2xl md:text-3xl tracking-tighter group-hover:text-primary transition-colors truncate">
          {text}
        </span>
      </div>

      <div className="ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500 hidden sm:flex">
        <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center bg-background shadow-sm">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default HomeLink;
