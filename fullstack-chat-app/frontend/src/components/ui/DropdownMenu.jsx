import React, { useState, useRef, useEffect } from 'react';

const DropdownMenu = ({ children, options, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (option) => {
    option.onClick();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {children}
      </div>

      {isOpen && (
        <div 
          className={`absolute z-10 mt-2 w-48 bg-base-100 border border-base-300 rounded-md shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="py-1">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-base-200 transition-colors duration-150"
              >
                {option.icon && <option.icon size={16} />}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;