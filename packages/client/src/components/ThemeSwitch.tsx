"use client";

import { cx } from "class-variance-authority";
import { MoonStar, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const ThemeSwitch: React.FC = () => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme && theme == "dark") {
      setDark(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const switchTheme = () => {
    setDark(!dark);
  };

  return (
    <div
      onClick={switchTheme}
      className={cx(
        "rounded-full p-1 h-[28px] w-[48px] border-2 flex items-center",
        dark
          ? "bg-neutral-700 justify-end border-black"
          : "bg-neutral-200 border-white"
      )}
    >
      <div
        className={cx(
          "h-[18px] w-[18px] rounded-full bg-white flex items-center justify-center text-black shadow-sm"
        )}
      >
        {dark ? <MoonStar size={14} /> : <Sun size={14} />}
      </div>
    </div>
  );
};

export default ThemeSwitch;
