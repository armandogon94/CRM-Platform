import fs from 'fs';
import path from 'path';
import config from '../config';
import { FileAttachment } from '../models';

export class LocalStorageService {
  private baseDir: string;
  private maxWorkspaceStorage: number;

  constructor() {
    this.baseDir = config.upload?.dir || './uploads';
    this.maxWorkspaceStorage = config.upload?.maxWorkspaceStorage || 524288000; // 500MB
  }

  getUploadPath(workspaceId: number): string {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return path.join(this.baseDir, String(workspaceId), year, month);
  }

  ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async getWorkspaceUsage(workspaceId: number): Promise<number> {
    const total = await FileAttachment.sum('fileSize', {
      where: { workspaceId },
    });
    return total || 0;
  }

  async isWithinQuota(workspaceId: number, newFileSize: number): Promise<boolean> {
    const usage = await this.getWorkspaceUsage(workspaceId);
    return (usage + newFileSize) <= this.maxWorkspaceStorage;
  }

  deleteFile(filePath: string): void {
    const fullPath = path.resolve(filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}

export const storageService = new LocalStorageService();
export default storageService;
