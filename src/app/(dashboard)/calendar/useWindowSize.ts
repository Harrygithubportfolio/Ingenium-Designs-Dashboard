'use client';

import { useState, useEffect } from 'react';

export function useWindowSize() {
  const [size, setSize] = useState({
    width: 0,
    height: 0,
    ready: false,
  });

  useEffect(() => {
    const getSize = () => ({
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      ready: true,
    });

    const handleResize = () => setSize(getSize());

    // Set initial size on mount
    handleResize();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return size;
}