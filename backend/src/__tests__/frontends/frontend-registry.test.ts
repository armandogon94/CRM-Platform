/**
 * Frontend Registry Tests — Slice 18
 *
 * Static analysis tests that verify each industry frontend has:
 * 1. WebSocket wiring (socket.io-client import + io() call)
 * 2. Correct brand color in tailwind.config.js
 * 3. Token storage key unique to the industry
 */

import * as fs from 'fs';
import * as path from 'path';

const FRONTENDS_DIR = path.resolve(__dirname, '../../../../frontends');

interface FrontendSpec {
  dir: string;
  name: string;
  brand600: string;
  tokenKey: string;
}

const INDUSTRY_FRONTENDS: FrontendSpec[] = [
  { dir: 'novapay',    name: 'NovaPay',    brand600: '#2563EB', tokenKey: 'novapay_token' },
  { dir: 'medvista',   name: 'MedVista',   brand600: '#059669', tokenKey: 'medvista_token' },
  { dir: 'trustguard', name: 'TrustGuard', brand600: '#1E3A5F', tokenKey: 'trustguard_token' },
  { dir: 'urbannest',  name: 'UrbanNest',  brand600: '#D97706', tokenKey: 'urbannest_token' },
  { dir: 'swiftroute', name: 'SwiftRoute', brand600: '#7C3AED', tokenKey: 'swiftroute_token' },
  { dir: 'dentaflow',  name: 'DentaFlow',  brand600: '#06B6D4', tokenKey: 'dentaflow_token' },
  { dir: 'jurispath',  name: 'JurisPath',  brand600: '#166534', tokenKey: 'jurispath_token' },
  { dir: 'tablesync',  name: 'TableSync',  brand600: '#9F1239', tokenKey: 'tablesync_token' },
  { dir: 'cranestack', name: 'CraneStack', brand600: '#EA580C', tokenKey: 'cranestack_token' },
  { dir: 'edupulse',   name: 'EduPulse',   brand600: '#6D28D9', tokenKey: 'edupulse_token' },
];

describe('Industry Frontend Registry', () => {
  describe('WebSocket wiring', () => {
    INDUSTRY_FRONTENDS.forEach(({ dir, name }) => {
      it(`${name} App.tsx imports socket.io-client`, () => {
        const appPath = path.join(FRONTENDS_DIR, dir, 'src', 'App.tsx');
        expect(fs.existsSync(appPath)).toBe(true);
        const content = fs.readFileSync(appPath, 'utf8');
        expect(content).toContain('socket.io-client');
      });

      it(`${name} App.tsx calls io() to create a socket`, () => {
        const appPath = path.join(FRONTENDS_DIR, dir, 'src', 'App.tsx');
        const content = fs.readFileSync(appPath, 'utf8');
        expect(content).toMatch(/\bio\s*\(/);
      });
    });
  });

  describe('Brand colors in tailwind.config.js', () => {
    INDUSTRY_FRONTENDS.forEach(({ dir, name, brand600 }) => {
      it(`${name} has correct brand-600 color ${brand600}`, () => {
        const tailwindPath = path.join(FRONTENDS_DIR, dir, 'tailwind.config.js');
        expect(fs.existsSync(tailwindPath)).toBe(true);
        const content = fs.readFileSync(tailwindPath, 'utf8');
        expect(content).toContain(brand600);
      });
    });
  });

  describe('Industry token isolation', () => {
    INDUSTRY_FRONTENDS.forEach(({ dir, name, tokenKey }) => {
      it(`${name} uses unique localStorage key "${tokenKey}"`, () => {
        const apiPath = path.join(FRONTENDS_DIR, dir, 'src', 'utils', 'api.ts');
        expect(fs.existsSync(apiPath)).toBe(true);
        const content = fs.readFileSync(apiPath, 'utf8');
        expect(content).toContain(tokenKey);
      });
    });
  });
});
