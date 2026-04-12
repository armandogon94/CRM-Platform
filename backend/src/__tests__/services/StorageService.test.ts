/**
 * Unit tests for StorageService — local file storage operations.
 */

import fs from 'fs';
import path from 'path';

jest.mock('../../config', () => ({
  default: { upload: { dir: '/tmp/crm-test-uploads', maxFileSize: 10485760, maxWorkspaceStorage: 524288000 } },
  __esModule: true,
}));

jest.mock('../../models', () => ({
  FileAttachment: {
    sum: jest.fn(),
  },
}));

import { LocalStorageService } from '../../services/StorageService';
import { FileAttachment } from '../../models';

describe('LocalStorageService', () => {
  const service = new LocalStorageService();

  describe('getUploadPath', () => {
    it('returns path with workspaceId, year, and month', () => {
      const result = service.getUploadPath(1);
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      expect(result).toContain('/1/');
      expect(result).toContain(`/${year}/`);
      expect(result).toContain(`/${month}`);
    });
  });

  describe('getWorkspaceUsage', () => {
    it('returns total file size for workspace', async () => {
      (FileAttachment.sum as jest.Mock).mockResolvedValue(1024000);

      const usage = await service.getWorkspaceUsage(1);
      expect(usage).toBe(1024000);
      expect(FileAttachment.sum).toHaveBeenCalledWith('fileSize', {
        where: { workspaceId: 1 },
      });
    });

    it('returns 0 when no files exist', async () => {
      (FileAttachment.sum as jest.Mock).mockResolvedValue(null);

      const usage = await service.getWorkspaceUsage(1);
      expect(usage).toBe(0);
    });
  });

  describe('isWithinQuota', () => {
    it('returns true when usage + new file is within quota', async () => {
      (FileAttachment.sum as jest.Mock).mockResolvedValue(100000);

      const result = await service.isWithinQuota(1, 5000);
      expect(result).toBe(true);
    });

    it('returns false when usage + new file exceeds quota', async () => {
      (FileAttachment.sum as jest.Mock).mockResolvedValue(524288000);

      const result = await service.isWithinQuota(1, 1);
      expect(result).toBe(false);
    });
  });
});
