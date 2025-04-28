"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { X, User, Phone, Key } from "lucide-react";
import "./add-subbroker-modal.css";

interface AddSubbrokerModalProps {
  onClose: () => void;
  onSubbrokerAdded: () => void;
  selectedCompanyId?: string; // Optional for super admins
}

export function AddSubbrokerModal({ onClose, onSubbrokerAdded, selectedCompanyId }: AddSubbrokerModalProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.phone.trim() || !formData.password) {
      setError("All fields are required");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (formData.phone.length < 10) {
      setError("Phone number must be at least 10 digits");
      return;
    }
    
    try {
      setIsLoading(true);
      setError("");
        // Prepare request body - include companyId for super admins
      const requestBody: any = {
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        role: "SUB_BROKER"
      };
      
      // If super admin is adding with a selected company
      if (session?.user?.role === 'SUPER_ADMIN' && selectedCompanyId) {
        requestBody.companyId = selectedCompanyId;
      }
      
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create sub-broker");
      }
      
      onSubbrokerAdded();
    } catch (err: any) {
      setError(err.message || "Failed to create sub-broker");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="add-subbroker-modal">
        <div className="modal-header">
          <h2>Add New Sub-broker</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-container">
              <User size={18} className="input-icon" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <div className="input-container">
              <Phone size={18} className="input-icon" />
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
              />
            </div>
            <small className="helper-text">This will be used as the username for login</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-container">
              <Key size={18} className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-container">
              <Key size={18} className="input-icon" />
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                required
              />
            </div>
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
              {isLoading ? "Adding..." : "Add Sub-broker"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
