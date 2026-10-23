/* Endpoints de cadastro, login, leitura e encerramento da sessão. */
import { HttpError } from '../errors.js';
import { requireAuth, readSessionToken } from '../middleware/auth.js';
import { sendJson } from '../middleware/errors.js';
import {
    endSession,
    getSessionCookieName,
    loginAccount,
    registerAccount,
} from '../services/authService.js';

function createSessionCookie(result) {
    const cookieParts = [
        `${getSessionCookieName()}=${result.token}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
    ];

    if (process.env.NODE_ENV === 'production') {
        cookieParts.push('Secure');
    }

    if (result.rememberMe) {
        cookieParts.push(`Max-Age=${Math.floor((result.expiresAt - Date.now()) / 1000)}`);
    }

    return cookieParts.join('; ');
}

function clearedSessionCookie() {
    const cookieParts = [
        `${getSessionCookieName()}=`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        'Max-Age=0',
    ];

    if (process.env.NODE_ENV === 'production') {
        cookieParts.push('Secure');
    }

    return cookieParts.join('; ');
}

export async function authRoutes(req, res) {
    const requestUrl = new URL(req.url, 'http://localhost');
    const route = `${req.method} ${requestUrl.pathname}`;

    if (route === 'POST /api/auth/register') {
        const user = await registerAccount(req.body);
        sendJson(res, 201, { user });
        return true;
    }

    if (route === 'POST /api/auth/login') {
        const result = await loginAccount(req.body);
        sendJson(res, 200, { user: result.user }, {
            'Set-Cookie': createSessionCookie(result),
        });
        return true;
    }

    if (route === 'GET /api/auth/me') {
        await requireAuth(req, res, async () => {
            sendJson(res, 200, { user: req.user });
        });
        return true;
    }

    if (route === 'POST /api/auth/logout') {
        const token = readSessionToken(req);
        endSession(token);
        sendJson(res, 200, { message: 'Sessão encerrada.' }, {
            'Set-Cookie': clearedSessionCookie(),
        });
        return true;
    }

    return false;
}

export function throwNotFoundRoute() {
    throw new HttpError(404, 'Rota da API não encontrada.');
}
