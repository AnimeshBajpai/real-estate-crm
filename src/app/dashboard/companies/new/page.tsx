"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Building, UserCircle, Users, AlertCircle, PlusCircle } from "lucide-react";
import { Notification } from "@/components/ui/notification";
import { AddLeadBrokerModal } from "@/components/companies/add-lead-broker-modal";
import "@/components/companies/add-lead-broker-modal.css";

export default function NewCompanyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [leadBrokerId, setLeadBrokerId] = useState("");
  const [brokers, setBrokers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isLeadBrokerModalOpen, setIsLeadBrokerModalOpen] = useState(false);
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

  // Handle when a new lead broker is added via the modal
  const handleLeadBrokerAdded = (newBroker: any) => {
    // Add the new broker to the brokers list
    setBrokers((prevBrokers) => [...prevBrokers, newBroker]);
    
    // Auto-select the newly created lead broker
    setLeadBrokerId(newBroker.id);
    
    // Show notification
    setNotification({
      type: 'success',
      message: `Lead broker "${newBroker.name}" added successfully!`
    });
    
    // Clear notification after a delay
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };
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
      
      // Show success notification
      setNotification({
        type: 'success',
        message: `Company "${name}" has been created successfully!`
      });
      
      // Small delay to show notification before redirecting
      setTimeout(() => {
        // Navigate to the companies list page
        router.push("/dashboard/companies");
        router.refresh(); // Refresh the page to show the new company
      }, 1500);
      
    } catch (err: any) {
      console.error("Error creating company:", err);
      setError(err.message || "An error occurred while creating the company");
      setIsSubmitting(false);
    }
  };
  return (
    <div className="company-detail company-form-container">
      <div className="back-link-container">
        <Link href="/dashboard/companies" className="back-link">
          <ChevronLeft className="h-5 w-5" />
          Back to Companies
        </Link>
      </div>
      
      <h1 className="page-title">
        <Building className="h-6 w-6" />
        Create New Company
      </h1>

      <Card className="company-form-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="error-message">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Company Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Enter company name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="leadBroker" className="form-label">
                Lead Broker * <span className="text-xs text-gray-500">(Will manage this company)</span>
              </label>
                {isLoading ? (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <p>Loading brokers...</p>
                </div>
              ) : brokers.length === 0 ? (
                <div className="empty-state">
                  <Users className="h-4 w-4 inline mr-2" />
                  No available lead brokers found.
                  <Button 
                    type="button" 
                    onClick={() => setIsLeadBrokerModalOpen(true)}
                    className="ml-2 text-blue-700 hover:text-blue-800 underline"
                  >
                    <PlusCircle className="h-4 w-4 mr-1 inline" />
                    Create Lead Broker
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <select
                      id="leadBroker"
                      value={leadBrokerId}
                      onChange={(e) => setLeadBrokerId(e.target.value)}
                      className="form-select flex-1"
                      required
                    >
                      <option value="">Select a lead broker</option>
                      {brokers.map((broker) => (
                        <option key={broker.id} value={broker.id}>
                          {broker.name} ({broker.phone})
                        </option>
                      ))}
                    </select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="shrink-0"
                      onClick={() => setIsLeadBrokerModalOpen(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      New
                    </Button>
                  </div>
                </>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Note: Only unassigned brokers with the Lead Broker role are shown.
              </p>
            </div>

            <div className="form-actions">
              <Link href="/dashboard/companies">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button 
                type="submit" 
                disabled={isSubmitting || brokers.length === 0}
                className={isSubmitting ? "opacity-70" : ""}
              >
                {isSubmitting ? "Creating..." : "Create Company"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
        {notification && (
        <Notification 
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      {/* Lead Broker Modal */}
      {isLeadBrokerModalOpen && (
        <AddLeadBrokerModal
          onClose={() => setIsLeadBrokerModalOpen(false)}
          onLeadBrokerAdded={handleLeadBrokerAdded}
        />
      )}
    </div>
  );
}
