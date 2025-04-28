"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProfileButtonProps {
  userId: string;
}

export function ProfileButton({ userId }: ProfileButtonProps) {
  return (
    <div className="pt-4">
      <Link href={`/dashboard/users/${userId}`}>
        <Button variant="outline" size="sm">View Profile</Button>
      </Link>
    </div>
  );
}
