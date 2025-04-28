"use client";

import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, Building, Check, Users } from 'lucide-react';
import '@/components/ui/filter-dropdown.css';

type CompanyOption = {
  id: string;
  name: string;
  icon?: React.ReactNode;
};

interface CompanyFilterDropdownProps {
  options: CompanyOption[];
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}

export function CompanyFilterDropdown({ 
  options, 
  value, 
  onChange, 
  isLoading = false 
}: CompanyFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the currently selected option
  const selectedOption = options.find(option => option.id === value);

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
          <span className="filter-dropdown-icon">
            {selectedOption ? <Building size={16} /> : <Building size={16} />}
          </span>
          <span className="filter-dropdown-label">
            {selectedOption ? selectedOption.name : "All Companies"}
          </span>
        </div>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="filter-dropdown-menu" role="listbox">
          <div 
            className={`filter-dropdown-option ${!value ? 'selected' : ''}`}
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
          >
            <span className="filter-dropdown-icon"><Building size={16} /></span>
            <span className="filter-dropdown-label">All Companies</span>
            {!value && <Check size={16} className="filter-dropdown-check" />}
          </div>
          
          {isLoading ? (
            <div className="filter-dropdown-option">
              <span>Loading...</span>
            </div>
          ) : (
            options.map(option => (
              <div 
                key={option.id}
                className={`filter-dropdown-option ${value === option.id ? 'selected' : ''}`}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                role="option"
                aria-selected={value === option.id}
              >
                <span className="filter-dropdown-icon">
                  <Building size={16} />
                </span>
                <span className="filter-dropdown-label">
                  {option.name}
                </span>
                {value === option.id && <Check size={16} className="filter-dropdown-check" />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
