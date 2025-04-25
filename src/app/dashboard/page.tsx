import type { Metadata } from "next";
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
  Activity
} from "lucide-react";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Dashboard | Real Estate CRM",
  description: "Dashboard for Real Estate Brokerage Lead Management System",
};

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <section className="welcome-section">
        <h1>Welcome back!</h1>
        <p>{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </section>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon leads">
              <Users size={24} />
            </div>
            <Activity size={20} className="trend-icon" />
          </div>
          <div className="stat-value">157</div>
          <div className="stat-label">Total Leads</div>
          <div className="stat-trend">+12% from last month</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon followups">
              <CalendarClock size={24} />
            </div>
          </div>
          <div className="stat-value">43</div>
          <div className="stat-label">Active Follow-ups</div>
          <div className="stat-trend">8 pending today</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon revenue">
              <DollarSign size={24} />
            </div>
            <TrendingUp size={20} className="trend-icon" />
          </div>
          <div className="stat-value">$1.25M</div>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-trend">+8% from last quarter</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon companies">
              <Building size={24} />
            </div>
          </div>
          <div className="stat-value">12</div>
          <div className="stat-label">Active Companies</div>
          <div className="stat-trend">Company Status Active</div>
        </div>
      </div>

      <div className="content-grid">
        <div className="leads-section">
          <div className="section-header">
            <h2>Recent Leads</h2>
            <Link href="/dashboard/leads" className="view-all-button">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="leads-list">
            {[
              {
                id: 1,
                name: "Sarah Johnson",
                phone: "+1 (555) 123-4567",
                property: "123 Main St, Apt 4B",
                status: "NEW"
              },
              {
                id: 2,
                name: "Michael Chen",
                phone: "+1 (555) 987-6543",
                property: "456 Park Ave",
                status: "CONTACTED"
              }
            ].map((lead) => (
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
                    <div className="lead-property">
                      <Home size={14} />
                      {lead.property}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="followups-section">
          <div className="section-header">
            <h2>Upcoming Follow-ups</h2>
            <Link href="/dashboard/follow-ups" className="view-all-button">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="followups-list">
            {[
              {
                id: 1,
                leadName: "Sarah Johnson",
                type: "Call",
                date: new Date(Date.now() + 86400000).toLocaleDateString(),
                time: "10:00 AM",
                notes: "Discuss financing options"
              },
              {
                id: 2,
                leadName: "Michael Chen",
                type: "Meeting",
                date: new Date(Date.now() + 172800000).toLocaleDateString(),
                time: "2:30 PM",
                notes: "Property viewing at 456 Park Ave"
              }
            ].map((followUp) => (
              <div key={followUp.id} className="followup-item">
                <div className="followup-content">
                  <div className="followup-header">
                    <h3>{followUp.leadName}</h3>
                    <span className={`followup-type type-${followUp.type.toLowerCase()}`}>
                      {followUp.type}
                    </span>
                  </div>
                  <div className="followup-details">
                    <div className="followup-time">
                      <Calendar size={14} />
                      {followUp.date}
                    </div>
                    <div className="followup-time">
                      <Clock size={14} />
                      {followUp.time}
                    </div>
                  </div>
                  <p className="followup-notes">{followUp.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
