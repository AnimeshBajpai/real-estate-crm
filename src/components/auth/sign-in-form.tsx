"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

// Import the dedicated CSS file
import "./sign-in-form.css";

const formSchema = z.object({
  phone: z.string().min(10, {
    message: "Phone number must be valid",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
});

/**
 * SignInForm component using traditional CSS classes.
 */
export function SignInForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await signIn("credentials", {
        phone: values.phone,
        password: values.password,
        redirect: false,
      });

      if (response?.error) {
        setError(response.error);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="signin-container">
      <div className="signin-form-container">
        <h2 className="signin-title">Sign In</h2>
        <p className="signin-subtitle">
          Enter your credentials to access your account
        </p>
        
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="signin-form-group">
            <label className="signin-label" htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="text"
              placeholder="Enter your phone number"
              {...form.register("phone")}
              className="signin-input"
            />
            {form.formState.errors.phone && (
              <p className="signin-error-text">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          <div className="signin-form-group">
            <label className="signin-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...form.register("password")}
              className="signin-input"
            />
            {form.formState.errors.password && (
              <p className="signin-error-text">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <div className="signin-error-text">{error}</div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="signin-button"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="signin-forgot-password-container">
          <span className="signin-forgot-password-text">
            Forgot your password?{' '}
            <a
              href="/auth/forgot-password"
              className="signin-forgot-password-link"
            >
              Reset it here
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
