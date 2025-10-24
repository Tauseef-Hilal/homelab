"use client";

import { cx } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

interface PaginatorProps {
  paginate: () => void;
  hasMoreData: boolean;
}

const Paginator: React.FC<PaginatorProps> = ({ paginate, hasMoreData }) => {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreData) {
          paginate();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [paginate]);

  return (
    <div
      ref={observerRef}
      className={cx(
        hasMoreData ? "flex justify-center animate-spin" : "hidden"
      )}
    >
      <Loader2 />
    </div>
  );
};

export default Paginator;
