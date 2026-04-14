import { describe, it, expect } from 'vitest';
import { INDUSTRY_THEMES, type ThemeConfig } from '../theme';

describe('ThemeConfig', () => {
  it('INDUSTRY_THEMES has exactly 10 entries', () => {
    expect(Object.keys(INDUSTRY_THEMES)).toHaveLength(10);
  });

  it('every theme has required ThemeConfig fields', () => {
    for (const [key, theme] of Object.entries(INDUSTRY_THEMES)) {
      expect(theme).toHaveProperty('primaryColor', expect.any(String));
      expect(theme).toHaveProperty('secondaryColor', expect.any(String));
      expect(theme).toHaveProperty('companyName', expect.any(String));
    }
  });

  it('primaryColor values are valid hex codes', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const theme of Object.values(INDUSTRY_THEMES)) {
      expect(hexPattern.test(theme.primaryColor)).toBe(true);
      expect(hexPattern.test(theme.secondaryColor)).toBe(true);
    }
  });

  it('novapay theme has correct brand color', () => {
    expect(INDUSTRY_THEMES.novapay.primaryColor).toBe('#2563EB');
    expect(INDUSTRY_THEMES.novapay.companyName).toBe('NovaPay');
  });

  it('medvista theme has correct brand color', () => {
    expect(INDUSTRY_THEMES.medvista.primaryColor).toBe('#059669');
    expect(INDUSTRY_THEMES.medvista.companyName).toBe('MedVista');
  });

  it('all 10 industry keys are present', () => {
    const expectedKeys = [
      'novapay', 'medvista', 'trustguard', 'urbannest', 'swiftroute',
      'dentaflow', 'jurispath', 'tablesync', 'cranestack', 'edupulse',
    ];
    for (const key of expectedKeys) {
      expect(INDUSTRY_THEMES).toHaveProperty(key);
    }
  });

  it('ThemeConfig type accepts optional logo and sidebarLabels', () => {
    const theme: ThemeConfig = {
      primaryColor: '#000000',
      secondaryColor: '#111111',
      companyName: 'Test Co',
      logo: '/logo.svg',
      sidebarLabels: { home: 'Dashboard' },
    };
    expect(theme.logo).toBe('/logo.svg');
    expect(theme.sidebarLabels?.home).toBe('Dashboard');
  });
});
