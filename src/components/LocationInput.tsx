import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { LocationService } from '@/services/locationService';

interface LocationInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  suggestions?: string[];
  onNewEntry?: (value: string) => void;
}

const LocationInput: React.FC<LocationInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "Enter location",
  required = false,
  className = "",
  suggestions = [],
  onNewEntry
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = (suggestions || []).filter(suggestion =>
        suggestion && typeof suggestion === 'string' && suggestion.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions((suggestions || []).slice(0, 10)); // Show first 10 suggestions
    }
  }, [inputValue, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        handleSuggestionClick(filteredSuggestions[0]);
      } else if (inputValue.trim() && onNewEntry) {
        onNewEntry(inputValue.trim());
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#90C641] focus:border-[#90C641] pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
        
        {/* Suggestions Dropdown */}
        {isOpen && (filteredSuggestions.length > 0 || inputValue.trim()) && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredSuggestions.length > 0 ? (
              <>
                {filteredSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-700">{suggestion}</span>
                    </div>
                  </div>
                ))}
                {inputValue.trim() && !filteredSuggestions.includes(inputValue.trim()) && (
                  <div
                    onClick={() => {
                      if (onNewEntry) {
                        onNewEntry(inputValue.trim());
                        setIsOpen(false);
                      }
                    }}
                    className="px-4 py-2 hover:bg-green-50 cursor-pointer border-t border-gray-200 bg-green-50"
                  >
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-green-700">
                        Add "{inputValue.trim()}" as new location
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : inputValue.trim() ? (
              <div
                onClick={() => {
                  if (onNewEntry) {
                    onNewEntry(inputValue.trim());
                    setIsOpen(false);
                  }
                }}
                className="px-4 py-2 hover:bg-green-50 cursor-pointer"
              >
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm text-green-700">
                    Add "{inputValue.trim()}" as new location
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationInput;
