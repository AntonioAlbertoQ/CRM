/* Cliente HTTP da interface para a API local do CRM. */
export async function apiRequest(path, options = {}) {
    /* Define JSON automaticamente quando uma ação envia um corpo à API. */
    const headers = new Headers(options.headers || {});

    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    /* Usa a mesma origem para que o navegador envie e receba o cookie HttpOnly. */
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

    /* Converte respostas HTTP em dados ou mensagens de erro legíveis pela interface. */
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.error?.message || 'Não foi possível concluir a solicitação.');
    }

    return result;
}
