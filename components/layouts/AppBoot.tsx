"use client";

import { useSession } from "next-auth/react";
import { Spinner } from "../ui/spinner";


export default function AppBoot({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  if (status === "loading") {

    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return <>{children}</>;
}
