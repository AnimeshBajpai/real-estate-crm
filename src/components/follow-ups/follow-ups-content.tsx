"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  UserPlus,
  Filter,
  Phone,
  Calendar,
  Check,
  MoreVertical,
  Clock,
  Plus,
  CalendarClock
} from "lucide-react";
import { AddFollowUpModal } from "@/components/follow-ups/add-follow-up-modal";
import { Notification } from "@/components/ui/notification";
import "@/app/dashboard/follow-ups/follow-ups.css";
import { format } from "date-fns";

interface FollowUp {
  id: string;
  notes: string;
  reminderDate: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  leadId: string;
  userId: string;
  lead: {
    id: string;
    name: string;
    phone: string;
    status: string;
  };
  user: {
    id: string;
    name: string;
    phone: string;
  };
}

export default function FollowUpsContent() {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');

  const fetchFollowUps = async () => {
    if (status !== 'authenticated') {
      console.log('Session not authenticated:', { status, session });
      return;
    }
    
    try {
      setIsLoading(true);
      let url = '/api/followups';
      
      if (filter === 'upcoming') {
        url += '?upcoming=true&completed=false';
      } else if (filter === 'completed') {
        url += '?completed=true';
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setFollowUps(data);
    } catch (err: any) {
      setError(err.message);
      setNotification({ type: 'error', message: 'Failed to load follow-ups' });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchFollowUps();
    }
  }, [status, filter]);
  
  const handleAddFollowUp = () => {
    setIsModalOpen(true);
  };
  
  const handleFollowUpCreated = () => {
    setIsModalOpen(false);
    setNotification({ type: 'success', message: 'Follow-up added successfully' });
    fetchFollowUps();
  };
  
  const markAsCompleted = async (followUpId: string) => {
    try {
      const response = await fetch(`/api/followups/${followUpId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed: true })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update follow-up status');
      }
      
      setNotification({ type: 'success', message: 'Follow-up marked as completed' });
      fetchFollowUps();
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to update follow-up status' });
    }
  };

  if (isLoading) {
    return <div className="loading-container">Loading follow-ups...</div>;
  }

  return (
    <div className="follow-ups-content">
      <div className="header">
        <h1 className="title">Follow-ups</h1>
        <div className="actions">
          <div className="filter-actions">
            <button 
              className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setFilter('upcoming')}
            >
              <Clock size={18} />
              Upcoming
            </button>
            <button 
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              <Check size={18} />
              Completed
            </button>
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <Filter size={18} />
              All
            </button>
          </div>
          <button className="add-btn" onClick={handleAddFollowUp}>
            <Plus size={18} />
            Add Follow-Up
          </button>
        </div>
      </div>

      {followUps.length === 0 ? (
        <div className="no-data">
          <CalendarClock size={48} />
          <p>No follow-ups found</p>
          <button className="add-btn" onClick={handleAddFollowUp}>Add Your First Follow-Up</button>
        </div>
      ) : (
        <div className="follow-ups-list">
          {followUps.map((followUp) => (
            <div key={followUp.id} className={`follow-up-card ${followUp.completed ? 'completed' : ''}`}>
              <div className="follow-up-date">
                <Calendar size={20} />
                <span>{format(new Date(followUp.reminderDate), 'MMM d, yyyy')}</span>
              </div>
              <div className="follow-up-details">
                <h3 className="lead-name">{followUp.lead.name}</h3>
                <p className="notes">{followUp.notes}</p>
                <div className="contact">
                  <Phone size={16} />
                  <a href={`tel:${followUp.lead.phone}`}>{followUp.lead.phone}</a>
                </div>
              </div>
              <div className="follow-up-actions">
                {!followUp.completed && (
                  <button 
                    className="complete-btn"
                    onClick={() => markAsCompleted(followUp.id)}
                  >
                    <Check size={18} />
                    Mark Complete
                  </button>
                )}
                <button className="more-btn">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <AddFollowUpModal
          onClose={() => setIsModalOpen(false)}
          onFollowUpCreated={handleFollowUpCreated}
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
