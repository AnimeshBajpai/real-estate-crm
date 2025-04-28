"use client";

import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, User, Check, Users } from 'lucide-react';
import './filter-dropdown.css';

type Option = {
  id: string;
  name: string;
  role?: string;
  company?: { name: string };
  icon?: React.ReactNode;
};

interface FilterDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export function FilterDropdown({ 
  options, 
  value, 
  onChange, 
  placeholder,
  icon = <Users size={16} />,
  isLoading = false 
}: FilterDropdownProps) {
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
          {icon && <span className="filter-dropdown-icon">{icon}</span>}
          <span className="filter-dropdown-label">
            {selectedOption ? selectedOption.name : placeholder}
          </span>
        </div>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="filter-dropdown-menu" role="listbox">
          {/* Only render placeholder option if it's different from the first option */}
          {(!options.length || options[0]?.id !== '' || options[0]?.name !== placeholder) && (
            <div 
              className={`filter-dropdown-option ${!value ? 'selected' : ''}`}
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
            >
              <span className="filter-dropdown-icon">{icon}</span>
              <span className="filter-dropdown-label">{placeholder}</span>
              {!value && <Check size={16} className="filter-dropdown-check" />}
            </div>
          )}
          
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
                  {option.icon || <User size={16} />}
                </span>
                <span className="filter-dropdown-label">
                  {option.name}
                  {option.company?.name && ` (${option.company.name})`}
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
