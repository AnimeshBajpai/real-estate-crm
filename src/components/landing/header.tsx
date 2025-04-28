"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="landing-header">
      <div className="container">
        <div className="header-content">
          <Link href="/" className="logo-link">
            <div className="logo">
              <Image
                src="/logo.svg"
                alt="LeadPro CRM Logo"
                width={40}
                height={40}
                priority
              />
              <span className="logo-text">LeadPro</span>
            </div>
          </Link>
          
          <nav className={`main-nav ${isMenuOpen ? "mobile-open" : ""}`}>
            <ul className="nav-list">
              <li className="nav-item">
                <Link href="#features" className="nav-link">
                  Features
                </Link>
              </li>
              <li className="nav-item">
                <Link href="#" className="nav-link">
                  Pricing
                </Link>
              </li>
              <li className="nav-item">
                <Link href="#" className="nav-link">
                  Resources
                </Link>
              </li>
              <li className="nav-item">
                <Link href="#" className="nav-link">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
            <div className="auth-buttons">
            <Link href="/auth/signin">
              <Button className="signin-button">
                Sign in
              </Button>
            </Link>
          </div>

          <button className="mobile-menu-button" onClick={toggleMenu}>
            {isMenuOpen ? (
              <X className="menu-icon" />
            ) : (
              <Menu className="menu-icon" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
