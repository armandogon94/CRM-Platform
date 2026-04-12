import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import config from '../config';
import FileAttachment from '../models/FileAttachment';
import { storageService } from '../services/StorageService';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
  'application/zip',
];

const MAX_FILE_SIZE = config.upload?.maxFileSize || 10485760; // 10MB

const storage = multer.diskStorage({
  destination: (req: any, _file, cb) => {
    const workspaceId = req.user?.workspaceId || 1;
    const uploadPath = storageService.getUploadPath(workspaceId);
    storageService.ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

const router = Router();

// GET /files?itemId=X — list files for an item
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const itemId = req.query.itemId ? Number(req.query.itemId) : undefined;
    if (!itemId || isNaN(itemId)) {
      return errorResponse(res, 'itemId query parameter is required', 400);
    }

    const files = await FileAttachment.findAll({
      where: { itemId, workspaceId: req.user!.workspaceId },
      order: [['createdAt', 'DESC']],
    });

    return successResponse(res, { files });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch files', 500);
  }
});

// POST /files/upload — multipart file upload
router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    const workspaceId = req.user!.workspaceId;

    // Check workspace storage quota
    const withinQuota = await storageService.isWithinQuota(workspaceId, req.file.size);
    if (!withinQuota) {
      // Remove uploaded file
      storageService.deleteFile(req.file.path);
      return errorResponse(res, 'Workspace storage quota exceeded', 413);
    }

    const { itemId, columnValueId } = req.body;

    const attachment = await FileAttachment.create({
      workspaceId,
      itemId: itemId ? Number(itemId) : null,
      columnValueId: columnValueId ? Number(columnValueId) : null,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      uploadedBy: req.user!.id,
    });

    return successResponse(res, { file: attachment }, 'File uploaded', 201);
  } catch (error: any) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'File exceeds 10MB limit', 413);
    }
    return errorResponse(res, 'Failed to upload file', 500);
  }
});

// GET /files/:id/download — stream file
router.get('/:id/download', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid file ID', 400);
    }

    const file = await FileAttachment.findByPk(id);
    if (!file) {
      return errorResponse(res, 'File not found', 404);
    }

    if (file.workspaceId !== req.user!.workspaceId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const filePath = path.resolve(file.filePath);
    if (!fs.existsSync(filePath)) {
      return errorResponse(res, 'File not found on disk', 404);
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    return errorResponse(res, 'Failed to download file', 500);
  }
});

// DELETE /files/:id — soft delete
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid file ID', 400);
    }

    const file = await FileAttachment.findByPk(id);
    if (!file) {
      return errorResponse(res, 'File not found', 404);
    }

    if (file.workspaceId !== req.user!.workspaceId) {
      return errorResponse(res, 'Access denied', 403);
    }

    await file.destroy(); // paranoid soft delete
    return successResponse(res, null, 'File deleted');
  } catch (error) {
    return errorResponse(res, 'Failed to delete file', 500);
  }
});

export default router;
