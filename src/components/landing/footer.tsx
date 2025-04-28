"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="landing-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <Link href="/" className="footer-logo-link">
              <div className="footer-logo">
                <Image
                  src="/logo.svg"
                  alt="LeadPro CRM Logo"
                  width={40}
                  height={40}
                />
                <span className="footer-logo-text">LeadPro</span>
              </div>
            </Link>
            <p className="footer-description">
              The modern lead management platform built for real estate professionals.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-group">
              <h3 className="footer-group-title">Product</h3>
              <ul className="footer-menu">
                <li><Link href="#features" className="footer-link">Features</Link></li>
                <li><Link href="#" className="footer-link">Pricing</Link></li>
                <li><Link href="#" className="footer-link">Security</Link></li>
                <li><Link href="#" className="footer-link">Integrations</Link></li>
              </ul>
            </div>
            
            <div className="footer-group">
              <h3 className="footer-group-title">Resources</h3>
              <ul className="footer-menu">
                <li><Link href="#" className="footer-link">Blog</Link></li>
                <li><Link href="#" className="footer-link">Documentation</Link></li>
                <li><Link href="#" className="footer-link">Guides</Link></li>
                <li><Link href="#" className="footer-link">Webinars</Link></li>
              </ul>
            </div>
            
            <div className="footer-group">
              <h3 className="footer-group-title">Company</h3>
              <ul className="footer-menu">
                <li><Link href="#" className="footer-link">About Us</Link></li>
                <li><Link href="#" className="footer-link">Careers</Link></li>
                <li><Link href="#" className="footer-link">Contact</Link></li>
                <li><Link href="#" className="footer-link">Partners</Link></li>
              </ul>
            </div>
            
            <div className="footer-group">
              <h3 className="footer-group-title">Legal</h3>
              <ul className="footer-menu">
                <li><Link href="#" className="footer-link">Privacy Policy</Link></li>
                <li><Link href="#" className="footer-link">Terms of Service</Link></li>
                <li><Link href="#" className="footer-link">Cookie Policy</Link></li>
                <li><Link href="#" className="footer-link">GDPR</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="copyright">
            © {currentYear} LeadPro CRM. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
