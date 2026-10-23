/* Conversão central de erros para JSON; detalhes internos não são enviados ao navegador. */
export function sendJson(res, status, value, headers = {}) {
    const body = JSON.stringify(value);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
    });
    res.end(body);
}

export function handleError(error, req, res) {
    if (res.headersSent) {
        res.destroy();
        return;
    }

    const status = Number.isInteger(error.status) ? error.status : 500;
    const message = status < 500 ? error.message : 'Erro interno do servidor.';

    if (status >= 500) {
        console.error(`[${req.id || 'sem-id'}] ${error.message}`);
    }

    sendJson(res, status, {
        error: {
            message,
            requestId: req.id,
        },
    });
}
