/* Regras de cadastro, autenticação e criação de sessão. */
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { HttpError } from '../errors.js';
import {
    createSession,
    deleteSession,
    findUserForSession,
} from '../repositories/sessionRepository.js';
import { createUser, findUserByEmail } from '../repositories/userRepository.js';

const scryptAsync = promisify(scrypt);
const passwordKeyLength = 64;
const sessionCookieName = 'crm_session';

function normalizeEmail(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validateRegistration({ name, email, password }) {
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
        throw new HttpError(400, 'Informe um nome entre 2 e 80 caracteres.');
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new HttpError(400, 'Informe um endereço de e-mail válido.');
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
        throw new HttpError(400, 'A senha deve ter entre 8 e 128 caracteres.');
    }
}

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
    const hash = await scryptAsync(password, salt, passwordKeyLength);
    return { hash: hash.toString('hex'), salt };
}

function passwordMatches(password, salt, savedHash) {
    return hashPassword(password, salt).then(({ hash }) => {
        const candidate = Buffer.from(hash, 'hex');
        const expected = Buffer.from(savedHash, 'hex');
        return candidate.length === expected.length && timingSafeEqual(candidate, expected);
    });
}

export async function registerAccount(input = {}) {
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const email = normalizeEmail(input.email);
    const password = input.password;
    validateRegistration({ name, email, password });

    if (findUserByEmail(email)) {
        throw new HttpError(409, 'Já existe uma conta com este e-mail.');
    }

    const { hash, salt } = await hashPassword(password);

    try {
        return createUser({
            id: randomUUID(),
            name,
            email,
            passwordHash: hash,
            passwordSalt: salt,
        });
    } catch (error) {
        if (error.code?.startsWith('SQLITE_CONSTRAINT')) {
            throw new HttpError(409, 'Já existe uma conta com este e-mail.');
        }
        throw error;
    }
}

export async function loginAccount(input = {}) {
    const email = normalizeEmail(input.emailOrName);
    const password = input.password;

    if (!email || typeof password !== 'string' || password.length === 0 || password.length > 128) {
        throw new HttpError(400, 'Informe seu e-mail e sua senha.');
    }

    const account = findUserByEmail(email);
    const salt = account?.passwordSalt || 'invalid-account-salt';
    const hash = account?.passwordHash || '0'.repeat(passwordKeyLength * 2);
    const validPassword = await passwordMatches(password, salt, hash);

    if (!account || !validPassword) {
        throw new HttpError(401, 'E-mail ou senha inválidos.');
    }

    const rememberMe = input.rememberMe === true;
    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000;
    createSession({ token, userId: account.id, expiresAt });

    return {
        token,
        expiresAt,
        rememberMe,
        user: { id: account.id, name: account.name, email: account.email },
    };
}

export function getSessionCookieName() {
    return sessionCookieName;
}

export function getAccountForSession(token) {
    return token ? findUserForSession(token) : null;
}

export function endSession(token) {
    if (token) {
        deleteSession(token);
    }
}
