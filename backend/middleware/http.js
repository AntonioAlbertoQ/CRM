/* Middlewares de cabeçalhos, contexto de requisição e leitura limitada de JSON. */
import { randomUUID } from 'node:crypto';
import { HttpError } from '../errors.js';

export async function requestContext(req, res, next) {
    req.id = randomUUID();
    res.setHeader('X-Request-Id', req.id);
    return next();
}

export async function securityHeaders(req, res, next) {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    }
    return next();
}

export async function sameOriginOnly(req, res, next) {
    const requestUrl = new URL(req.url, 'http://localhost');
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

    if (!requestUrl.pathname.startsWith('/api/') || !isMutation) {
        return next();
    }

    const origin = req.headers.origin;
    const fetchSite = req.headers['sec-fetch-site'];

    if (fetchSite === 'cross-site') {
        throw new HttpError(403, 'Requisição de outra origem não permitida.');
    }

    if (origin) {
        let originHost;
        try {
            originHost = new URL(origin).host;
        } catch {
            throw new HttpError(403, 'Origem da requisição inválida.');
        }

        if (originHost !== req.headers.host) {
            throw new HttpError(403, 'Requisição de outra origem não permitida.');
        }
    }

    return next();
}

export async function parseJsonBody(req, res, next) {
    req.body = {};

    if (!req.url.startsWith('/api/') || !['POST', 'PUT', 'PATCH'].includes(req.method)) {
        return next();
    }

    if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) {
        throw new HttpError(415, 'A API aceita conteúdo JSON.');
    }

    let rawBody = '';
    for await (const chunk of req) {
        rawBody += chunk.toString('utf8');
        if (Buffer.byteLength(rawBody, 'utf8') > 16 * 1024) {
            throw new HttpError(413, 'O conteúdo enviado excede o limite permitido.');
        }
    }

    if (rawBody) {
        try {
            req.body = JSON.parse(rawBody);
        } catch {
            throw new HttpError(400, 'O JSON enviado é inválido.');
        }

        if (!req.body || Array.isArray(req.body) || typeof req.body !== 'object') {
            throw new HttpError(400, 'O conteúdo JSON deve ser um objeto.');
        }
    }

    return next();
}

const routeLimits = new Map([
    ['/api/auth/login', 10],
    ['/api/auth/register', 5],
]);

export async function rateLimit(req, res, next) {
    const requestUrl = new URL(req.url, 'http://localhost');
    const limit = routeLimits.get(requestUrl.pathname);

    if (!limit || req.method !== 'POST') {
        return next();
    }

    const forwardedIp = process.env.TRUST_PROXY === '1'
        ? req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        : null;
    const clientIp = forwardedIp || req.socket.remoteAddress || 'unknown';
    const key = `${clientIp}:${requestUrl.pathname}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const previous = rateLimit.entries.get(key);
    const entry = !previous || previous.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : previous;

    entry.count += 1;
    rateLimit.entries.set(key, entry);

    if (entry.count > limit) {
        res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
        throw new HttpError(429, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.');
    }

    return next();
}

rateLimit.entries = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimit.entries) {
        if (entry.resetAt <= now) {
            rateLimit.entries.delete(key);
        }
    }
}, 10 * 60 * 1000).unref();
