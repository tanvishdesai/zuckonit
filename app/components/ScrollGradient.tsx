'use client';

import { useEffect, useState } from 'react';

interface ScrollGradientProps {
  strength?: 'subtle' | 'medium' | 'strong';
}

export function ScrollGradient({ strength = 'medium' }: ScrollGradientProps) {
  const [scrollY, setScrollY] = useState(0);
  const [currentStrength, setCurrentStrength] = useState(strength);
  
  useEffect(() => {
    // Check for saved preference
    const savedStrength = localStorage.getItem('gradientStrength') as 'subtle' | 'medium' | 'strong';
    if (savedStrength) {
      setCurrentStrength(savedStrength);
    }
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    const handleRefreshGradient = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.strength) {
        setCurrentStrength(customEvent.detail.strength);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('refreshGradient', handleRefreshGradient);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('refreshGradient', handleRefreshGradient);
    };
  }, []);
  
  // Base opacity values for different strength levels
  const strengthMap = {
    subtle: {
      topBase: 0.05,
      topMax: 0.15,
      bottomBase: 0.1,
      bottomMax: 0.2,
    },
    medium: {
      topBase: 0.1,
      topMax: 0.25,
      bottomBase: 0.15,
      bottomMax: 0.3,
    },
    strong: {
      topBase: 0.15,
      topMax: 0.35,
      bottomBase: 0.2,
      bottomMax: 0.4,
    }
  };
  
  const { topBase, topMax, bottomBase, bottomMax } = strengthMap[currentStrength];
  
  // Calculate opacity based on scroll position with adjusted strength
  const topOpacity = Math.max(topBase, Math.min(topMax, topBase + (scrollY / 1500)));
  const bottomOpacity = Math.max(bottomBase, Math.min(bottomMax, bottomBase + (scrollY / 1000)));
  
  return (
    <div 
      className="fixed inset-0 bg-gradient-to-b pointer-events-none z-0"
      style={{
        background: `linear-gradient(to bottom, 
          rgba(var(--primary-rgb), ${topOpacity}) 0%, 
          rgba(0, 0, 0, 0) 50%, 
          rgba(var(--primary-rgb), ${bottomOpacity}) 100%)`
      }}
    />
  );
} 