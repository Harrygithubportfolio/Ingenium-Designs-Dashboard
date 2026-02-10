'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';

interface ResizablePanelProps {
  children: ReactNode;
  defaultSize?: number; // 0-100 percentage
  minSize?: number; // 0-100 percentage
  maxSize?: number; // 0-100 percentage
  orientation?: 'horizontal' | 'vertical';
  onResize?: (size: number) => void;
  className?: string;
  resizable?: boolean; // Toggle resize on/off
}

export default function ResizablePanel({
  children,
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  orientation = 'vertical',
  onResize,
  className = '',
  resizable = true,
}: ResizablePanelProps) {
  const [size, setSize] = useState(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(() => {
    if (!resizable) return;
    setIsResizing(true);
  }, [resizable]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const container = containerRef.current.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      let newSize: number;

      if (orientation === 'vertical') {
        newSize = ((e.clientY - rect.top) / rect.height) * 100;
      } else {
        newSize = ((e.clientX - rect.left) / rect.width) * 100;
      }

      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(newSize);
      onResize?.(newSize);
    },
    [isResizing, orientation, minSize, maxSize, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = orientation === 'vertical' ? 'ns-resize' : 'ew-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp, orientation]);

  const sizeStyle = orientation === 'vertical' ? { height: `${size}%` } : { width: `${size}%` };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col min-h-0 ${className}`}
      style={sizeStyle}
    >
      {children}

      {resizable && (
        <div
          className={`absolute ${
            orientation === 'vertical'
              ? 'bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:h-1.5'
              : 'right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:w-1.5'
          } group z-10`}
          onMouseDown={handleMouseDown}
        >
          <div
            className={`${
              orientation === 'vertical' ? 'h-full' : 'w-full h-full'
            } bg-[#3b82f6]/0 group-hover:bg-[#3b82f6]/50 transition-all ${
              isResizing ? 'bg-[#3b82f6]' : ''
            }`}
          />
        </div>
      )}
    </div>
  );
}
