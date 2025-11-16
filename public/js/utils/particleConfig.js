export const particlePresets = {
  minimal: {
    particleCount: 50,
    maxSize: 2,
    minSize: 0.5,
    speed: 0.2,
    connectionDistance: 0,
    showConnections: false,
    twinkle: true
  },
  
  standard: {
    particleCount: 100,
    maxSize: 3,
    minSize: 0.5,
    speed: 0.3,
    connectionDistance: 100,
    showConnections: true,
    twinkle: true
  },
  
  cosmic: {
    particleCount: 150,
    maxSize: 3,
    minSize: 0.5,
    speed: 0.3,
    connectionDistance: 120,
    showConnections: true,
    twinkle: true
  },
  
  intense: {
    particleCount: 200,
    maxSize: 4,
    minSize: 0.5,
    speed: 0.4,
    connectionDistance: 150,
    showConnections: true,
    twinkle: true
  }
};

// Auto-detect performance
export function getOptimalPreset() {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isLowEnd = navigator.hardwareConcurrency <= 4;
  
  if (isMobile || isLowEnd) {
    return particlePresets.minimal;
  } else if (navigator.hardwareConcurrency >= 8) {
    return particlePresets.cosmic;
  } else {
    return particlePresets.standard;
  }
}