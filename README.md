# Connect System CRM

Aplicação de login e cadastro com interface HTML/CSS/JavaScript, API Node.js e persistência SQL em SQLite.

## Executar localmente

Requer Node.js 24.15 ou superior. O projeto usa o módulo SQLite incluído no Node e não precisa instalar dependências npm.

```powershell
npm start
```

Abra `http://localhost:3000`. Não abra `index.html` diretamente como `file://`: o navegador precisa acessar a API no mesmo servidor. O arquivo SQLite é criado automaticamente em `backend/data/crm.sqlite` e não é enviado ao Git.

Crie uma conta pela aba **Cadastrar** e use o e-mail e a senha cadastrados para entrar. As senhas precisam ter de 8 a 128 caracteres e são armazenadas como hash com salt. A opção **Lembrar-me** mantém o e-mail no navegador e prolonga a sessão; não salva a senha.

## Organização das camadas

- `index.html` e `assets/login/`: front-end, estilos, abas e cliente da API.
- `backend/server.js`: inicialização HTTP, composição de middleware e rotas.
- `backend/routes/`: endpoints de autenticação.
- `backend/middleware/`: contexto, cabeçalhos de segurança, limite de tentativas, leitura JSON, autenticação, erros e arquivos estáticos.
- `backend/services/`: validação e regras de conta/sessão.
- `backend/repositories/`: consultas SQL parametrizadas.
- `backend/database/schema.sql`: tabelas `users` e `sessions`.

## API inicial

- `GET /api/health`: estado do servidor.
- `POST /api/auth/register`: cria uma conta.
- `POST /api/auth/login`: valida credenciais e cria uma sessão em cookie `HttpOnly`.
- `GET /api/auth/me`: retorna a conta da sessão atual.
- `POST /api/auth/logout`: encerra a sessão.

`DB_PATH` pode apontar para outro arquivo SQLite. Em produção, defina `NODE_ENV=production`, `HOST=0.0.0.0` e use HTTPS para ativar os cabeçalhos de produção e o atributo `Secure` nos cookies. `TRUST_PROXY=1` só deve ser habilitado quando a aplicação estiver atrás de um proxy reverso confiável.

## Próximo passo para hospedar

Esta primeira versão SQL usa um arquivo SQLite, adequado para desenvolvimento local e uma instância única com armazenamento persistente. Antes de colocar o CRM em hospedagem efêmera ou com várias instâncias, migre a camada de repositório para um banco SQL gerenciado (por exemplo, PostgreSQL) ou configure um volume persistente. A recuperação de senha por e-mail ainda não foi configurada.
