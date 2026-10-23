/* Cliente HTTP da interface para a API local do CRM. */
export async function apiRequest(path, options = {}) {
    const headers = new Headers(options.headers || {});

    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    let response;
    try {
        response = await fetch(path, {
            ...options,
            headers,
            credentials: 'same-origin',
        });
    } catch {
        throw new Error('API indisponível. Inicie o CRM com npm start e abra http://localhost:3000.');
    }

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.error?.message || 'Não foi possível concluir a solicitação.');
    }

    return result;
}
