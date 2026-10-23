/* Middleware de autenticação por cookie de sessão HttpOnly. */
import { HttpError } from '../errors.js';
import { getAccountForSession, getSessionCookieName } from '../services/authService.js';

/* Localiza o cookie da sessão sem aceitar valores de outros cookies. */
export function readSessionToken(req) {
    const cookieName = getSessionCookieName();
    const cookieHeader = req.headers.cookie || '';
    const cookie = cookieHeader.split(';').map(value => value.trim())
        .find(value => value.startsWith(`${cookieName}=`));

    return cookie ? cookie.slice(cookieName.length + 1) : '';
}

/* Consulta a sessão no SQL e só encaminha a rota se a conta estiver autenticada. */
export async function requireAuth(req, res, next) {
    const account = getAccountForSession(readSessionToken(req));

    if (!account) {
        throw new HttpError(401, 'Faça login para continuar.');
    }

    req.user = account;
    return next();
}
