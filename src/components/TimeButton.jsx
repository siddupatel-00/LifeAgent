import React, { useState } from 'react';
import TimePicker from './TimePicker';

function formatTimeDisplay(timeStr) {
  if (!timeStr) return '12:00 AM';
  let [h, m] = timeStr.split(':');
  let hNum = Number(h) || 0;
  const isAm = hNum < 12;
  if (hNum === 0) hNum = 12;
  else if (hNum > 12) hNum -= 12;
  return `${hNum}:${m} ${isAm ? 'AM' : 'PM'}`;
}

export default function TimeButton({ value, onChange, className, style, disabled }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className || "glass-input"}
        style={{ 
          cursor: disabled ? 'default' : 'pointer', 
          background: 'var(--glass-bg, rgba(255,255,255,0.05))',
          color: 'var(--text-main, #ffffff)',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '0.9rem',
          fontWeight: 500,
          ...style 
        }}
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        {formatTimeDisplay(value)}
      </button>
      <TimePicker
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={onChange}
        initialTime={value}
      />
    </>
  );
}
