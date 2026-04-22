
import { Level } from 'level';
import path from 'path';

let db;

export function initPersistence() {
  const dbPath = process.env.RELAY_PERSIST_PATH || './db';
  db = new Level(path.resolve(dbPath), { valueEncoding: 'binary' });
  console.log(`Persistence layer initialized at ${dbPath}`);
}

export async function getSnapshot(sessionId) {
  try {
    const snapshot = await db.get(sessionId);
    return snapshot;
  } catch (error) {
    if (error.code === 'LEVEL_NOT_FOUND') {
      return null;
    }
    throw error;
  }
}

export async function saveSnapshot(sessionId, snapshot) {
  try {
    await db.put(sessionId, snapshot);
  } catch (error) {
    console.error('Error saving snapshot:', error);
  }
}

export async function deleteSnapshot(sessionId) {
  try {
    await db.del(sessionId);
  } catch (error) {
    console.error('Error deleting snapshot:', error);
  }
}
