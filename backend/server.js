/* Inicialização do backend e composição da cadeia de middlewares. */
import { createServer } from 'node:http';
import { deleteExpiredSessions } from './repositories/sessionRepository.js';
import { database } from './database/connection.js';
import { authRoutes, throwNotFoundRoute } from './routes/authRoutes.js';
import { handleError, sendJson } from './middleware/errors.js';
import { parseJsonBody, rateLimit, requestContext, sameOriginOnly, securityHeaders } from './middleware/http.js';
import { serveStatic } from './middleware/staticFiles.js';

deleteExpiredSessions();
setInterval(deleteExpiredSessions, 60 * 60 * 1000).unref();

const middlewares = [requestContext, securityHeaders, sameOriginOnly, rateLimit, parseJsonBody];

async function routeRequest(req, res) {
    const requestUrl = new URL(req.url, 'http://localhost');

    if (requestUrl.pathname === '/api/health' && req.method === 'GET') {
        sendJson(res, 200, { status: 'ok' });
        return;
    }

    if (requestUrl.pathname.startsWith('/api/')) {
        const handled = await authRoutes(req, res);
        if (!handled) {
            throwNotFoundRoute();
        }
        return;
    }

    await serveStatic(req, res);
}

async function runMiddleware(req, res, index = 0) {
    if (index >= middlewares.length) {
        return routeRequest(req, res);
    }

    return middlewares[index](req, res, () => runMiddleware(req, res, index + 1));
}

const server = createServer(async (req, res) => {
    try {
        await runMiddleware(req, res);
    } catch (error) {
        handleError(error, req, res);
    }
});

const port = Number.parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '127.0.0.1';

server.listen(port, host, () => {
    console.log(`CRM disponível em http://${host}:${port}`);
});

function closeServer() {
    server.close(() => {
        database.close();
        process.exit(0);
    });
}

process.on('SIGINT', closeServer);
process.on('SIGTERM', closeServer);
