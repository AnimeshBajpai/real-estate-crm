import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import "./responsive-fixes.css"; // Import our responsive fixes

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
