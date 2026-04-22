
import supertest from 'supertest';
import express from 'express';
import { setupRoutes } from '../src/routes.js';
import { issueToken } from '../src/auth.js';
import { getSnapshot, saveSnapshot } from '../src/persistence.js';

// Mock persistence
jest.mock('../src/persistence.js', () => ({
  getSnapshot: jest.fn(),
  saveSnapshot: jest.fn(),
}));

const app = express();
app.use(express.json());
setupRoutes(app);

const request = supertest(app);

describe('API Endpoints', () => {
  const sessionId = 'test-session';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/session/:sessionId/snapshot', () => {
    it('should return 401 for missing token', async () => {
      const res = await request.get(`/api/session/${sessionId}/snapshot`);
      expect(res.status).toBe(401);
    });

    it('should return 401 for invalid token', async () => {
      const res = await request
        .get(`/api/session/${sessionId}/snapshot`)
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    it('should return 403 for token with wrong sessionId', async () => {
      const token = issueToken({ sessionId: 'wrong-session' });
      const res = await request
        .get(`/api/session/${sessionId}/snapshot`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent snapshot', async () => {
      getSnapshot.mockResolvedValue(null);
      const token = issueToken({ sessionId });
      const res = await request
        .get(`/api/session/${sessionId}/snapshot`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('should return snapshot for valid token', async () => {
      const snapshot = Buffer.from('test-snapshot');
      getSnapshot.mockResolvedValue(snapshot);
      const token = issueToken({ sessionId });
      const res = await request
        .get(`/api/session/${sessionId}/snapshot`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(snapshot);
    });
  });

  describe('POST /api/token/revoke', () => {
    it('should return 400 for missing token', async () => {
      const res = await request.post('/api/token/revoke').send({});
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid token', async () => {
      const res = await request.post('/api/token/revoke').send({ token: 'invalid-token' });
      expect(res.status).toBe(400);
    });

    it('should return 200 for valid token', async () => {
      const token = issueToken({ sessionId });
      const res = await request.post('/api/token/revoke').send({ token });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
