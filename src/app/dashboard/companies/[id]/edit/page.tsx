"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Building, UserCircle } from "lucide-react";

// Define form validation schema
const companyFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  leadBrokerId: z.string().min(1, "Lead broker is required"),
});

type FormValues = z.infer<typeof companyFormSchema>;

interface Company {
  id: string;
  name: string;
  leadBroker: {
    id: string;
    name: string;
    phone: string;
  };
}

interface LeadBroker {
  id: string;
  name: string;
  phone: string;
}

export default function EditCompanyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [leadBrokers, setLeadBrokers] = useState<LeadBroker[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      leadBrokerId: "",
    },
  });
  // Fetch company data
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await fetch(`/api/companies/${params.id}`);
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setCompany(data);
        reset({
          name: data.name,
          leadBrokerId: data.leadBroker.id,
        });
      } catch (err) {
        setError("Failed to load company data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  }, [params.id, reset]);

  // Fetch available lead brokers
  useEffect(() => {
    const fetchLeadBrokers = async () => {
      try {
        // Include the current lead broker in the available options, even if they're already assigned
        const response = await fetch(`/api/users/brokers?role=LEAD_BROKER&includeId=${company?.leadBroker.id}`);
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setLeadBrokers(data);
      } catch (err) {
        setError("Failed to load available lead brokers");
        console.error(err);
      }
    };

    if (company) {
      fetchLeadBrokers();
    }
  }, [company]);
  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/companies/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update company");
      }

      // Redirect to company details page
      router.push(`/dashboard/companies/${params.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 loading-spinner"></div>
        <p className="text-gray-500">Loading company information...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="error-container">
        <h2 className="error-title">Company Not Found</h2>
        <p className="error-message">The company you're trying to edit doesn't exist or has been deleted.</p>
        <Link href="/dashboard/companies">
          <Button>Back to Companies</Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="company-detail">      <div className="company-detail-header">
        <Link href={`/dashboard/companies/${params.id}`} className="back-link">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="company-detail-title">Edit Company</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                {...register("name")}
                id="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter company name"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="leadBrokerId" className="block text-sm font-medium text-gray-700 mb-1">
                Lead Broker *
              </label>
              <select
                {...register("leadBrokerId")}
                id="leadBrokerId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue={company.leadBroker.id}
              >
                <option value="">Select a lead broker</option>
                {leadBrokers.map((broker) => (
                  <option key={broker.id} value={broker.id}>
                    {broker.name} ({broker.phone})
                  </option>
                ))}
              </select>
              {errors.leadBrokerId && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.leadBrokerId.message}
                </p>
              )}
            </div>            <div className="flex justify-end space-x-4 pt-4">
              <Link href={`/dashboard/companies/${params.id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
