"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LeadsViewButton() {
  return (
    <Link href="/dashboard/leads">
      <Button size="sm">View All Leads</Button>
    </Link>
  );
}
