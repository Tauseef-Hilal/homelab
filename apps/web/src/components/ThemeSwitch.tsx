"use client";

import { cx } from "class-variance-authority";
import { MoonStar, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const ThemeSwitch: React.FC = () => {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    if (dark === null) return;

    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const switchTheme = () => {
    setDark((prev) => !prev);
  };

  if (dark === null) return null;

  return (
    <button
      onClick={switchTheme}
      className={cx(
        "rounded-full p-1 h-[28px] w-[48px] border-2 flex items-center transition-all",
        dark
          ? "bg-neutral-700 justify-end border-black"
          : "bg-neutral-200 justify-start border-white",
      )}
    >
      <div className="h-[18px] w-[18px] rounded-full bg-white flex items-center justify-center text-black shadow-sm">
        {dark ? <MoonStar size={14} /> : <Sun size={14} />}
      </div>
    </button>
  );
};

export default ThemeSwitch;
