import type { Metadata } from "next";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Dashboard | Real Estate CRM",
  description: "Dashboard for Real Estate Brokerage Lead Management System",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
