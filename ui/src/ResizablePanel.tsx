import { useState, useEffect, useRef, useCallback } from 'react';

interface Props {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  minRightWidth?: number;
  storageKey?: string;
}

export function ResizablePanel({ 
  leftPanel, 
  rightPanel, 
  defaultLeftWidth = 400,
  minLeftWidth = 250,
  maxLeftWidth,
  minRightWidth = 300,
  storageKey = 'resizable_panel_width'
}: Props) {
  const [leftWidth, setLeftWidth] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? parseInt(saved, 10) : defaultLeftWidth;
  });
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const newLeftWidth = e.clientX - containerRect.left;
    
    // Ensure both panels respect their min widths
    const rightWidth = containerWidth - newLeftWidth - 4; // 4px for resize handle
    
    if (newLeftWidth >= minLeftWidth && rightWidth >= minRightWidth) {
      setLeftWidth(newLeftWidth);
    }
  }, [isResizing, minLeftWidth, maxLeftWidth, minRightWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    localStorage.setItem(storageKey, String(leftWidth));
  }, [leftWidth, storageKey]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        display: 'flex', 
        gap: 0,
        width: '100%',
        height: '100%'
      }}
    >
      {/* Left Panel */}
      <div style={{ 
        width: `${leftWidth}px`,
        minWidth: `${minLeftWidth}px`,
        flexShrink: 0,
        overflow: 'hidden'
      }}>
        {leftPanel}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: '4px',
          cursor: 'col-resize',
          background: 'transparent',
          position: 'relative',
          flexShrink: 0,
          zIndex: 10
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
        }}
        onMouseLeave={(e) => {
          if (!isResizing) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <div style={{
          position: 'absolute',
          left: '-2px',
          top: 0,
          bottom: 0,
          width: '4px',
          background: isResizing ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
          transition: isResizing ? 'none' : 'background 0.2s'
        }} />
      </div>

      {/* Right Panel */}
      <div style={{ 
        flex: 1,
        minWidth: `${minRightWidth}px`,
        overflow: 'hidden'
      }}>
        {rightPanel}
      </div>
    </div>
  );
}

