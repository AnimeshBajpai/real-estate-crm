"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import "./notification.css";

interface NotificationProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export function Notification({ message, type, onClose, duration = 5000 }: NotificationProps) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`notification notification-${type}`}>
      <p>{message}</p>
      <button onClick={onClose} className="notification-close">
        <X size={16} />
      </button>
    </div>
  );
}
