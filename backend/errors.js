/* Erros HTTP controlados para a API responder com status e mensagens consistentes. */
export class HttpError extends Error {
    constructor(status, message) {
        /* Mantém o status HTTP junto da mensagem destinada à resposta da API. */
        super(message);
        this.name = 'HttpError';
        this.status = status;
    }
}
