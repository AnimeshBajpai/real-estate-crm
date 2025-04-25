"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import FollowUpsContent from "@/components/follow-ups/follow-ups-content";

export default function FollowUpsPage() {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin');
    },
  });

  if (status === "loading") {
    return <div className="loading-state">Loading...</div>;
  }

  return <FollowUpsContent />;
}
