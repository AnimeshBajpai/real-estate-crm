"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import LeadsContent from "@/components/leads/leads-content";

export default function LeadsPage() {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin');
    },
  });

  if (status === "loading") {
    return <div className="loading-state">Loading...</div>;
  }

  return <LeadsContent />;
}
