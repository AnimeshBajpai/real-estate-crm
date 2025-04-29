"use client";

import { useState } from "react";
import { X, User, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AddLeadBrokerModalProps {
  onClose: () => void;
  onLeadBrokerAdded: (leadBroker: any) => void;
}

export function AddLeadBrokerModal({ onClose, onLeadBrokerAdded }: AddLeadBrokerModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!name.trim() || !phone.trim() || !password) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }    if (!/^\d{10}$/.test(phone)) {
      setError("Phone number must be exactly 10 digits");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters long");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          password,
          role: "LEAD_BROKER",
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create lead broker");
      }
      
      // Show success state
      setSuccess(true);
      
      // Pass the new lead broker data back to the parent
      onLeadBrokerAdded(data);
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err: any) {
      console.error("Error creating lead broker:", err);
      setError(err.message || "An error occurred while creating the lead broker");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-content">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Add Lead Broker
                </div>
                <button onClick={onClose} className="modal-close">
                  <X className="h-5 w-5" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="success-message">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Lead broker added successfully!
                </div>
              ) : (
                <>
                  {error && (
                    <div className="error-message">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {error}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label htmlFor="name" className="form-label">Lead Broker Name *</label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-input"
                        placeholder="Full Name"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">Phone Number *</label>                      <input
                        id="phone"
                        type="text"
                        value={phone}
                        onChange={(e) => {
                          // Allow only digits and limit to 10 digits
                          const digitsOnly = e.target.value.replace(/\D/g, '');
                          const limitedValue = digitsOnly.slice(0, 10);
                          setPhone(limitedValue);
                        }}
                        className="form-input"
                        placeholder="Phone Number (exactly 10 digits)"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="password" className="form-label">Password *</label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-input"
                        placeholder="Create Password"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="form-input"
                        placeholder="Confirm Password"
                        required
                      />
                    </div>
                    
                    <div className="form-actions">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Creating..." : "Add Lead Broker"}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
