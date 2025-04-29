"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { X, User } from "lucide-react";
import { Notification } from "@/components/ui/notification";
import "./add-lead-modal.css";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const validatePhoneNumber = (phone: string) => {
  // Only check for exactly 10 digits, no formatting or special characters
  return /^\d{10}$/.test(phone);
};

// No formatting - store phone numbers exactly as entered
const formatPhoneNumber = (value: string) => {
  return value;
};

export function AddLeadModal({ isOpen, onClose, onSubmit }: AddLeadModalProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [subbrokers, setSubbrokers] = useState<Array<{ id: string, name: string }>>([]);
  const [isLoadingSubbrokers, setIsLoadingSubbrokers] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    status: "NEW",
    notes: "",
    assignedOwnerId: ""
  });
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  }>({});

  const validateForm = () => {
    const errors: typeof validationErrors = {};

    if (formData.name.trim().length < 3) {
      errors.name = "Name must be at least 3 characters long";
    }    if (!validatePhoneNumber(formData.phone)) {
      errors.phone = "Please enter exactly 10 digits for the phone number";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Only include assignedOwnerId if a value is selected and user is a Lead Broker
      const leadData = {
        ...formData,
        assignedOwnerId: session?.user?.role === 'LEAD_BROKER' && formData.assignedOwnerId ? formData.assignedOwnerId : undefined
      };
      
      // Pass the data to the parent component to handle the API call
      // This prevents duplicate API calls since the parent already handles the API request
      onSubmit(leadData);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create lead";
      setError(message);
      setNotification({
        type: "error",
        message
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits to be entered - no formatting
    const value = e.target.value.replace(/[^\d]/g, '');
    
    // Limit to 10 digits max
    const limitedValue = value.slice(0, 10);
    
    setFormData({ ...formData, phone: limitedValue });
    // Clear validation error when user starts typing
    if (validationErrors.phone) {
      setValidationErrors({ ...validationErrors, phone: undefined });
    }
  };

  // Fetch subbrokers if the current user is a Lead Broker
  useEffect(() => {
    const fetchSubbrokers = async () => {
      if (session?.user?.role !== 'LEAD_BROKER') return;
      
      try {
        setIsLoadingSubbrokers(true);
        const response = await fetch('/api/users/subbrokers', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch subbrokers');
        }

        const data = await response.json();
        setSubbrokers(data.map((sb: any) => ({
          id: sb.id,
          name: sb.name
        })));
      } catch (error) {
        console.error('Error fetching subbrokers:', error);
      } finally {
        setIsLoadingSubbrokers(false);
      }
    };

    if (isOpen) {
      fetchSubbrokers();
    }
  }, [isOpen, session?.user?.role]);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Add New Lead</h2>
            <button onClick={onClose} className="close-button">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="lead-form">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (validationErrors.name) {
                    setValidationErrors({ ...validationErrors, name: undefined });
                  }
                }}
                placeholder="Enter lead's full name"
                className={validationErrors.name ? "input-error" : ""}
              />
              {validationErrors.name && (
                <span className="error-text">{validationErrors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="text"
                id="phone"
                required
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="Enter phone number"
                className={validationErrors.phone ? "input-error" : ""}
              />
              {validationErrors.phone && (
                <span className="error-text">{validationErrors.phone}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (validationErrors.email) {
                    setValidationErrors({ ...validationErrors, email: undefined });
                  }
                }}
                placeholder="Enter email address"
                className={validationErrors.email ? "input-error" : ""}
              />
              {validationErrors.email && (
                <span className="error-text">{validationErrors.email}</span>
              )}
            </div>            <div className="form-group">
              <label htmlFor="status">Lead Status *</label>
              <select
                id="status"
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="NEGOTIATING">Negotiating</option>
                <option value="CLOSED_WON">Closed Won</option>
                <option value="CLOSED_LOST">Closed Lost</option>
              </select>
            </div>
            
            {/* Owner assignment dropdown - only visible for Lead Brokers */}
            {session?.user?.role === 'LEAD_BROKER' && (
              <div className="form-group">
                <label htmlFor="assignedOwnerId">Assign Owner</label>
                <div className="select-wrapper">
                  <select
                    id="assignedOwnerId"
                    value={formData.assignedOwnerId}
                    onChange={(e) => setFormData({ ...formData, assignedOwnerId: e.target.value })}
                    className="owner-select"
                  >
                    <option value="">Assign to me (Lead Broker)</option>
                    {subbrokers.map(broker => (
                      <option key={broker.id} value={broker.id}>
                        {broker.name}
                      </option>
                    ))}
                  </select>
                  <div className="select-icon">
                    <User size={16} />
                  </div>
                </div>
                <small className="helper-text">
                  {isLoadingSubbrokers ? 'Loading subbrokers...' : 'Select who will be responsible for this lead'}
                </small>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter any additional notes"
                rows={4}
              ></textarea>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                onClick={onClose} 
                className="cancel-button"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Lead"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
}
