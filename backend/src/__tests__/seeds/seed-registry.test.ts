/**
 * Seed Registry Tests — Slice 17
 *
 * Static analysis tests that verify:
 * 1. All 10 industry seed modules export their canonical function
 * 2. The main seeds/index.ts orchestrator wires up all 10 industries
 *
 * These are file-content checks (no DB required).
 */

import * as fs from 'fs';
import * as path from 'path';

const SEED_DIR = path.resolve(__dirname, '../../seeds');

interface SeederSpec {
  dir: string;
  fn: string;
  label: string;
}

const EXPECTED_SEEDERS: SeederSpec[] = [
  { dir: 'novapay',    fn: 'seedNovaPay',    label: 'NovaPay (FinTech)' },
  { dir: 'medvista',   fn: 'seedMedVista',   label: 'MedVista (Healthcare)' },
  { dir: 'trustguard', fn: 'seedTrustGuard', label: 'TrustGuard (Insurance)' },
  { dir: 'urbannest',  fn: 'seedUrbanNest',  label: 'UrbanNest (Real Estate)' },
  { dir: 'swiftroute', fn: 'seedSwiftRoute', label: 'SwiftRoute (Logistics)' },
  { dir: 'dentaflow',  fn: 'seedDentaFlow',  label: 'DentaFlow (Dental)' },
  { dir: 'jurispath',  fn: 'seedJurisPath',  label: 'JurisPath (Legal)' },
  { dir: 'tablesync',  fn: 'seedTableSync',  label: 'TableSync (Hospitality)' },
  { dir: 'cranestack', fn: 'seedCraneStack', label: 'CraneStack (Construction)' },
  { dir: 'edupulse',   fn: 'seedEduPulse',   label: 'EduPulse (Education)' },
];

describe('Industry Seed Registry', () => {
  describe('Industry seed modules export their canonical function', () => {
    EXPECTED_SEEDERS.forEach(({ dir, fn, label }) => {
      it(`${label} — ${fn} is exported`, () => {
        const indexPath = path.join(SEED_DIR, dir, 'index.ts');
        expect(fs.existsSync(indexPath)).toBe(true);
        const content = fs.readFileSync(indexPath, 'utf8');
        expect(content).toContain(`export async function ${fn}`);
      });
    });
  });

  describe('Main seeds/index.ts orchestrates all 10 industries', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(SEED_DIR, 'index.ts'), 'utf8');
    });

    it('imports all 10 industry seeders', () => {
      EXPECTED_SEEDERS.forEach(({ fn }) => {
        expect(mainContent).toContain(fn);
      });
    });

    it('awaits all 10 industry seeders', () => {
      EXPECTED_SEEDERS.forEach(({ fn }) => {
        expect(mainContent).toContain(`await ${fn}()`);
      });
    });
  });

  describe('CraneStack seed is properly modularised', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(path.join(SEED_DIR, 'cranestack', 'index.ts'), 'utf8');
    });

    it('does not auto-execute run() at module load', () => {
      // Standalone execution guard: run() should only fire when require.main === module
      // i.e., the bare `run();` top-level call should not exist
      const hasUnguardedRun = /^run\(\);/m.test(content);
      expect(hasUnguardedRun).toBe(false);
    });

    it('does not perform destructive destroy() calls at top level', () => {
      // Destructive destroy() should not exist outside a comment
      const hasDestroy = content.includes('await FileAttachment.destroy({ where: {}, force: true');
      expect(hasDestroy).toBe(false);
    });
  });
});
