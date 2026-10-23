/* Middleware de autenticação por cookie de sessão HttpOnly. */
import { HttpError } from '../errors.js';
import { getAccountForSession, getSessionCookieName } from '../services/authService.js';

export function readSessionToken(req) {
    const cookieName = getSessionCookieName();
    const cookieHeader = req.headers.cookie || '';
    const cookie = cookieHeader.split(';').map(value => value.trim())
        .find(value => value.startsWith(`${cookieName}=`));

    return cookie ? cookie.slice(cookieName.length + 1) : '';
}

export async function requireAuth(req, res, next) {
    const account = getAccountForSession(readSessionToken(req));

    if (!account) {
        throw new HttpError(401, 'Faça login para continuar.');
    }

    req.user = account;
    return next();
}
