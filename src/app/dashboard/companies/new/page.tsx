"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Building, UserCircle } from "lucide-react";

export default function NewCompanyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [leadBrokerId, setLeadBrokerId] = useState("");
  const [brokers, setBrokers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available brokers who can be lead brokers
  useEffect(() => {
    const fetchBrokers = async () => {
      setIsLoading(true);
      try {
        // Get unassigned brokers who can be lead brokers
        const response = await fetch("/api/users/brokers?role=LEAD_BROKER&unassigned=true");
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setBrokers(data);
      } catch (err) {
        console.error("Error fetching brokers:", err);
        setError("Failed to load available brokers. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBrokers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!name.trim()) {
      setError("Company name is required");
      return;
    }
    
    if (!leadBrokerId) {
      setError("You must select a lead broker");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          leadBrokerId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create company");
      }
      
      // Navigate to the companies list page with a success message
      router.push("/dashboard/companies");
      router.refresh(); // Refresh the page to show the new company
    } catch (err: any) {
      console.error("Error creating company:", err);
      setError(err.message || "An error occurred while creating the company");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="company-detail">
      <div className="company-detail-header">
        <Link href="/dashboard/companies" className="back-link">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="company-detail-title">Create New Company</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Company Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter company name"
                required
              />
            </div>

            <div>
              <label htmlFor="leadBroker" className="block text-sm font-medium text-gray-700 mb-1">
                Lead Broker *
              </label>
              
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 border-2 border-t-blue-500 border-r-blue-500 border-b-gray-200 border-l-gray-200 rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500">Loading brokers...</p>
                </div>
              ) : brokers.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded text-sm">
                  No available lead brokers found. Please create a lead broker first.
                </div>
              ) : (
                <select
                  id="leadBroker"
                  value={leadBrokerId}
                  onChange={(e) => setLeadBrokerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a lead broker</option>
                  {brokers.map((broker) => (
                    <option key={broker.id} value={broker.id}>
                      {broker.name} ({broker.phone})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Link href="/dashboard/companies">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button 
                type="submit" 
                disabled={isSubmitting || brokers.length === 0}
              >
                {isSubmitting ? "Creating..." : "Create Company"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
