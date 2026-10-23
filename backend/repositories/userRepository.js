/* Consultas SQL parametrizadas para leitura e gravação de contas. */
import { database } from '../database/connection.js';

/* Retorna os campos privados necessários para conferir a senha; não usar na resposta HTTP. */
const findByEmailStatement = database.prepare(`
    SELECT id, full_name AS name, email, password_hash AS passwordHash,
           password_salt AS passwordSalt
    FROM users
    WHERE email = ? COLLATE NOCASE
`);

/* Consulta separada que seleciona apenas os campos públicos da conta. */
const findPublicByIdStatement = database.prepare(`
    SELECT id, full_name AS name, email
    FROM users
    WHERE id = ?
`);

/* Persiste cadastro por parâmetros SQL para impedir interpolação de valores. */
const insertUserStatement = database.prepare(`
    INSERT INTO users (id, full_name, email, password_hash, password_salt)
    VALUES (?, ?, ?, ?, ?)
`);

/* Busca e-mail sem diferenciar letras maiúsculas/minúsculas. */
export function findUserByEmail(email) {
    return findByEmailStatement.get(email);
}

/* Retorna somente id, nome e e-mail para apresentação na interface. */
export function findPublicUserById(id) {
    return findPublicByIdStatement.get(id);
}

/* Insere a conta e em seguida consulta a representação pública recém-criada. */
export function createUser({ id, name, email, passwordHash, passwordSalt }) {
    insertUserStatement.run(id, name, email, passwordHash, passwordSalt);
    return findPublicUserById(id);
}
