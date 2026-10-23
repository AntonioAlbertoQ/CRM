/* Sessões SQL com token aleatório no navegador e hash SHA-256 no banco. */
import { createHash } from 'node:crypto';
import { database } from '../database/connection.js';

/* Insere sessões usando o hash do token, nunca o token original do navegador. */
const insertSessionStatement = database.prepare(`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (?, ?, ?)
`);

/* Só encontra sessão válida e retorna os dados públicos da conta vinculada. */
const findSessionStatement = database.prepare(`
    SELECT users.id, users.full_name AS name, users.email
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
`);

/* Invalida uma sessão pelo hash do token recebido no cookie. */
const deleteSessionStatement = database.prepare('DELETE FROM sessions WHERE token_hash = ?');
/* Remove registros cujo prazo já passou, sem depender de acesso do usuário. */
const deleteExpiredSessionsStatement = database.prepare('DELETE FROM sessions WHERE expires_at <= ?');

/* Converte o token opaco do cookie em um identificador não reutilizável no banco. */
function hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
}

/* Salva o vínculo entre a conta e o hash do token com prazo de expiração. */
export function createSession({ token, userId, expiresAt }) {
    insertSessionStatement.run(hashToken(token), userId, expiresAt);
}

/* Consulta uma sessão e remove o registro se já estiver vencido ou ausente. */
export function findUserForSession(token, now = Date.now()) {
    const tokenHash = hashToken(token);
    const user = findSessionStatement.get(tokenHash, now);

    if (!user) {
        deleteSessionStatement.run(tokenHash);
    }

    return user;
}

/* Remove uma sessão específica ao encerrar a autenticação. */
export function deleteSession(token) {
    deleteSessionStatement.run(hashToken(token));
}

/* Limpeza periódica de sessões antigas que não foram usadas novamente. */
export function deleteExpiredSessions(now = Date.now()) {
    deleteExpiredSessionsStatement.run(now);
}
