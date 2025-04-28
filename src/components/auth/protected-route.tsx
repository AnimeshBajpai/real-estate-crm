"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function ProtectedRoute({ 
  children,
  requireAuth = true
}: { 
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = session && status === "authenticated";

  useEffect(() => {
    // If authentication is required and user is not authenticated
    if (!isLoading && !isAuthenticated && requireAuth) {
      redirect("/auth/signin");
    }
    
    // If authentication is not allowed and user is authenticated (e.g., sign-in page)
    if (!isLoading && isAuthenticated && !requireAuth) {
      redirect("/dashboard");
    }
  }, [isLoading, isAuthenticated, requireAuth]);  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="large" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow authenticated content to render
  if ((requireAuth && isAuthenticated) || (!requireAuth && !isAuthenticated)) {
    return <>{children}</>;
  }

  // This should never be displayed as the useEffect should redirect
  return null;
}
