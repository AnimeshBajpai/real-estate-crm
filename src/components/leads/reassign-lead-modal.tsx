"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { X, UserPlus, User } from "lucide-react";
import "./reassign-lead-modal.css";

interface ReassignLeadModalProps {
  leadId: string;
  leadName: string;
  currentOwnerId: string;
  currentOwnerName: string;
  onClose: () => void;
  onLeadReassigned: () => void;
  companyId?: string; // For super admin filtering
}

export function ReassignLeadModal({
  leadId,
  leadName,
  currentOwnerId,
  currentOwnerName,
  onClose,
  onLeadReassigned,
  companyId
}: ReassignLeadModalProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSubbrokers, setIsLoadingSubbrokers] = useState(false);
  const [error, setError] = useState("");
  const [subbrokers, setSubbrokers] = useState<Array<{ id: string, name: string }>>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState(currentOwnerId);
    useEffect(() => {
    const fetchSubbrokers = async () => {
      // Allow both lead brokers and super admins to fetch subbrokers
      if (session?.user?.role !== 'LEAD_BROKER' && session?.user?.role !== 'SUPER_ADMIN') return;
      
      try {
        setIsLoadingSubbrokers(true);
        // Build the URL - for super admins, include companyId if provided
        let url = '/api/users/subbrokers';
        if (session.user.role === 'SUPER_ADMIN' && companyId) {
          url += `?companyId=${companyId}`;
        }
        
        const response = await fetch(url, {
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

    fetchSubbrokers();
  }, [session?.user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedOwnerId === currentOwnerId) {
      onClose();
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ownerId: selectedOwnerId
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reassign lead');
      }
      
      onLeadReassigned();
    } catch (err: any) {
      setError(err.message || 'An error occurred while reassigning the lead');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="reassign-lead-modal">
        <div className="modal-header">
          <h2>Reassign Lead</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="lead-info-section">
          <h3>Lead: {leadName}</h3>
          <p className="current-owner">
            <User size={16} className="owner-icon" />
            Current Owner: {currentOwnerName}
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="ownerId">Assign to</label>
            {isLoadingSubbrokers ? (
              <div className="loading-text">Loading subbrokers...</div>
            ) : (
              <div className="select-wrapper">
                <select
                  id="ownerId"
                  value={selectedOwnerId}
                  onChange={(e) => setSelectedOwnerId(e.target.value)}
                  className="owner-select"
                >
                  {/* Option for the Lead Broker (current user) */}
                  <option value={session?.user?.id}>
                    Myself (Lead Broker)
                  </option>
                  
                  {/* Options for all subbrokers */}
                  {subbrokers.map(broker => (
                    <option key={broker.id} value={broker.id}>
                      {broker.name}
                    </option>
                  ))}
                </select>
                <div className="select-icon">
                  <UserPlus size={16} />
                </div>
              </div>
            )}
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
              disabled={isLoading || selectedOwnerId === currentOwnerId}
            >
              {isLoading ? "Reassigning..." : "Reassign Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
