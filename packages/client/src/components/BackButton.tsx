"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ArrowLeftIcon } from "lucide-react";

const BackButton: React.FC = () => {
  const router = useRouter();

  return <ArrowLeftIcon onClick={() => router.back()} className="text-3xl" />;
};

export default BackButton;
