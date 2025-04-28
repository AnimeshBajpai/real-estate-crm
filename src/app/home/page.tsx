import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/landing-page";

export default async function HomePage() {
  // Get the user's session
  const session = await getServerSession(authOptions);
  
  // If user is authenticated, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }
  
  // If not authenticated, show the landing page
  return <LandingPage />;
}
