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
        "flex items-center gap-4 p-5 rounded-xl border",
        "bg-card hover:bg-muted",
        "transition-colors",
      )}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
        {icon}
      </div>

      <span className="font-medium">{text}</span>
    </Link>
  );
};

export default HomeLink;
