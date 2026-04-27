/**
 * Integration tests for file upload routes.
 */

import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

jest.mock('../../config', () => ({
  default: {
    env: 'test', port: 13000,
    jwt: { secret: 'test-secret', refreshSecret: 'test-refresh-secret', expiresIn: '1h', refreshExpiresIn: '7d' },
    corsOrigins: ['http://localhost:3000'],
    rateLimit: { windowMs: 60000, max: 1000 },
    redisUrl: 'redis://localhost:6379',
    upload: { dir: '/tmp/crm-test-uploads', maxFileSize: 10485760, maxWorkspaceStorage: 524288000 },
    database: { host: 'localhost', port: 5432, name: 'test', user: 'test', password: 'test' },
  },
  __esModule: true,
}));

jest.mock('../../config/database', () => {
  const { Sequelize } = jest.requireActual('sequelize');
  return { default: new Sequelize('sqlite::memory:', { logging: false }), sequelize: new Sequelize('sqlite::memory:', { logging: false }), __esModule: true };
});

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../models/User', () => {
  const M: any = jest.fn();
  M.findOne = jest.fn(); M.findByPk = jest.fn(); M.create = jest.fn();
  M.update = jest.fn(); M.init = jest.fn(); M.belongsTo = jest.fn(); M.hasMany = jest.fn();
  return { default: M, __esModule: true };
});

jest.mock('../../models/Workspace', () => {
  const M: any = jest.fn();
  M.create = jest.fn(); M.update = jest.fn(); M.init = jest.fn();
  M.hasMany = jest.fn(); M.belongsTo = jest.fn();
  return { default: M, __esModule: true };
});

const modelNames = [
  'Board', 'BoardGroup', 'Column', 'Item', 'ColumnValue',
  'BoardView', 'Automation', 'AutomationLog', 'ActivityLog',
  'Notification', 'FileAttachment',
];
for (const name of modelNames) {
  jest.mock(`../../models/${name}`, () => {
    const M: any = jest.fn();
    M.init = jest.fn(); M.findAll = jest.fn().mockResolvedValue([]);
    M.findOne = jest.fn().mockResolvedValue(null); M.findByPk = jest.fn().mockResolvedValue(null);
    M.findAndCountAll = jest.fn().mockResolvedValue({ rows: [], count: 0 });
    M.create = jest.fn(); M.update = jest.fn(); M.destroy = jest.fn();
    M.upsert = jest.fn(); M.hasMany = jest.fn(); M.belongsTo = jest.fn();
    M.sum = jest.fn().mockResolvedValue(0);
    return { default: M, __esModule: true };
  });
}

jest.mock('../../models/index', () => ({}));
jest.mock('../../services/WebSocketService', () => ({
  default: { emitToBoard: jest.fn(), emitToWorkspace: jest.fn(), emitToUser: jest.fn() },
  __esModule: true,
}));

import request from 'supertest';
import app from '../../app';
import FileAttachment from '../../models/FileAttachment';
import Item from '../../models/Item';
import wsService from '../../services/WebSocketService';

const mockedJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

function auth(): [string, string] {
  (mockedJwtVerify as jest.Mock).mockReturnValue({ sub: 1, email: 'test@test.com', workspaceId: 1, role: 'admin' });
  return ['Authorization', 'Bearer valid-token'];
}

