"use client";

import { ReactNode, useRef, useEffect } from "react";
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
import "@/app/dashboard/mobile-nav-fixes.css";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Close sidebar when clicking outside on mobile
  const sidebarRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSidebarOpen &&
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 1024
      ) {
        setIsSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);
    // Close sidebar when changing routes on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    } else {
      // Force show the sidebar on desktop
      setIsSidebarOpen(true);
    }
  }, [pathname]);

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
  };  // State to track if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile size on component mount and window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Set page-loaded class to trigger animations
  useEffect(() => {
    document.body.classList.add('page-loaded');
    return () => {
      document.body.classList.remove('page-loaded');
    }
  }, []);

  return (
    <div className="dashboard-layout">      {!isSidebarOpen && isMobile && (
        <button className="mobile-menu-button" onClick={toggleSidebar} aria-label="Toggle menu">
          <Menu size={24} />
        </button>
      )}

      <aside ref={sidebarRef} className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Real Estate CRM</h2>
          {isMobile && (
            <button 
              className="close-sidebar" 
              onClick={() => setIsSidebarOpen(false)} 
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          )}
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
          </div>          <button 
            className="logout-button" 
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>      <main className="dashboard-main">
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}
