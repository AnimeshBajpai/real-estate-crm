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
  UserCheck,
  Check,
  X,
  Search,
  Trash2
} from "lucide-react";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { BrokerFilterDropdown } from "@/components/ui/broker-filter-dropdown";
import { CompanyFilterDropdown } from "@/components/ui/company-filter-dropdown";
import { ViewModeToggle } from "@/components/ui/view-mode-toggle";
import { AddLeadModal } from "@/components/leads/add-lead-modal";
import { AddSubbrokerModal } from "@/components/leads/add-subbroker-modal";
import { ReassignLeadModal } from "@/components/leads/reassign-lead-modal";
import { EditLeadModal } from "@/components/leads/edit-lead-modal";
import { DeleteConfirmationModal } from "@/components/leads/delete-confirmation-modal";
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

interface Company {
  id: string;
  name: string;
  leadBroker: {
    id: string;
    name: string;
  };
}

export default function LeadsContent() {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubbrokerModalOpen, setIsSubbrokerModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLeadForReassign, setSelectedLeadForReassign] = useState<Lead | null>(null);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const [selectedLeadForDelete, setSelectedLeadForDelete] = useState<Lead | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [prioritizedLeads, setPrioritizedLeads] = useState<Record<string, boolean>>({});
  const [subbrokers, setSubbrokers] = useState<SubBroker[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);  
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedSubbrokerId, setSelectedSubbrokerId] = useState<string>("");
  const [selectedLeadBrokerId, setSelectedLeadBrokerId] = useState<string>("");
  const [leadBrokers, setLeadBrokers] = useState<{id: string, name: string}[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'bySubbroker'>('all');
  const [expandedSubbrokers, setExpandedSubbrokers] = useState<Record<string, boolean>>({});  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingLeadBrokers, setIsLoadingLeadBrokers] = useState(false);
  const [isLoadingSubbrokerLeads, setIsLoadingSubbrokerLeads] = useState<Record<string, boolean>>({});  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Specialized function for searching leads without triggering full page load
  const searchLeads = async () => {
    if (status !== 'authenticated') {
      return;
    }

    try {
      // Only set searching state, not the main loading state
      setIsSearching(true);
      
      // Build URL with query parameters for filtering
      const url = new URL('/api/leads', window.location.origin);
      
      // Include all current filters
      if (session?.user?.role === 'SUPER_ADMIN' && selectedCompanyId) {
        url.searchParams.append('companyId', selectedCompanyId);
      }
      
      if (selectedSubbrokerId) {
        url.searchParams.append('ownerId', selectedSubbrokerId);
      }
      
      if (session?.user?.role === 'SUPER_ADMIN' && selectedLeadBrokerId) {
        url.searchParams.append('leadBrokerId', selectedLeadBrokerId);
      }      // Add search query without special phone preprocessing
      if (searchQuery.trim()) {
        // Just use the raw search query - exact matching as entered
        const trimmedSearch = searchQuery.trim();
        url.searchParams.append('search', trimmedSearch);
        console.log(`Adding search param: "${trimmedSearch}"`);
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to search leads');
      }

      const data = await response.json();
      // Only update leads data, not the whole page state
      setLeads(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search leads';
      console.error('Search error:', message);
      // Don't show notification for search errors to reduce UI noise
    } finally {
      setIsSearching(false);
    }
  };  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Directly capture the input value at the time of the event
    const capturedValue = value; // No need for useRef here
    
    // Update the UI immediately
    setSearchQuery(value);
    
    // Debounce search requests to prevent excessive API calls
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      // Create a function that captures the exact value in its closure
      const doSearch = () => {
        console.log(`Executing search with exact query: "${capturedValue}"`);
        
        // Use the direct fetch without going through searchLeads
        const executeSearch = async () => {
          try {
            setIsSearching(true);
            
            // Build URL with parameters
            const url = new URL('/api/leads', window.location.origin);
            
            // Include filters
            if (session?.user?.role === 'SUPER_ADMIN' && selectedCompanyId) {
              url.searchParams.append('companyId', selectedCompanyId);
            }
            
            if (selectedSubbrokerId) {
              url.searchParams.append('ownerId', selectedSubbrokerId);
            }
            
            if (session?.user?.role === 'SUPER_ADMIN' && selectedLeadBrokerId) {
              url.searchParams.append('leadBrokerId', selectedLeadBrokerId);
            }
            
            // Add the search query from the directly captured value instead of state
            if (capturedValue.trim()) {
              url.searchParams.append('search', capturedValue.trim());
              console.log(`API search param added: "${capturedValue.trim()}"`);
            }
            
            const response = await fetch(url, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(errorText || 'Failed to search leads');
            }
            
            const data = await response.json();
            setLeads(data);
          } catch (error) {
            console.error('Search error:', error);
          } finally {
            setIsSearching(false);
          }
        };
        
        // Execute the search immediately
        executeSearch();
      };
      
      // Run the search function
      doSearch();
    }, 500);
  };

  const fetchLeads = async () => {
    if (status !== 'authenticated') {
      console.log('Session not authenticated:', { status, session });
      return;
    }

    try {
      setError("");
      setIsLoading(true);
      
      // Build URL with query parameters for filtering
      const url = new URL('/api/leads', window.location.origin);
        // For SUPER_ADMIN, filter by selected company
      if (session?.user?.role === 'SUPER_ADMIN' && selectedCompanyId) {
        url.searchParams.append('companyId', selectedCompanyId);
      }
      
      // Add subbroker filter if selected
      if (selectedSubbrokerId) {
        url.searchParams.append('ownerId', selectedSubbrokerId);
      }
      
      // Add lead broker filter if selected (for super admin)
      if (session?.user?.role === 'SUPER_ADMIN' && selectedLeadBrokerId) {
        url.searchParams.append('leadBrokerId', selectedLeadBrokerId);
      }
      
      // Add search query if provided
      if (searchQuery.trim()) {
        url.searchParams.append('search', searchQuery.trim());
      }
      
      console.log('Fetching leads with filters:', { 
        role: session?.user?.role,
        filterCompanyId: selectedCompanyId,
        filterOwnerId: selectedSubbrokerId
      });
      
      const response = await fetch(url, {
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
  };  const fetchCompanies = async () => {
    if (status !== 'authenticated' || session?.user?.role !== 'SUPER_ADMIN') {
      return;
    }
    
    setIsLoadingCompanies(true);
    try {
      const response = await fetch('/api/companies', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch companies:', errorText);
        return;
      }

      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setIsLoadingCompanies(false);
    }
  };
  
  // Function to fetch lead brokers for a company (for super admins)
  const fetchLeadBrokers = async () => {
    if (status !== 'authenticated' || session?.user?.role !== 'SUPER_ADMIN' || !selectedCompanyId) {
      return;
    }
    
    setIsLoadingLeadBrokers(true);
    try {
      // Get lead brokers for the selected company
      const response = await fetch(`/api/users/brokers?companyId=${selectedCompanyId}&role=LEAD_BROKER`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch lead brokers:', errorText);
        return;
      }

      const data = await response.json();
      // Format lead brokers for display
      setLeadBrokers(data.map((broker: any) => ({
        id: broker.id,
        name: broker.name,
        companyName: broker.managedCompany?.name
      })));
      
      // Clear selected lead broker when changing companies
      setSelectedLeadBrokerId("");
    } catch (error) {
      console.error('Error fetching lead brokers:', error);
    } finally {
      setIsLoadingLeadBrokers(false);
    }
  };

  const fetchSubbrokers = async () => {
    if (status !== 'authenticated') {
      return;
    }
    
    // For LEAD_BROKER, get their subbrokers
    // For SUPER_ADMIN, get subbrokers for the selected company
    if (session?.user?.role !== 'LEAD_BROKER' && 
       (session?.user?.role !== 'SUPER_ADMIN' || !selectedCompanyId)) {
      return;
    }
    
    try {
      // For super admin with selected company, get subbrokers from that company
      const endpoint = session?.user?.role === 'SUPER_ADMIN' && selectedCompanyId
        ? `/api/users/subbrokers?companyId=${selectedCompanyId}`
        : '/api/users/subbrokers';
      
      const response = await fetch(endpoint, {
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
      
      // Clear selected subbroker when changing companies (for super admin)
      if (session?.user?.role === 'SUPER_ADMIN') {
        setSelectedSubbrokerId("");
      }
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
      
      // If user is a super admin, fetch companies
      if (session?.user?.role === 'SUPER_ADMIN') {
        fetchCompanies();
      }    }
  }, [status, viewMode]);
    // Refetch leads when the selected subbroker changes
  useEffect(() => {
    if (status === 'authenticated') {
      if (viewMode === 'all') {
        // In "all" mode, fetch leads with the subbroker filter
        fetchLeads();
      } else if (viewMode === 'bySubbroker' && selectedSubbrokerId) {
        // In "bySubbroker" mode, expand the selected subbroker section
        setExpandedSubbrokers(prev => ({
          ...prev,
          [selectedSubbrokerId]: true
        }));
        fetchSubbrokerLeads(selectedSubbrokerId);
      }
    }
  }, [selectedSubbrokerId]);  // This effect runs when searchQuery changes to empty string
  // It's separated from the debounce logic to ensure we immediately load all leads when cleared
  useEffect(() => {
    if (status === 'authenticated' && viewMode === 'all') {
      // When search is cleared with empty string, reload all leads
      if (searchQuery === "") {
        console.log('Search cleared - reloading all leads');
        
        // Cancel any pending debounced search
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
          searchTimeoutRef.current = null;
        }
        
        // Use fetchLeads with a specific implementation to ensure immediate execution
        const loadAllLeads = async () => {
          try {
            setIsLoading(true);
            
            // Build URL with default filters but no search query
            const url = new URL('/api/leads', window.location.origin);
            
            // Include filters
            if (session?.user?.role === 'SUPER_ADMIN' && selectedCompanyId) {
              url.searchParams.append('companyId', selectedCompanyId);
            }
            
            if (selectedSubbrokerId) {
              url.searchParams.append('ownerId', selectedSubbrokerId);
            }
            
            if (session?.user?.role === 'SUPER_ADMIN' && selectedLeadBrokerId) {
              url.searchParams.append('leadBrokerId', selectedLeadBrokerId);
            }
            
            console.log('Loading all leads without search query');
            
            const response = await fetch(url, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(errorText || 'Failed to load leads');
            }
            
            const data = await response.json();
            setLeads(data);
          } catch (error) {
            console.error('Error loading all leads:', error);
          } finally {
            setIsLoading(false);
          }
        };
        
        // Execute immediately
        loadAllLeads();
      }
      // The searching for non-empty queries is handled by debounce in handleSearchChange
    }
  }, [searchQuery, status, viewMode, session?.user?.role, selectedCompanyId, selectedSubbrokerId, selectedLeadBrokerId]);
  
  // Refetch leads when lead broker filter changes (for super admin)
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'SUPER_ADMIN') {
      fetchLeads();
      
      // When lead broker changes, clear subbroker selection
      // as we want to filter by either lead broker OR subbroker, not both
      if (selectedLeadBrokerId) {
        setSelectedSubbrokerId("");
      }
    }
  }, [selectedLeadBrokerId]);
    // Fetch subbrokers and lead brokers when a company is selected (for super admin only)
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'SUPER_ADMIN') {
      // When company selection changes, fetch leads for that company
      fetchLeads();
      
      // If a company is selected, fetch its subbrokers and lead brokers
      if (selectedCompanyId) {
        fetchSubbrokers();
        fetchLeadBrokers();
      } else {
        // Clear data when no company is selected
        setSubbrokers([]);
        setLeadBrokers([]);
        setSelectedSubbrokerId("");
        setSelectedLeadBrokerId("");
      }
    }
  }, [selectedCompanyId]);
  const handleAddLead = async (data: any) => {
    try {
      // For super admins with a selected company, add the company ID to the lead data
      let leadData = { ...data };
      if (session?.user?.role === 'SUPER_ADMIN' && selectedCompanyId) {
        leadData.companyId = selectedCompanyId;
      }
      
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(leadData)
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
            <div className="lead-action-menu" ref={actionMenuRef}>              {/* Allow both lead brokers and super admins to reassign leads */}
              {(session?.user?.role === 'LEAD_BROKER' || 
                (session?.user?.role === 'SUPER_ADMIN' && selectedCompanyId)) && (
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
              {/* Edit lead option */}
              <button 
                className="menu-item"
                onClick={() => {
                  setSelectedLeadForEdit(lead);
                  setIsEditModalOpen(true);
                  setOpenActionMenu(null);
                }}
              >
                <Edit size={16} />
                Edit Lead
              </button>
              {/* Delete lead option */}
              <button 
                className="menu-item delete-item"
                onClick={() => handleDeleteLead(lead)}
              >
                <Trash2 size={16} />
                Delete Lead
              </button>
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
  };  // Handle deleting a lead
  const handleDeleteLead = (lead: Lead) => {
    setSelectedLeadForDelete(lead);
    setIsDeleteModalOpen(true);
    setOpenActionMenu(null);
  };

  // Handle confirming lead deletion
  const handleConfirmDelete = async () => {
    if (!selectedLeadForDelete) return;
    
    const response = await fetch(`/api/leads/${selectedLeadForDelete.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to delete lead');
    }
    
    // Show success notification
    setNotification({
      type: 'success',
      message: 'Lead deleted successfully'
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
      }));      setNotification({
        type: 'error',
        message: 'Failed to update lead priority'
      });
    }
  };

  return (
    <div className="leads-page">      <div className="leads-header">
        <div className="leads-header-left">
          <h1 className="leads-title">Leads Management</h1>
          {/* Show selected company badge for super admin */}
          {session?.user?.role === 'SUPER_ADMIN' && selectedCompanyId && companies.length > 0 && (
            <div className="filtered-company-badge">
              <Building size={16} />
              {companies.find(company => company.id === selectedCompanyId)?.name || 'Selected Company'}
            </div>
          )}
        </div>
          <div className="search-container">
          <div className="search-wrapper">
            <Phone size={16} className="search-icon" />            <input
              type="text"
              className="search-input"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={handleSearchChange}
              aria-label="Search leads by name or phone"
            />
            {searchQuery && (
              <button 
                className="search-clear-button"
                onClick={() => {
                  // Clear the search query - this will trigger the useEffect for empty searches
                  setSearchQuery("");
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        
        <div className="leads-actions">{/* View mode toggle for Lead Brokers */}          {session?.user?.role === 'LEAD_BROKER' && (
            <div className="view-toggle">
              <ViewModeToggle 
                value={viewMode}
                onChange={(value) => {
                  setViewMode(value);
                  // Clear selected subbroker when switching view modes
                  if (value !== viewMode) {
                    setSelectedSubbrokerId("");
                  }
                }}
              />
            </div>
          )}
          
          {/* Company filter for Super Admins */}
          {session?.user?.role === 'SUPER_ADMIN' && (
            <div className="filter-section">
              <CompanyFilterDropdown
                options={companies.map(company => ({
                  id: company.id,
                  name: company.name
                }))}
                value={selectedCompanyId}
                onChange={(value) => setSelectedCompanyId(value)}
                isLoading={isLoadingCompanies}
              />
            </div>
          )}
          
          {/* Subbroker filter for Lead Brokers */}
          {session?.user?.role === 'LEAD_BROKER' && viewMode === 'all' && (            
            <div className="filter-section">
              <BrokerFilterDropdown
                options={[
                  { id: session?.user?.id || "", name: "My Leads", icon: <User size={16} /> },
                  ...subbrokers
                    .filter(broker => broker.id !== session?.user?.id)
                    .map(broker => ({
                      id: broker.id,
                      name: broker.name,
                      icon: <User size={16} />
                    }))
                ]}
                value={selectedSubbrokerId}
                onChange={(value) => setSelectedSubbrokerId(value)}
                isLoading={isLoading}
              />
            </div>
          )}          {/* Lead Broker filter for Super Admins when company is selected */}
          {session?.user?.role === 'SUPER_ADMIN' && selectedCompanyId && (
            <div className="filter-section">
              <div className="filter-label">Filter by Lead Broker:</div>
              <BrokerFilterDropdown
                options={[
                  ...leadBrokers.map(broker => ({
                    id: broker.id,
                    name: `${broker.name} (Lead Broker)`,
                    icon: <Users size={16} />
                  }))
                ]}
                value={selectedLeadBrokerId}
                onChange={(value) => {
                  setSelectedLeadBrokerId(value);
                  // Clear subbroker selection when choosing a lead broker
                  if (value) {
                    setSelectedSubbrokerId("");
                  }
                }}
                isLoading={isLoadingLeadBrokers}
              />
            </div>
          )}
          
          {/* Subbroker filter for Super Admins when company is selected */}
          {session?.user?.role === 'SUPER_ADMIN' && selectedCompanyId && (
            <div className="filter-section">
              <div className="filter-label">Filter by Subbroker:</div>
              <BrokerFilterDropdown
                options={[
                  ...subbrokers.map(broker => ({
                    id: broker.id,
                    name: broker.name,
                    icon: <User size={16} />
                  }))
                ]}
                value={selectedSubbrokerId}
                onChange={(value) => {
                  setSelectedSubbrokerId(value);
                  // Clear lead broker filter when choosing a subbroker
                  if (value) {
                    setSelectedLeadBrokerId("");
                  }
                }}
                isLoading={isLoading}
              />
            </div>
          )}
            <button 
            className="action-button primary-button"
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus size={16} />
            Add New Lead
          </button>          {/* Add Sub-broker button for lead brokers */}
          {session?.user?.role === 'LEAD_BROKER' && (
            <button 
              className="action-button primary-button"
              onClick={() => setIsSubbrokerModalOpen(true)}
            >
              <UserCog size={16} />
              Add Sub-broker
            </button>
          )}
          
          {/* Add Sub-broker button for super admins when a company is selected */}
          {session?.user?.role === 'SUPER_ADMIN' && selectedCompanyId && (
            <button 
              className="action-button primary-button"
              onClick={() => setIsSubbrokerModalOpen(true)}
            >
              <UserCog size={16} />
              Add Sub-broker
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
        {viewMode === 'all' ? (        leads.length > 0 ? (
          <div className={`leads-grid ${session?.user?.role === 'SUPER_ADMIN' && selectedCompanyId ? 'company-filtered-view' : ''}`}>
            {leads.map(renderLeadCard)}
          </div>
        ) : (
          <div className="no-data-message">
            {session?.user?.role === 'SUPER_ADMIN' && !selectedCompanyId ? (
              <>
                <Building size={48} />
                <p>Select a company to view its leads</p>
              </>
            ) : searchQuery ? (
              <>
                <Search size={48} />
                <p>No leads found matching "{searchQuery}"</p>                <button 
                  className="clear-search-button"
                  onClick={() => {
                    setSearchQuery("");
                    // Use fetchLeads to do a full reload of all leads
                    fetchLeads();
                  }}
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <Users size={48} />
                <p>No leads found. Click "Add New Lead" to create one.</p>
              </>
            )}
          </div>
        )
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
      )}        {isSubbrokerModalOpen && (
        <AddSubbrokerModal
          onClose={() => setIsSubbrokerModalOpen(false)}
          onSubbrokerAdded={handleSubbrokerAdded}
          selectedCompanyId={session?.user?.role === 'SUPER_ADMIN' ? selectedCompanyId : undefined}
        />
      )}        {isReassignModalOpen && selectedLeadForReassign && selectedLeadForReassign.owner && (
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
          companyId={session?.user?.role === 'SUPER_ADMIN' ? selectedCompanyId : undefined}
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

      {isDeleteModalOpen && selectedLeadForDelete && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          leadName={selectedLeadForDelete.name}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedLeadForDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