describe('File routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /files', () => {
    it('returns files for an item', async () => {
      const files = [{ id: 1, originalName: 'test.pdf', fileSize: 1024 }];
      (FileAttachment.findAll as jest.Mock).mockResolvedValue(files);

      const res = await request(app)
        .get('/api/v1/files?itemId=1')
        .set(...auth());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 when itemId is missing', async () => {
      const res = await request(app)
        .get('/api/v1/files')
        .set(...auth());

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /files/:id', () => {
    it('soft deletes file and returns success', async () => {
      const file = { id: 1, workspaceId: 1, filePath: '/tmp/test.pdf', destroy: jest.fn() };
      (FileAttachment.findByPk as jest.Mock).mockResolvedValue(file);

      const res = await request(app)
        .delete('/api/v1/files/1')
        .set(...auth());

      expect(res.status).toBe(200);
      expect(file.destroy).toHaveBeenCalled();
    });

    it('returns 404 when file not found', async () => {
      (FileAttachment.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/v1/files/999')
        .set(...auth());

      expect(res.status).toBe(404);
    });
  });

  // ── Slice 21A D1: WebSocket emit on upload + delete ─────────────────────
  //
  // Two-tab realtime echo: when admin uploads in tab A, tab B's useBoard
  // onFileCreated handler must observe the change. Symmetrically for delete.
  // Emits are scoped to the item's boardId (NOT workspaceId) — matches the
  // `column_value:changed` precedent and bounds fanout to the relevant room.
  describe('WebSocket emit (Slice 21A D1)', () => {
    it('emits file:deleted on successful delete with fileId + itemId + columnValueId', async () => {
      const file = {
        id: 42,
        workspaceId: 1,
        itemId: 99,
        columnValueId: 7,
        filePath: '/tmp/test.pdf',
        destroy: jest.fn(),
      };
      (FileAttachment.findByPk as jest.Mock).mockResolvedValue(file);
      (Item.findByPk as jest.Mock).mockResolvedValue({ id: 99, boardId: 5 });

      const res = await request(app)
        .delete('/api/v1/files/42')
        .set(...auth());

      expect(res.status).toBe(200);
      expect(wsService.emitToBoard).toHaveBeenCalledWith(5, 'file:deleted', {
        fileId: 42,
        itemId: 99,
        columnValueId: 7,
      });
    });

    it('does NOT emit file:deleted when delete fails (404 path)', async () => {
      (FileAttachment.findByPk as jest.Mock).mockResolvedValue(null);

      await request(app)
        .delete('/api/v1/files/999')
        .set(...auth());

      expect(wsService.emitToBoard).not.toHaveBeenCalled();
    });

    it('does NOT emit file:deleted when file has no itemId (item-level orphan)', async () => {
      const file = {
        id: 50,
        workspaceId: 1,
        itemId: null,
        columnValueId: null,
        filePath: '/tmp/test.pdf',
        destroy: jest.fn(),
      };
      (FileAttachment.findByPk as jest.Mock).mockResolvedValue(file);

      const res = await request(app)
        .delete('/api/v1/files/50')
        .set(...auth());

      expect(res.status).toBe(200);
      expect(wsService.emitToBoard).not.toHaveBeenCalled();
    });
  });

  describe('ALLOWED_MIME_TYPES (Slice 21 review I2)', () => {
    it('does NOT allow image/svg+xml — SVG XSS vector kept out of upload allowlist', () => {
      // The pre-fix allowlist included 'image/svg+xml'. Because the
      // download route streams the file with the stored mimeType in
      // Content-Type, an uploaded SVG opened via /files/:id/download
      // would execute <script> tags in the workspace's browser origin
      // — a stored XSS. Allowlist is now explicit raster-only.
      const { ALLOWED_MIME_TYPES } = require('../../routes/files');
      expect(ALLOWED_MIME_TYPES).not.toContain('image/svg+xml');
      // Sanity-check we didn't drop the safe raster formats too —
      // the fix is scoped to SVG only.
      expect(ALLOWED_MIME_TYPES).toEqual(
        expect.arrayContaining([
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ])
      );
    });
  });

  describe('buildContentDisposition (Slice 21 review I1)', () => {
    it('encodes filename with RFC 5987 + sanitises legacy filename for header-injection-safe download', () => {
      // The helper is exported from routes/files.ts so we can unit-test
      // the encoding logic in isolation, without standing up the full
      // download route stack (which streams a real fs.ReadStream into
      // the Express response and is finicky to mock through supertest).
      const { buildContentDisposition } = require('../../routes/files');

      // Filename containing every metacharacter the pre-fix code
      // would have allowed to break out of the quoted-string token:
      // a literal double quote, CR, LF, and a backslash. Plus a
      // unicode character to exercise the URL-encoding path.
      const evilName = 'a"b\rc\nd\\e — résumé.txt';
      const cd: string = buildContentDisposition(evilName);

      // Both forms are present.
      expect(cd).toMatch(/^attachment; filename="[^"]*"; filename\*=UTF-8''/);

      // The legacy `filename="..."` form is sanitised — every
      // injection metacharacter is stripped to `_`, so a
      // header-parsing client can never escape the quoted token.
      const legacyMatch = cd.match(/filename="([^"]*)"/);
      expect(legacyMatch).not.toBeNull();
      const legacy = legacyMatch![1];
      expect(legacy).not.toContain('"');
      expect(legacy).not.toContain('\r');
      expect(legacy).not.toContain('\n');
      expect(legacy).not.toContain('\\');

      // The RFC 5987 form is the percent-encoded original — clients
      // that decode `filename*` get the user's true filename
      // (including the unicode em dash and accented characters).
      const rfcMatch = cd.match(/filename\*=UTF-8''([^;\s]+)/);
      expect(rfcMatch).not.toBeNull();
      expect(decodeURIComponent(rfcMatch![1])).toBe(evilName);

      // The output as a whole contains no raw CR/LF — the load-bearing
      // header-injection guarantee.
      expect(cd).not.toContain('\r');
      expect(cd).not.toContain('\n');
    });
  });
});
