import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import ProtectedRoute from "@/components/auth/protected-route";
import "./responsive-fixes.css"; // Import our responsive fixes
import "./mobile-nav-fixes.css"; // Import mobile navigation fixes

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
