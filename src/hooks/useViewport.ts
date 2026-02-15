'use client';

import { useState, useEffect } from 'react';

export type DeviceClass = 'pi' | 'mobile' | 'tablet' | 'desktop' | 'xl';

export function useViewport() {
  const [device, setDevice] = useState<DeviceClass>('desktop');
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setDimensions({ w, h });

      if (w <= 1280 && h <= 720 && w > 640) setDevice('pi');
      else if (w < 640) setDevice('mobile');
      else if (w < 1024) setDevice('tablet');
      else if (w < 1440) setDevice('desktop');
      else setDevice('xl');
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const isTouchDevice = device === 'pi' || device === 'mobile' || device === 'tablet';

  return { device, isTouchDevice, ...dimensions };
}
