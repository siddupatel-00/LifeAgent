import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { Keyboard, Clock } from 'lucide-react';

function parseTime(timeStr) {
  if (!timeStr) return { h: '12', m: '00', isAm: true };
  let [hh, mm] = timeStr.split(':');
  if (!hh || !mm) return { h: '12', m: '00', isAm: true };
  let hhNum = Number(hh);
  let mmNum = Number(mm);
  if (isNaN(hhNum)) hhNum = 12;
  if (isNaN(mmNum)) mmNum = 0;

  const isAm = hhNum < 12;
  let h12 = hhNum % 12;
  if (h12 === 0) h12 = 12;
  return {
    h: String(h12).padStart(2, '0'),
    m: String(mmNum).padStart(2, '0'),
    isAm
  };
}

function formatTime(hStr, mStr, isAm) {
  let h24 = Number(hStr);
  if (isAm && h24 === 12) h24 = 0;
  else if (!isAm && h24 !== 12) h24 += 12;
  return `${String(h24).padStart(2, '0')}:${String(mStr).padStart(2, '0')}`;
}

export default function TimePicker({ isOpen, onClose, onSave, initialTime = '08:00' }) {
  const [h, setH] = useState('12');
  const [m, setM] = useState('00');
  const [isAm, setIsAm] = useState(true);
  const [mode, setMode] = useState('hours'); // 'hours' | 'minutes'
  const [isKeyboard, setIsKeyboard] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dialRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const parsed = parseTime(initialTime);
      setH(parsed.h);
      setM(parsed.m);
      setIsAm(parsed.isAm);
      setMode('hours');
      setIsKeyboard(false);
    }
  }, [isOpen, initialTime]);

  const handleSave = () => {
    onSave(formatTime(h, m, isAm));
    onClose();
  };

  const handleClear = () => {
    setH('12');
    setM('00');
    setIsAm(true);
  };

  // Clock dial math
  const CENTER = 120;
  const RADIUS = 88;

  const getPositionForValue = (val, maxVal) => {
    let angleDeg = 0;
    if (maxVal === 12) {
      angleDeg = (Number(val) % 12) * 30 - 90;
    } else {
      angleDeg = Number(val) * 6 - 90;
    }
    const rad = (angleDeg * Math.PI) / 180;
    const x = CENTER + RADIUS * Math.cos(rad);
    const y = CENTER + RADIUS * Math.sin(rad);
    return { x, y, angleDeg };
  };

  const updateFromPointerEvent = (e) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);

    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (mode === 'hours') {
      let selectedH = Math.round(angle / 30);
      if (selectedH === 0) selectedH = 12;
      setH(String(selectedH).padStart(2, '0'));
    } else {
      let selectedM = Math.round(angle / 6);
      if (selectedM === 60) selectedM = 0;
      setM(String(selectedM).padStart(2, '0'));
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    updateFromPointerEvent(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      updateFromPointerEvent(e);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (mode === 'hours') {
        setMode('minutes');
      }
    }
  };

  useEffect(() => {
    if (isDragging) {
      const onMove = (e) => handleMouseMove(e);
      const onUp = () => handleMouseUp();
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove);
      window.addEventListener('touchend', onUp);
      return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onUp);
      };
    }
  }, [isDragging, mode]);

  // Generate dial numbers
  const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const currentVal = mode === 'hours' ? Number(h) : Number(m);
  const maxVal = mode === 'hours' ? 12 : 60;
  const { x: pointerX, y: pointerY } = getPositionForValue(currentVal, maxVal);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="340px"
      zIndex={1000000}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '-12px' }}>
        
        {/* Header Display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card-hover, rgba(255,255,255,0.06))',
          padding: '16px 20px',
          borderRadius: '16px',
          border: '1px solid var(--border-color, rgba(255,255,255,0.1))'
        }}>
          {/* Time digits */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setMode('hours')}
              style={{
                fontSize: '2.8rem',
                fontWeight: '700',
                fontFamily: 'var(--font-sans, sans-serif)',
                background: mode === 'hours' ? 'var(--accent-blue-dim, rgba(59,130,246,0.25))' : 'transparent',
                color: mode === 'hours' ? 'var(--accent-blue-light, #60a5fa)' : 'var(--text-main, #ffffff)',
                border: mode === 'hours' ? '1px solid var(--accent-blue, #3b82f6)' : '1px solid transparent',
                borderRadius: '12px',
                padding: '2px 10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {h}
            </button>

            <span style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-muted, #94a3b8)', lineHeight: 1 }}>:</span>

            <button
              type="button"
              onClick={() => setMode('minutes')}
              style={{
                fontSize: '2.8rem',
                fontWeight: '700',
                fontFamily: 'var(--font-sans, sans-serif)',
                background: mode === 'minutes' ? 'var(--accent-blue-dim, rgba(59,130,246,0.25))' : 'transparent',
                color: mode === 'minutes' ? 'var(--accent-blue-light, #60a5fa)' : 'var(--text-main, #ffffff)',
                border: mode === 'minutes' ? '1px solid var(--accent-blue, #3b82f6)' : '1px solid transparent',
                borderRadius: '12px',
                padding: '2px 10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {m}
            </button>
          </div>

          {/* AM / PM selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setIsAm(true)}
              style={{
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: '700',
                borderRadius: '8px',
                border: isAm ? '1px solid var(--accent-blue, #3b82f6)' : '1px solid var(--border-color, rgba(255,255,255,0.1))',
                background: isAm ? 'var(--accent-blue, #3b82f6)' : 'rgba(255,255,255,0.05)',
                color: isAm ? 'var(--accent-text, #ffffff)' : 'var(--text-muted, #a1a1aa)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => setIsAm(false)}
              style={{
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: '700',
                borderRadius: '8px',
                border: !isAm ? '1px solid var(--accent-blue, #3b82f6)' : '1px solid var(--border-color, rgba(255,255,255,0.1))',
                background: !isAm ? 'var(--accent-blue, #3b82f6)' : 'rgba(255,255,255,0.05)',
                color: !isAm ? 'var(--accent-text, #ffffff)' : 'var(--text-muted, #a1a1aa)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              PM
            </button>
          </div>
        </div>

        {/* Content View: Analog Clock Face OR Direct Keyboard Input */}
        {!isKeyboard ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <div
              ref={dialRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              style={{
                position: 'relative',
                width: '240px',
                height: '240px',
                borderRadius: '50%',
                background: 'var(--bg-card-hover, rgba(255,255,255,0.04))',
                border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                userSelect: 'none',
                touchAction: 'none',
                cursor: 'pointer'
              }}
            >
              {/* SVG overlay for Pointer & Pin */}
              <svg width="240" height="240" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}>
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={pointerX}
                  y2={pointerY}
                  stroke="var(--accent-blue, #3b82f6)"
                  strokeWidth="2.5"
                />
                <circle cx={CENTER} cy={CENTER} r="4.5" fill="var(--accent-blue, #3b82f6)" />
                <circle cx={pointerX} cy={pointerY} r="18" fill="var(--accent-blue, #3b82f6)" />
                {mode === 'minutes' && Number(m) % 5 !== 0 && (
                  <circle cx={pointerX} cy={pointerY} r="3" fill="var(--accent-text, #ffffff)" />
                )}
              </svg>

              {/* Numbers around the clock face */}
              {(mode === 'hours' ? hourNumbers : minuteNumbers).map((num) => {
                const pos = getPositionForValue(num, maxVal);
                const isSelected = mode === 'hours'
                  ? Number(h) === (num === 0 ? 12 : num)
                  : Number(m) === num;
                const label = mode === 'minutes' ? String(num).padStart(2, '0') : String(num);

                return (
                  <div
                    key={num}
                    style={{
                      position: 'absolute',
                      left: `${pos.x}px`,
                      top: `${pos.y}px`,
                      transform: 'translate(-50%, -50%)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.92rem',
                      fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? 'var(--accent-text, #ffffff)' : 'var(--text-main, #ffffff)',
                      zIndex: 2,
                      pointerEvents: 'none'
                    }}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '24px 16px',
            background: 'var(--bg-card-hover, rgba(255,255,255,0.03))',
            borderRadius: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hour (1-12)</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={h}
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (val > 12) val = 12;
                    if (val < 1) val = 1;
                    setH(String(val).padStart(2, '0'));
                  }}
                  style={{
                    width: '70px',
                    height: '56px',
                    textAlign: 'center',
                    fontSize: '1.8rem',
                    fontWeight: '700',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-muted)', marginTop: '20px' }}>:</span>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Minute (0-59)</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={m}
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (val > 59) val = 59;
                    if (val < 0) val = 0;
                    setM(String(val).padStart(2, '0'));
                  }}
                  style={{
                    width: '70px',
                    height: '56px',
                    textAlign: 'center',
                    fontSize: '1.8rem',
                    fontWeight: '700',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '8px'
        }}>
          {/* Keyboard / Clock Toggle Icon Button */}
          <button
            type="button"
            onClick={() => setIsKeyboard(!isKeyboard)}
            title={isKeyboard ? "Switch to clock view" : "Switch to keyboard input"}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isKeyboard ? <Clock size={22} /> : <Keyboard size={22} />}
          </button>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                padding: '6px 10px'
              }}
            >
              CLEAR
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                padding: '6px 10px'
              }}
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-blue-light, #60a5fa)',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer',
                padding: '6px 12px'
              }}
            >
              SET
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
