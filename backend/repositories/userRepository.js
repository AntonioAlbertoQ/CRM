/* Consultas SQL parametrizadas para leitura e gravação de contas. */
import { database } from '../database/connection.js';

const findByEmailStatement = database.prepare(`
    SELECT id, full_name AS name, email, password_hash AS passwordHash,
           password_salt AS passwordSalt
    FROM users
    WHERE email = ? COLLATE NOCASE
`);

const findPublicByIdStatement = database.prepare(`
    SELECT id, full_name AS name, email
    FROM users
    WHERE id = ?
`);

const insertUserStatement = database.prepare(`
    INSERT INTO users (id, full_name, email, password_hash, password_salt)
    VALUES (?, ?, ?, ?, ?)
`);

export function findUserByEmail(email) {
    return findByEmailStatement.get(email);
}

export function findPublicUserById(id) {
    return findPublicByIdStatement.get(id);
}

export function createUser({ id, name, email, passwordHash, passwordSalt }) {
    insertUserStatement.run(id, name, email, passwordHash, passwordSalt);
    return findPublicUserById(id);
}
