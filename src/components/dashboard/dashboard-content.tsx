"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Building,
  CalendarClock,
  UserCircle,
  Phone,
  Home,
  Clock,
  Calendar,
  DollarSign,
  Users,
  ChevronRight,
  TrendingUp,
  Activity,
  Loader2
} from "lucide-react";

// Types for dashboard data
interface DashboardStats {
  leadsCount: number;
  followUpsCount: number;
  pendingTodayFollowUps: number;
  companiesCount: number;
  revenue: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  owner: {
    name: string;
  };
  createdAt: string;
}

interface FollowUp {
  id: string;
  notes: string;
  reminderDate: string;
  lead: {
    name: string;
  };
  user: {
    name: string;
  };
  completed: boolean;
}

interface DashboardActivities {
  recentLeads: Lead[];
  pendingFollowUps: FollowUp[];
}

export function DashboardContent() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<DashboardActivities | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await fetch('/api/dashboard/stats', {
        cache: 'no-store' // Prevent browser from caching the request
      });
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      const statsData = await statsResponse.json();
      setStats(statsData);
      
      // Fetch activities
      const activitiesResponse = await fetch('/api/dashboard/activities', {
        cache: 'no-store' // Prevent browser from caching the request
      });
      if (!activitiesResponse.ok) {
        throw new Error('Failed to fetch dashboard activities');
      }
      
      const activitiesData = await activitiesResponse.json();
      setActivities(activitiesData);
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'An error occurred while fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Only fetch data once when the component mounts and session is available  // Using a ref to track if the initial fetch has been made
  const initialFetchMade = useRef(false);
  
  useEffect(() => {
    // Only fetch if we have a session, haven't already fetched, and don't have data
    if (session?.user && !initialFetchMade.current && (!stats || !activities)) {
      fetchDashboardData();
      initialFetchMade.current = true;
    }
  }, [session]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 size={40} className="animate-spin" />
        <p>Loading dashboard data...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button 
          onClick={() => fetchDashboardData()}
          className="action-button primary-button"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="welcome-section">
        <h1>Welcome back, {session?.user?.name}!</h1>
        <p>{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </section>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon leads">
                <Users size={24} />
              </div>
              <Activity size={20} className="trend-icon" />
            </div>
            <div className="stat-value">{stats.leadsCount}</div>
            <div className="stat-label">Total Leads</div>
            <div className="stat-trend">Under your management</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon followups">
                <CalendarClock size={24} />
              </div>
            </div>
            <div className="stat-value">{stats.followUpsCount}</div>
            <div className="stat-label">Active Follow-ups</div>
            <div className="stat-trend">{stats.pendingTodayFollowUps} pending today</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon revenue">
                <DollarSign size={24} />
              </div>
              <TrendingUp size={20} className="trend-icon" />
            </div>
            <div className="stat-value">{stats.revenue}</div>
            <div className="stat-label">Estimated Revenue</div>
            <div className="stat-trend">From closed deals</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon companies">
                <Building size={24} />
              </div>
            </div>
            <div className="stat-value">{stats.companiesCount}</div>
            <div className="stat-label">{stats.companiesCount === 1 ? 'Company' : 'Companies'}</div>
            <div className="stat-trend">Active Status</div>
          </div>
        </div>
      )}

      {activities && (
        <div className="content-grid">
          <div className="leads-section">
            <div className="section-header">
              <h2>Recent Leads</h2>
              <Link href="/dashboard/leads" className="view-all-button">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="leads-list">
              {activities.recentLeads.length === 0 ? (
                <div className="no-data-message">
                  <p>No leads found</p>
                </div>
              ) : (
                activities.recentLeads.map((lead) => (
                  <div key={lead.id} className="lead-item">
                    <div className="lead-avatar">
                      <UserCircle size={24} />
                    </div>
                    <div className="lead-content">
                      <div className="lead-header">
                        <h3>{lead.name}</h3>
                        <span className={`lead-status status-${lead.status.toLowerCase()}`}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="lead-details">
                        <div className="lead-contact">
                          <Phone size={14} />
                          {lead.phone}
                        </div>
                        <div className="lead-owner">
                          <UserCircle size={14} />
                          {lead.owner.name}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>          <div className="followups-section">
            <div className="section-header">
              <h2>Follow-ups Pending Action</h2>
              <Link href="/dashboard/follow-ups" className="view-all-button">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="followups-list">
              {activities.pendingFollowUps.length === 0 ? (
                <div className="no-data-message">
                  <p>No pending follow-ups</p>
                </div>
              ) : (
                activities.pendingFollowUps.map((followUp) => (
                  <div key={followUp.id} className="followup-item">
                    <div className="followup-content">
                      <div className="followup-header">
                        <h3>{followUp.lead.name}</h3>
                        <span className="followup-assignee">
                          {followUp.user.name}
                        </span>
                      </div>
                      <div className="followup-details">
                        <div className="followup-time">
                          <Calendar size={14} />
                          {new Date(followUp.reminderDate).toLocaleDateString()}
                        </div>
                        <div className="followup-time">
                          <Clock size={14} />
                          {new Date(followUp.reminderDate).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      <p className="followup-notes">{followUp.notes}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
