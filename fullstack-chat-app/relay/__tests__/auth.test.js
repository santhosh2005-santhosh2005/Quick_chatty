
import { issueToken, verifyToken } from '../src/auth.js';

describe('JWT Authentication', () => {
  const sessionId = 'test-session';

  it('should issue a valid JWT token', () => {
    const token = issueToken({ sessionId });
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('should verify a valid token', async () => {
    const token = issueToken({ sessionId });
    const decoded = await verifyToken(token);
    expect(decoded.sessionId).toBe(sessionId);
  });

  it('should reject an invalid token', async () => {
    const invalidToken = 'invalid-token';
    await expect(verifyToken(invalidToken)).rejects.toThrow();
  });

  it('should reject an expired token', async () => {
    const expiredToken = issueToken({ sessionId }, '-1s');
    await expect(verifyToken(expiredToken)).rejects.toThrow();
  });
});
