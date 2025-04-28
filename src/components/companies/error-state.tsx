"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
}

export function ErrorState({ message = "An error occurred" }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
      <h2 className="text-2xl font-semibold text-red-600 mb-2">Error</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-4">
        <Link href="/dashboard/companies">
          <Button>Back to Companies</Button>
        </Link>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    </div>
  );
}
