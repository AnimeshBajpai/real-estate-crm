"use client";

import { SignInForm } from "@/components/auth/sign-in-form";
import SignInWrapper from "@/components/auth/sign-in-wrapper";
import Link from "next/link";

export default function SignInPage() {
  return (
    <SignInWrapper>
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <Link href="/" className="mx-auto mb-4 flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <img src="/logo.svg" alt="LeadPro Logo" className="h-8 w-8" />
              </div>
              <span className="ml-2 text-xl font-bold">LeadPro</span>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to sign in to your account
            </p>
          </div>
          <SignInForm />
          <div className="flex flex-col space-y-4">
            <p className="px-8 text-center text-sm text-muted-foreground">
              <Link
                href="/auth/forgot-password"
                className="hover:text-brand underline underline-offset-4"
              >
                Forgot your password?
              </Link>
            </p>
            <p className="px-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/" className="text-primary hover:underline">
                Return to Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </SignInWrapper>
  );
}
