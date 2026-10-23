/* Sessões SQL com token aleatório no navegador e hash SHA-256 no banco. */
import { createHash } from 'node:crypto';
import { database } from '../database/connection.js';

const insertSessionStatement = database.prepare(`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (?, ?, ?)
`);

const findSessionStatement = database.prepare(`
    SELECT users.id, users.full_name AS name, users.email
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
`);

const deleteSessionStatement = database.prepare('DELETE FROM sessions WHERE token_hash = ?');
const deleteExpiredSessionsStatement = database.prepare('DELETE FROM sessions WHERE expires_at <= ?');

function hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
}

export function createSession({ token, userId, expiresAt }) {
    insertSessionStatement.run(hashToken(token), userId, expiresAt);
}

export function findUserForSession(token, now = Date.now()) {
    const tokenHash = hashToken(token);
    const user = findSessionStatement.get(tokenHash, now);

    if (!user) {
        deleteSessionStatement.run(tokenHash);
    }

    return user;
}

export function deleteSession(token) {
    deleteSessionStatement.run(hashToken(token));
}

export function deleteExpiredSessions(now = Date.now()) {
    deleteExpiredSessionsStatement.run(now);
}
