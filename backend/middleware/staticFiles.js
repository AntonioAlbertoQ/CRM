/* Servidor estático restrito à página e aos arquivos da pasta assets. */
import { readFile } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpError } from '../errors.js';

/* Define a raiz pública sem expor backend, configuração ou banco local. */
const backendDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)));
const projectDirectory = resolve(backendDirectory, '..');
const assetDirectory = resolve(projectDirectory, 'assets');

/* Tipos de arquivo aceitos pela interface e seus cabeçalhos HTTP. */
const mimeTypes = new Map([
    ['.html', 'text/html; charset=utf-8'],
    ['.css', 'text/css; charset=utf-8'],
    ['.js', 'text/javascript; charset=utf-8'],
    ['.svg', 'image/svg+xml'],
]);

export async function serveStatic(req, res) {
    /* A interface só precisa ser servida por leitura; rejeita outros métodos. */
    if (!['GET', 'HEAD'].includes(req.method)) {
        throw new HttpError(405, 'Método não permitido.');
    }

    const requestUrl = new URL(req.url, 'http://localhost');
    let filePath;

    /* Expõe apenas a página inicial e conteúdo localizado em /assets/. */
    if (requestUrl.pathname === '/' || requestUrl.pathname === '/index.html') {
        filePath = resolve(projectDirectory, 'index.html');
    } else if (requestUrl.pathname.startsWith('/assets/')) {
        let decodedPath;
        try {
            decodedPath = decodeURIComponent(requestUrl.pathname.slice(1));
        } catch {
            throw new HttpError(400, 'Caminho inválido.');
        }

        filePath = resolve(projectDirectory, decodedPath);
        /* Impede que caminhos codificados escapem da pasta pública de assets. */
        const assetRelativePath = relative(assetDirectory, filePath);
        if (assetRelativePath.startsWith(`..${sep}`) || assetRelativePath === '..') {
            throw new HttpError(404, 'Arquivo não encontrado.');
        }
    } else {
        throw new HttpError(404, 'Página não encontrada.');
    }

    /* Lê e envia o arquivo com cache curto; HEAD retorna somente os cabeçalhos. */
    let contents;
    try {
        contents = await readFile(filePath);
    } catch {
        throw new HttpError(404, 'Arquivo não encontrado.');
    }

    res.writeHead(200, {
        'Content-Type': mimeTypes.get(extname(filePath)) || 'application/octet-stream',
        'Content-Length': contents.length,
        'Cache-Control': filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=3600',
    });
    res.end(req.method === 'HEAD' ? undefined : contents);
}
