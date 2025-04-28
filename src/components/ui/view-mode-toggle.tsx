"use client";

import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, User, Check, Users, Filter } from 'lucide-react';
import './filter-dropdown.css';

type ViewModeOption = 'all' | 'bySubbroker';

interface ViewModeToggleProps {
  value: ViewModeOption;
  onChange: (value: ViewModeOption) => void;
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const options = [
    { id: 'all', name: 'All Leads', icon: <Users size={16} /> },
    { id: 'bySubbroker', name: 'By Subbroker', icon: <User size={16} /> }
  ];

  return (
    <div className="filter-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="filter-dropdown-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="filter-dropdown-section">
          <span className="filter-dropdown-icon"><Filter size={16} /></span>
          <span className="filter-dropdown-label">
            {value === 'all' ? 'All Leads' : 'By Subbroker'}
          </span>
        </div>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="filter-dropdown-menu" role="listbox">
          {options.map(option => (
            <div 
              key={option.id}
              className={`filter-dropdown-option ${value === option.id ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.id as ViewModeOption);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={value === option.id}
            >
              <span className="filter-dropdown-icon">
                {option.icon}
              </span>
              <span className="filter-dropdown-label">
                {option.name}
              </span>
              {value === option.id && <Check size={16} className="filter-dropdown-check" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
