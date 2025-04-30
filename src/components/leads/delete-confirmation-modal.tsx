"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Notification } from "@/components/ui/notification";
import "./delete-confirmation-modal.css";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  leadName: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  leadName
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");
    
    try {
      await onConfirm();
      setNotification({
        type: "success",
        message: "Lead deleted successfully"
      });
      
      // Close the modal after successful deletion
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete lead";
      setError(message);
      setNotification({
        type: "error",
        message
      });
    } finally {
      setIsDeleting(false);
    }
  };  if (!isOpen) return null;  return (    <>      <div className="modal-overlay">        <div className="modal-content delete-confirmation-modal">          <div className="modal-header">            <h2>Delete Lead</h2>            <button onClick={onClose} className="close-button">              <X size={24} />
            </button>
          </div>

          <div className="modal-body">
            <div className="warning-icon">
              <AlertTriangle size={48} className="warning-triangle" />
            </div>
            
            <p className="confirmation-text">
              Are you sure you want to delete <strong>{leadName}</strong>?
            </p>
            
            <p className="confirmation-subtext">
              This action cannot be undone. This will permanently delete the lead and all associated data.
            </p>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              onClick={onClose} 
              className="cancel-button"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleDelete} 
              className="delete-button"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Lead"}
            </button>
          </div>
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
