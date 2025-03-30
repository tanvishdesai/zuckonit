'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export function GradientStrengthControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [strength, setStrength] = useState<'subtle' | 'medium' | 'strong'>('medium');
  
  useEffect(() => {
    // Load saved preference
    const savedStrength = localStorage.getItem('gradientStrength') as 'subtle' | 'medium' | 'strong';
    if (savedStrength) {
      setStrength(savedStrength);
      // Apply immediately
      document.documentElement.setAttribute('data-gradient-strength', savedStrength);
    }
  }, []);
  
  const handleStrengthChange = (newStrength: 'subtle' | 'medium' | 'strong') => {
    setStrength(newStrength);
    localStorage.setItem('gradientStrength', newStrength);
    // Apply immediately
    document.documentElement.setAttribute('data-gradient-strength', newStrength);
    
    // Refresh the gradient (re-mount ScrollGradient)
    const event = new CustomEvent('refreshGradient', { detail: { strength: newStrength } });
    document.dispatchEvent(event);
  };
  
  if (!isOpen) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed bottom-4 right-4 z-50 bg-card/50 backdrop-blur-sm rounded-full h-10 w-10"
        onClick={() => setIsOpen(true)}
      >
        <Settings className="h-4 w-4" />
      </Button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card shadow-lg rounded-lg p-3 border border-border/40">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-sm font-medium">Gradient Strength</h4>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
            <span className="sr-only">Close</span>
            <span aria-hidden="true">&times;</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-1">
          <Button 
            size="sm" 
            variant={strength === 'subtle' ? 'default' : 'outline'}
            className="text-xs h-8"
            onClick={() => handleStrengthChange('subtle')}
          >
            Subtle
          </Button>
          <Button 
            size="sm" 
            variant={strength === 'medium' ? 'default' : 'outline'}
            className="text-xs h-8"
            onClick={() => handleStrengthChange('medium')}
          >
            Medium
          </Button>
          <Button 
            size="sm" 
            variant={strength === 'strong' ? 'default' : 'outline'}
            className="text-xs h-8"
            onClick={() => handleStrengthChange('strong')}
          >
            Strong
          </Button>
        </div>
      </div>
    </div>
  );
} 