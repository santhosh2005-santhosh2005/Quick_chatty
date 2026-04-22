
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.RELAY_JWT_SECRET || 'supersecret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '2h';

export function issueToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}
