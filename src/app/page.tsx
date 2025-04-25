import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  // Get the user's session
  const session = await getServerSession(authOptions);
  
  // If user is authenticated, redirect to dashboard
  // If not authenticated, redirect to sign-in page
  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/auth/signin");
  }
  
  // This return statement is unreachable but needed for TypeScript
  return null;
}
