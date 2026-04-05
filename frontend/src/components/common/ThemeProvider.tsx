import React from 'react';

interface ThemeProviderProps {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  children: React.ReactNode;
}

export function ThemeProvider({
  primaryColor = '#6366F1',
  secondaryColor = '#4F46E5',
  accentColor = '#818CF8',
  children,
}: ThemeProviderProps) {
  const style = {
    '--brand-primary': primaryColor,
    '--brand-secondary': secondaryColor,
    '--brand-accent': accentColor,
  } as React.CSSProperties;

  return (
    <div style={style} className="theme-provider">
      {children}
    </div>
  );
}
