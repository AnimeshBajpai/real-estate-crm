"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  UserPlus,
  Filter,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  Star,
  Edit,
  PhoneCall,
  Clock,
  Users,
  Building,
  User,
  ChevronRight,
  ChevronDown,
  UserCog,
  UserCheck
} from "lucide-react";
import { AddLeadModal } from "@/components/leads/add-lead-modal";
import { AddSubbrokerModal } from "@/components/leads/add-subbroker-modal";
import { ReassignLeadModal } from "@/components/leads/reassign-lead-modal";
import { EditLeadModal } from "@/components/leads/edit-lead-modal";
import { Notification } from "@/components/ui/notification";
import "@/app/dashboard/leads/leads.css";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  ownerId: string;
  isPriority: boolean;
  company: {
    name: string;
  };
  owner?: {
    id: string;
    name: string;
  };
}

interface SubBroker {
  id: string;
  name: string;
  phone: string;
  _count: {
    leads: number;
  };
  leads?: Lead[];
}

export default function LeadsContent() {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubbrokerModalOpen, setIsSubbrokerModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLeadForReassign, setSelectedLeadForReassign] = useState<Lead | null>(null);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [prioritizedLeads, setPrioritizedLeads] = useState<Record<string, boolean>>({});
  const [subbrokers, setSubbrokers] = useState<SubBroker[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'bySubbroker'>('all');
  const [expandedSubbrokers, setExpandedSubbrokers] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubbrokerLeads, setIsLoadingSubbrokerLeads] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fetchLeads = async () => {
    if (status !== 'authenticated') {
      console.log('Session not authenticated:', { status, session });
      return;
    }

    try {
      setError("");
      console.log('Fetching leads with session:', { 
        userId: session?.user?.id,
        role: session?.user?.role,
        companyId: session?.user?.companyId 
      });
      
      const response = await fetch('/api/leads', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch leads');
      }

      const data = await response.json();
      setLeads(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load leads';
      setError(message);
      setNotification({
        type: 'error',
        message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubbrokers = async () => {
    if (status !== 'authenticated' || session?.user?.role !== 'LEAD_BROKER') {
      return;
    }
    
    try {
      const response = await fetch('/api/users/subbrokers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch subbrokers:', errorText);
        return;
      }

      const data = await response.json();
      setSubbrokers(data);
    } catch (error) {
      console.error('Error fetching subbrokers:', error);
    }
  };

  const fetchSubbrokerLeads = async (subbrokerId: string) => {
    if (!session) return;
    
    try {
      setIsLoadingSubbrokerLeads(prev => ({ ...prev, [subbrokerId]: true }));
      const response = await fetch(`/api/leads?ownerId=${subbrokerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch leads for subbroker ${subbrokerId}`);
      }

      const data = await response.json();
      // Update the subbrokers state with the fetched leads
      setSubbrokers(prev => 
        prev.map(sb => 
          sb.id === subbrokerId ? { ...sb, leads: data } : sb
        )
      );
    } catch (error) {
      console.error(`Error fetching leads for subbroker ${subbrokerId}:`, error);
    } finally {
      setIsLoadingSubbrokerLeads(prev => ({ ...prev, [subbrokerId]: false }));
    }
  };
  
  useEffect(() => {
    if (status === 'authenticated') {
      if (viewMode === 'all') {
        fetchLeads();
      }
      
      // If user is a lead broker, fetch their subbrokers
      if (session?.user?.role === 'LEAD_BROKER') {
        fetchSubbrokers();
      }
    }
  }, [status, viewMode]);

  const handleAddLead = async (data: any) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create lead');
      }

      // Refresh the relevant view
      if (viewMode === 'all') {
        await fetchLeads();
      } else {
        await fetchSubbrokers();
      }
      
      setNotification({
        type: 'success',
        message: 'Lead created successfully!'
      });
      setIsModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create lead';
      setNotification({
        type: 'error',
        message
      });
    }
  };

  const handleSubbrokerAdded = () => {
    setIsSubbrokerModalOpen(false);
    setNotification({
      type: 'success',
      message: 'Sub-broker added successfully!'
    });
    // Refresh the subbrokers list
    fetchSubbrokers();
  };

  const handleLeadReassigned = () => {
    setIsReassignModalOpen(false);
    setSelectedLeadForReassign(null);
    
    // Show success notification
    setNotification({
      type: 'success',
      message: 'Lead reassigned successfully!'
    });
    
    // Refresh leads data based on current view
    if (viewMode === 'all') {
      fetchLeads();
    } else {
      // If in subbroker view, refresh subbroker leads
      fetchSubbrokers();
      
      // If any subbroker section is expanded, refresh their leads
      Object.entries(expandedSubbrokers).forEach(([subbrokerId, isExpanded]) => {
        if (isExpanded) {
          fetchSubbrokerLeads(subbrokerId);
        }
      });
    }
  };

  const toggleSubbrokerExpansion = (subbrokerId: string) => {
    const isCurrentlyExpanded = expandedSubbrokers[subbrokerId];
    
    setExpandedSubbrokers(prev => ({
      ...prev, 
      [subbrokerId]: !isCurrentlyExpanded
    }));

    // If expanding and no leads loaded yet, fetch them
    if (!isCurrentlyExpanded && (!subbrokers.find(sb => sb.id === subbrokerId)?.leads)) {
      fetchSubbrokerLeads(subbrokerId);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionMenu(null);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (status === 'loading' || isLoading) {
    return <div className="loading-state">Loading leads...</div>;
  }

  if (status === 'unauthenticated') {
    return <div className="error-state">Please sign in to view leads.</div>;
  }  const renderLeadCard = (lead: Lead) => (
    <div key={lead.id} className={`lead-card ${lead.isPriority ? 'prioritized' : ''}`}>
      <div className="lead-header">
        <div className="lead-info">
          <h3 className="lead-name">{lead.name}</h3>
          <span className={`lead-status status-${lead.status.toLowerCase()}`}>
            {lead.status.replace("_", " ")}
          </span>
        </div>
        <div className="lead-menu-container">
          <button 
            className="lead-action-button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenActionMenu(openActionMenu === lead.id ? null : lead.id);
            }}
          >
            <MoreVertical size={16} />
          </button>
          
          {openActionMenu === lead.id && (
            <div className="lead-action-menu" ref={actionMenuRef}>
              {session?.user?.role === 'LEAD_BROKER' && (
                <button 
                  className="menu-item"
                  onClick={() => {
                    setSelectedLeadForReassign(lead);
                    setIsReassignModalOpen(true);
                    setOpenActionMenu(null);
                  }}
                >
                  <UserCheck size={16} />
                  Reassign Owner
                </button>
              )}
              {/* Add more menu items here as needed */}
            </div>
          )}
        </div>
      </div>

      <div className="lead-details">
        <div className="detail-item">
          <Phone size={14} className="detail-icon" />
          {lead.phone}
        </div>
        {lead.email && (
          <div className="detail-item">
            <Mail size={14} className="detail-icon" />
            {lead.email}
          </div>
        )}
        <div className="detail-item">
          <Building size={14} className="detail-icon" />
          {lead.company.name}
        </div>
        <div className="detail-item">
          <Calendar size={14} className="detail-icon" />
          Created: {new Date(lead.createdAt).toLocaleDateString()}
        </div>
        {lead.owner && (
          <div className="detail-item">
            <User size={14} className="detail-icon" />
            Owner: {lead.owner.name}
          </div>
        )}
      </div>      <div className="lead-actions">
        <button 
          className={`lead-action-button ${lead.isPriority ? 'prioritized' : ''}`} 
          title={lead.isPriority ? "Remove Priority" : "Mark as Important"} 
          onClick={() => handleTogglePriority(lead)}
        >
          <Star size={16} />
        </button>
        <button className="lead-action-button" title="Edit Lead" onClick={() => handleEditLead(lead)}>
          <Edit size={16} />
        </button>
        <button className="lead-action-button" title="Schedule Call" onClick={() => handleCallLead(lead.phone)}>
          <PhoneCall size={16} />
        </button>
        <button className="lead-action-button" title="Add Follow-up">
          <Clock size={16} />
        </button>
      </div>
    </div>
  );

  // Handle making a phone call to the lead
  const handleCallLead = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };
  // Handle editing a lead
  const handleEditLead = (lead: Lead) => {
    setSelectedLeadForEdit(lead);
    setIsEditModalOpen(true);
  };
  
  // Handle when a lead has been updated
  const handleLeadUpdated = () => {
    setIsEditModalOpen(false);
    setSelectedLeadForEdit(null);
    
    // Show success notification
    setNotification({
      type: 'success',
      message: 'Lead updated successfully!'
    });
    
    // Refresh leads data based on current view
    if (viewMode === 'all') {
      fetchLeads();
    } else {
      // If in subbroker view, refresh subbroker leads
      fetchSubbrokers();
      
      // If any subbroker section is expanded, refresh their leads
      Object.entries(expandedSubbrokers).forEach(([subbrokerId, isExpanded]) => {
        if (isExpanded) {
          fetchSubbrokerLeads(subbrokerId);
        }
      });
    }
  };
  // Handle prioritizing/starring a lead
  const handleTogglePriority = async (lead: Lead) => {
    try {
      // Optimistically update UI
      setPrioritizedLeads(prev => ({
        ...prev,
        [lead.id]: !lead.isPriority
      }));
      
      // Call API to update the lead's priority status
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          isPriority: !lead.isPriority
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update lead priority');
      }

      // Show notification for the action
      setNotification({
        type: 'success',
        message: lead.isPriority 
          ? 'Lead removed from priorities' 
          : 'Lead marked as priority'
      });
      
      // Refresh the data to get the updated lead
      if (viewMode === 'all') {
        fetchLeads();
      } else if (viewMode === 'bySubbroker') {
        // If the specific subbroker section is expanded, refresh their leads
        const subbrokerId = lead.ownerId;
        if (expandedSubbrokers[subbrokerId]) {
          fetchSubbrokerLeads(subbrokerId);
        }
      }
    } catch (error) {
      console.error('Error toggling lead priority:', error);
      
      // Revert the optimistic update
      setPrioritizedLeads(prev => ({
        ...prev,
        [lead.id]: lead.isPriority
      }));
      
      setNotification({
        type: 'error',
        message: 'Failed to update lead priority'
      });
    }
  };

  return (
    <div className="leads-page">      <div className="leads-header">
        <h1 className="leads-title">Leads Management</h1>
        <div className="leads-actions">
          {session?.user?.role === 'LEAD_BROKER' && (
            <div className="view-toggle">
              <button 
                className={`toggle-button ${viewMode === 'all' ? 'active' : ''}`}
                onClick={() => setViewMode('all')}
              >
                All Leads
              </button>
              <button 
                className={`toggle-button ${viewMode === 'bySubbroker' ? 'active' : ''}`}
                onClick={() => setViewMode('bySubbroker')}
              >
                By Subbroker
              </button>
            </div>
          )}
          <button 
            className="action-button primary-button"
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus size={16} />
            Add New Lead
          </button>
          {session?.user?.role === 'LEAD_BROKER' && viewMode === 'bySubbroker' && (
            <button 
              className="action-button primary-button"
              onClick={() => setIsSubbrokerModalOpen(true)}
            >
              <UserCog size={16} />
              Add Sub-broker
            </button>
          )}
          <button className="action-button filter-button">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {viewMode === 'all' ? (
        <div className="leads-grid">
          {leads.map(renderLeadCard)}
        </div>
      ) : (
        <div className="subbroker-leads-container">
          {subbrokers.length === 0 ? (
            <div className="no-data-message">
              <Users size={48} />
              <p>No subbrokers found under your management</p>
            </div>
          ) : (
            subbrokers.map(subbroker => (
              <div key={subbroker.id} className="subbroker-section">
                <div 
                  className="subbroker-header"
                  onClick={() => toggleSubbrokerExpansion(subbroker.id)}
                >
                  <div className="subbroker-info">
                    <User size={16} className="subbroker-icon" />
                    <h3 className="subbroker-name">{subbroker.name}</h3>
                    <span className="lead-count">
                      {subbroker._count.leads} lead{subbroker._count.leads !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {expandedSubbrokers[subbroker.id] ? (
                    <ChevronDown size={16} className="expand-icon" />
                  ) : (
                    <ChevronRight size={16} className="expand-icon" />
                  )}
                </div>
                
                {expandedSubbrokers[subbroker.id] && (
                  <div className="subbroker-leads">
                    {isLoadingSubbrokerLeads[subbroker.id] ? (
                      <div className="loading-leads">Loading leads...</div>
                    ) : subbroker.leads?.length ? (
                      <div className="leads-grid">
                        {subbroker.leads.map(renderLeadCard)}
                      </div>
                    ) : (
                      <div className="no-leads-message">
                        No leads assigned to this subbroker
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}      {isModalOpen && (
        <AddLeadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddLead}
        />
      )}
        {isSubbrokerModalOpen && (
        <AddSubbrokerModal
          onClose={() => setIsSubbrokerModalOpen(false)}
          onSubbrokerAdded={handleSubbrokerAdded}
        />
      )}
        {isReassignModalOpen && selectedLeadForReassign && selectedLeadForReassign.owner && (
        <ReassignLeadModal
          leadId={selectedLeadForReassign.id}
          leadName={selectedLeadForReassign.name}
          currentOwnerId={selectedLeadForReassign.ownerId}
          currentOwnerName={selectedLeadForReassign.owner.name}
          onClose={() => {
            setIsReassignModalOpen(false);
            setSelectedLeadForReassign(null);
          }}
          onLeadReassigned={handleLeadReassigned}
        />
      )}

      {isEditModalOpen && selectedLeadForEdit && (
        <EditLeadModal
          lead={selectedLeadForEdit}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedLeadForEdit(null);
          }}
          onLeadUpdated={handleLeadUpdated}
        />
      )}
      
      {notification && (
        <Notification 
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
