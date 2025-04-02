'use client';

import { createContext, useContext, useEffect } from 'react';

// Create a context for theme values
export const ThemeContext = createContext<{
  applyTheme: () => void;
}>({
  applyTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Function to apply theme from localStorage
  const applyTheme = () => {
    // Get saved theme preferences
    const savedColor = localStorage.getItem('primaryColor') || 'violet';
    const savedFontSize = localStorage.getItem('fontSize') || '16';
    const savedDarkMode = localStorage.getItem('darkMode');
    
    // Apply dark mode
    if (savedDarkMode === 'true') {
      document.documentElement.classList.remove('light');
    } else if (savedDarkMode === 'false') {
      document.documentElement.classList.add('light');
    }
    
    // Define color values for each theme using OKLCH color format
    const colorValues: Record<string, { primary: string, primaryForeground: string, rgbValues: string }> = {
      violet: {
        primary: 'oklch(0.6 0.243 290)',
        primaryForeground: 'oklch(0.985 0 0)',
        rgbValues: '139, 92, 246' // violet-600 RGB values
      },
      blue: {
        primary: 'oklch(0.6 0.2 240)',
        primaryForeground: 'oklch(0.985 0 0)',
        rgbValues: '37, 99, 235' // blue-600 RGB values
      },
      green: {
        primary: 'oklch(0.6 0.2 140)',
        primaryForeground: 'oklch(0.985 0 0)',
        rgbValues: '22, 163, 74' // green-600 RGB values
      },
      red: {
        primary: 'oklch(0.6 0.2 30)',
        primaryForeground: 'oklch(0.985 0 0)',
        rgbValues: '220, 38, 38' // red-600 RGB values
      },
      yellow: {
        primary: 'oklch(0.7 0.2 85)',
        primaryForeground: 'oklch(0.145 0 0)',
        rgbValues: '202, 138, 4' // yellow-600 RGB values
      }
    };
    
    // Apply color theme
    const selectedColor = colorValues[savedColor];
    if (selectedColor) {
      // Set the primary color
      document.documentElement.style.setProperty('--primary', selectedColor.primary);
      document.documentElement.style.setProperty('--primary-foreground', selectedColor.primaryForeground);
      
      // Set RGB values for use in rgba() functions
      document.documentElement.style.setProperty('--primary-rgb', selectedColor.rgbValues);
      
      // Also update sidebar colors which use the same primary
      document.documentElement.style.setProperty('--sidebar-primary', selectedColor.primary);
      document.documentElement.style.setProperty('--sidebar-primary-foreground', selectedColor.primaryForeground);
      
      // Update any gradients or special effects
      updateGradients(savedColor);
    }
    
    // Apply font size
    document.documentElement.style.fontSize = `${parseInt(savedFontSize, 10)}px`;
  };
  
  // Function to update gradients based on the selected color
  const updateGradients = (color: string) => {
    const gradientMaps = {
      violet: {
        start: 'oklch(0.6 0.243 290)', // violet
        end: 'oklch(0.5 0.2 265)'     // indigo
      },
      blue: {
        start: 'oklch(0.6 0.2 240)',  // blue
        end: 'oklch(0.45 0.15 220)'   // darker blue
      },
      green: {
        start: 'oklch(0.6 0.2 140)',  // green
        end: 'oklch(0.5 0.17 160)'    // teal
      },
      red: {
        start: 'oklch(0.6 0.2 30)',   // red
        end: 'oklch(0.55 0.22 15)'    // orange-red
      },
      yellow: {
        start: 'oklch(0.7 0.2 85)',   // yellow
        end: 'oklch(0.65 0.22 65)'    // amber
      }
    };
    
    const gradient = gradientMaps[color as keyof typeof gradientMaps];
    if (gradient) {
      document.documentElement.style.setProperty('--gradient-start', gradient.start);
      document.documentElement.style.setProperty('--gradient-end', gradient.end);
    }
  };
  
  // Apply theme on component mount
  useEffect(() => {
    applyTheme();
    
    // Add event listener to handle changes from other tabs/windows
    window.addEventListener('storage', applyTheme);
    
    return () => {
      window.removeEventListener('storage', applyTheme);
    };
  }, [applyTheme]);
  
  return (
    <ThemeContext.Provider value={{ applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
} 