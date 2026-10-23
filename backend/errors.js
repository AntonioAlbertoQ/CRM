/* Erros HTTP controlados para a API responder com status e mensagens consistentes. */
export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
    }
}
