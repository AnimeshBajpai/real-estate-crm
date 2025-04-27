"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { X, Calendar } from "lucide-react";
import "./add-follow-up-modal.css";

interface Lead {
  id: string;
  name: string;
  phone: string;
  status: string;
}

interface Broker {
  id: string;
  name: string;
  role: string;
  company?: {
    name: string;
  };
}

interface AddFollowUpModalProps {
  onClose: () => void;
  onFollowUpCreated: () => void;
  initialLeadId?: string;
}

export function AddFollowUpModal({ onClose, onFollowUpCreated, initialLeadId }: AddFollowUpModalProps) {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    leadId: initialLeadId || "",
    notes: "",
    reminderDate: "",
    assignedUserId: "",
  });
    // Fetch leads and brokers to select from
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch leads
        const leadsResponse = await fetch("/api/leads");
        if (!leadsResponse.ok) {
          throw new Error(`Error ${leadsResponse.status}: ${leadsResponse.statusText}`);
        }
        const leadsData = await leadsResponse.json();
        setLeads(leadsData);
        
        // If initialLeadId is not provided and we have leads, set the first lead as default
        if (!initialLeadId && leadsData.length > 0) {
          setFormData(prev => ({ ...prev, leadId: leadsData[0].id }));
        }
        
        // Fetch brokers
        const brokersResponse = await fetch("/api/users/brokers");
        if (!brokersResponse.ok) {
          throw new Error(`Error ${brokersResponse.status}: ${brokersResponse.statusText}`);
        }
        const brokersData = await brokersResponse.json();
        setBrokers(brokersData);
        
        // Set currently logged in user as default assignee
        if (session?.user?.id) {
          setFormData(prev => ({ ...prev, assignedUserId: session.user.id }));
        } else if (brokersData.length > 0) {
          setFormData(prev => ({ ...prev, assignedUserId: brokersData[0].id }));
        }
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [initialLeadId, session?.user?.id]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.leadId || !formData.notes || !formData.reminderDate) {
      setError("All fields are required");
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch("/api/followups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create follow-up");
      }
      
      onFollowUpCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set default reminder date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const formattedDate = tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    setFormData(prev => ({ ...prev, reminderDate: formattedDate }));
  }, []);

  return (
    <div className="modal-overlay">
      <div className="add-follow-up-modal">
        <div className="modal-header">
          <h2>Add New Follow-up</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="leadId">Lead</label>
            <select
              id="leadId"
              name="leadId"
              value={formData.leadId}
              onChange={handleChange}
              required
              disabled={isLoading || !!initialLeadId}
            >
              <option value="">Select a lead</option>
              {leads.map(lead => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} - {lead.phone}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="reminderDate">Reminder Date</label>
            <div className="date-input-container">
              <Calendar size={18} />
              <input
                type="date"
                id="reminderDate"
                name="reminderDate"
                value={formData.reminderDate}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>
            <div className="form-group">
            <label htmlFor="assignedUserId">Assign To</label>
            <select
              id="assignedUserId"
              name="assignedUserId"
              value={formData.assignedUserId}
              onChange={handleChange}
              required
              disabled={isLoading}
            >
              <option value="">Select a broker</option>
              {brokers.map(broker => (
                <option key={broker.id} value={broker.id}>
                  {broker.name} {broker.company ? `(${broker.company.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Enter details about this follow-up"
              rows={4}
            />
          </div>
          
          <div className="modal-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Follow-up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
