"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "./dashboard-layout";

export default function DashboardLayoutProvider({ children }: { children: ReactNode }) {
  // We need useSession here to ensure client-side authentication
  const { data: session } = useSession();

  if (!session) {
    return null; // Server component will handle the redirect
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
