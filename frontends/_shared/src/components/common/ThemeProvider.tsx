import React from 'react';
import type { ThemeConfig } from '../../theme';

interface ThemeProviderProps {
  theme?: ThemeConfig;
  primaryColor?: string;
  secondaryColor?: string;
  children: React.ReactNode;
}

export function ThemeProvider({
  theme,
  primaryColor,
  secondaryColor,
  children,
}: ThemeProviderProps) {
  const primary = primaryColor ?? theme?.primaryColor ?? '#6366F1';
  const secondary = secondaryColor ?? theme?.secondaryColor ?? '#4F46E5';

  const style = {
    '--brand-primary': primary,
    '--brand-secondary': secondary,
  } as React.CSSProperties;

  return (
    <div style={style} className="theme-provider">
      {children}
    </div>
  );
}
