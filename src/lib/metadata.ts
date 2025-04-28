import { Metadata } from "next";

/**
 * Common metadata configuration for mobile responsiveness
 */
export const mobileMetadata: Metadata = {
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Real Estate CRM",
  },
  formatDetection: {
    telephone: true,
    date: false,
    address: false,
    email: true,
  },
};

/**
 * Generate complete metadata for a page
 */
export function generateMetadata(title: string, description: string): Metadata {
  return {
    ...mobileMetadata,
    title,
    description,
  };
}
