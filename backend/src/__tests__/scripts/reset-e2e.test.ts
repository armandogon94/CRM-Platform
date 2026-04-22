/**
 * Unit tests for the reset-e2e CLI script (Slice 19, Task A5).
 *
 * Verifies the two guarantees that make the CLI path trustworthy:
 *  1. In production the script refuses to run (NODE_ENV === 'production')
 *     and exits 1 without importing / invoking the reset service.
 *  2. Outside production the script delegates to E2EResetService.reset()
 *     and reports success on stdout, exiting 0.
 *
 * The module is imported with the `require.main === module` auto-run guard
 * in place, so main() must be importable and callable without side effects.
 */

const mockReset = jest.fn();

jest.mock('../../services/E2EResetService', () => ({
  __esModule: true,
  default: { reset: mockReset },
}));

describe('reset-e2e CLI script', () => {
  const originalEnv = process.env.NODE_ENV;

  let stdout: jest.SpyInstance;
  let stderr: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderr = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    stdout.mockRestore();
    stderr.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  const captured = (spy: jest.SpyInstance): string =>
    spy.mock.calls.map((call) => String(call[0])).join('');

  it('refuses to run in production and does not invoke the reset service', async () => {
    process.env.NODE_ENV = 'production';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { main } = require('../../scripts/reset-e2e');

    await expect(main()).rejects.toThrow(/Refusing|Cannot|production/i);
    expect(mockReset).not.toHaveBeenCalled();

    const errOutput = captured(stderr) + captured(errorSpy);
    expect(errOutput).toMatch(/Refusing|Cannot|production/i);
  });

  it('invokes E2EResetService.reset() and logs completion on success', async () => {
    process.env.NODE_ENV = 'test';
    mockReset.mockResolvedValue({ workspaceId: 42 });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { main } = require('../../scripts/reset-e2e');

    await expect(main()).resolves.toBeUndefined();
    expect(mockReset).toHaveBeenCalledTimes(1);

    const outOutput = captured(stdout) + captured(logSpy);
    expect(outOutput).toMatch(/E2E workspace reset complete/i);
  });
});
