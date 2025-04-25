"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Building,
  LayoutDashboard,
  LogOut,
  Menu,
  Phone,
  UserCircle,
  X,
  CalendarClock
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import "./dashboard-layout.css";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["SUPER_ADMIN", "LEAD_BROKER", "SUB_BROKER"],
    },
    {
      name: "Companies",
      href: "/dashboard/companies",
      icon: Building,
      roles: ["SUPER_ADMIN"],
    },
    {
      name: "Leads",
      href: "/dashboard/leads",
      icon: UserCircle,
      roles: ["SUPER_ADMIN", "LEAD_BROKER", "SUB_BROKER"],
    },
    {
      name: "Follow Ups",
      href: "/dashboard/follow-ups",
      icon: CalendarClock,
      roles: ["SUPER_ADMIN", "LEAD_BROKER", "SUB_BROKER"],
    },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard-layout">
      <button className="mobile-menu-button" onClick={toggleSidebar}>
        <Menu size={24} />
      </button>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Real Estate CRM</h2>
          <button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigationItems
            .filter(item => item.roles.includes(session?.user?.role as string))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <UserCircle size={32} />
            <div className="user-details">
              <p className="user-name">{session?.user?.name}</p>
              <p className="user-role">{session?.user?.role}</p>
            </div>
          </div>
          <button className="logout-button" onClick={() => signOut()}>
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
