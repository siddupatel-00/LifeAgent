import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomSelect = ({ value, onChange, options = [], style, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 240 && rect.top > spaceBelow) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
    setIsOpen(prev => !prev);
  };

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div 
      ref={containerRef} 
      className="custom-select-container"
      style={{ position: 'relative', width: style?.width || (className ? 'auto' : '100%') }}
    >
      <div 
        className={`custom-select-trigger ${className || ''}`}
        onClick={handleToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: style?.padding || (className ? '' : '12px 14px'),
          borderRadius: style?.borderRadius || (className ? '' : '12px'),
          background: style?.background || (className ? '' : 'var(--bg-main)'),
          border: style?.border || (className ? '' : '1px solid var(--border-color)'),
          color: style?.color || (className ? '' : 'var(--text-main)'),
          fontSize: style?.fontSize || (className ? '' : '0.9rem'),
          cursor: 'pointer',
          userSelect: 'none',
          ...(style || {})
        }}
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown size={16} style={{ color: 'inherit', opacity: 0.7, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
      </div>

      {isOpen && (
        <div 
          className="custom-select-dropdown glass-panel"
          style={{
            position: 'absolute',
            top: openUpwards ? 'auto' : 'calc(100% + 4px)',
            bottom: openUpwards ? 'calc(100% + 4px)' : 'auto',
            left: 0,
            right: 0,
            minWidth: '140px',
            zIndex: 9999999,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
            maxHeight: style?.maxHeight || '240px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '4px'
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className="custom-select-option"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange({ target: { value: option.value } });
                setIsOpen(false);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange({ target: { value: option.value } });
                setIsOpen(false);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                color: value === option.value ? 'var(--accent-blue)' : 'var(--text-main)',
                background: value === option.value ? 'rgba(var(--accent-blue-rgb), 0.1)' : 'transparent',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                if (value !== option.value) e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (value !== option.value) e.currentTarget.style.background = 'transparent';
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
