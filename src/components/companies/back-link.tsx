"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackLink() {
  return (
    <div className="back-link-container">
      <Link href="/dashboard/companies" className="back-button">
        <ChevronLeft className="w-5 h-5" />
      </Link>
      <span className="back-text">Back to Companies</span>
    </div>
  );
}
