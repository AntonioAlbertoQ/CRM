import { apiRequest } from './api.js';

document.addEventListener('DOMContentLoaded', () => {

            /* ==================================================================
               1. INICIALIZAÇÃO: referências aos elementos usados pela interface
               ================================================================== */
            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');
            const gotoSignup = document.getElementById('goto-signup');
            const gotoLogin = document.getElementById('goto-login');
            const loginTab = document.getElementById('login-tab');
            const signupTab = document.getElementById('signup-tab');
            const formTitle = document.getElementById('form-title');
            const formSubtitle = document.getElementById('form-subtitle');
            const loginEmailInput = document.getElementById('login-email');
            const rememberMeInput = document.getElementById('remember-me');
            const forgotPasswordLink = document.getElementById('forgot-password-link');
            const authShell = document.getElementById('auth-shell');
            const accountPanel = document.getElementById('account-panel');
            const accountGreeting = document.getElementById('account-greeting');
            const logoutButton = document.getElementById('logout-button');
            const toggleButtons = document.querySelectorAll('.toggle-password');
            const toastContainer = document.getElementById('toast-container');
            const rememberedEmailKey = 'connect-system-remembered-email';

            /* ------------------------------------------------------------------
               2. ABAS: alternância entre login e cadastro no mesmo cartão
               ------------------------------------------------------------------ */
            let tabTransitionTimer;

            function updateActiveTab(showSignup) {
                loginTab.classList.toggle('active', !showSignup);
                loginTab.setAttribute('aria-selected', String(!showSignup));
                loginTab.setAttribute('tabindex', showSignup ? '-1' : '0');
                signupTab.classList.toggle('active', showSignup);
                signupTab.setAttribute('aria-selected', String(showSignup));
                signupTab.setAttribute('tabindex', showSignup ? '0' : '-1');
            }

            function showForm(showSignup) {
                window.clearTimeout(tabTransitionTimer);
                const currentForm = showSignup ? loginForm : signupForm;
                const nextForm = showSignup ? signupForm : loginForm;

                if (nextForm.classList.contains('active')) {
                    updateActiveTab(showSignup);
                    return;
                }

                currentForm.classList.remove('active');
                currentForm.classList.add('exit-left');
                nextForm.classList.remove('exit-left');
                updateActiveTab(showSignup);
                formTitle.textContent = showSignup ? 'Criar nova conta' : 'Bem-vindo de volta';
                formSubtitle.textContent = showSignup
                    ? 'Preencha os dados abaixo para se cadastrar'
                    : 'Insira suas credenciais para acessar sua conta';

                tabTransitionTimer = window.setTimeout(() => {
                    nextForm.classList.add('active');
                    currentForm.classList.remove('exit-left');
                }, 150);
            }

            const showSignupForm = () => showForm(true);
            const showLoginForm = () => showForm(false);

            loginTab.addEventListener('click', showLoginForm);
            signupTab.addEventListener('click', showSignupForm);
            gotoSignup.addEventListener('click', (event) => {
                event.preventDefault();
                showSignupForm();
            });
            gotoLogin.addEventListener('click', (event) => {
                event.preventDefault();
                showLoginForm();
            });

            document.querySelector('.auth-tabs').addEventListener('keydown', (event) => {
                const tabs = [loginTab, signupTab];
                const currentIndex = tabs.indexOf(document.activeElement);
                let nextIndex;

                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                    nextIndex = (currentIndex + 1) % tabs.length;
                } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                } else if (event.key === 'Home') {
                    nextIndex = 0;
                } else if (event.key === 'End') {
                    nextIndex = tabs.length - 1;
                } else {
                    return;
                }

                event.preventDefault();
                tabs[nextIndex].focus();
                (nextIndex === 0 ? showLoginForm : showSignupForm)();
            });

            /* ------------------------------------------------------------------
               3. LEMBRAR-ME: persiste somente o e-mail, nunca a senha
               ------------------------------------------------------------------ */
            function getRememberedEmail() {
                try {
                    if (window.location.protocol === 'file:') {
                        return localStorage.getItem(rememberedEmailKey) || '';
                    }

                    const cookiePrefix = `${rememberedEmailKey}=`;
                    const savedCookie = document.cookie
                        .split('; ')
                        .find(cookie => cookie.startsWith(cookiePrefix));

                    return savedCookie
                        ? decodeURIComponent(savedCookie.slice(cookiePrefix.length))
                        : localStorage.getItem(rememberedEmailKey) || '';
                } catch {
                    return '';
                }
            }

            function saveRememberedEmail(email) {
                try {
                    if (window.location.protocol === 'file:') {
                        localStorage.setItem(rememberedEmailKey, email);
                        return;
                    }

                    const secureAttribute = window.location.protocol === 'https:' ? '; Secure' : '';
                    document.cookie = `${rememberedEmailKey}=${encodeURIComponent(email)}; Max-Age=2592000; Path=/; SameSite=Lax${secureAttribute}`;

                    // Usa armazenamento local como alternativa se o navegador bloquear cookies.
                    if (!document.cookie.split('; ').some(cookie => cookie.startsWith(`${rememberedEmailKey}=`))) {
                        localStorage.setItem(rememberedEmailKey, email);
                    }
                } catch {
                    try {
                        localStorage.setItem(rememberedEmailKey, email);
                    } catch {
                        // A página continua funcionando mesmo se o navegador bloquear o armazenamento.
                    }
                }
            }

            function clearRememberedEmail() {
                try {
                    localStorage.removeItem(rememberedEmailKey);
                } catch {
                    // O cookie ainda pode ser removido mesmo se localStorage estiver indisponível.
                }

                if (window.location.protocol !== 'file:') {
                    const secureAttribute = window.location.protocol === 'https:' ? '; Secure' : '';
                    document.cookie = `${rememberedEmailKey}=; Max-Age=0; Path=/; SameSite=Lax${secureAttribute}`;
                }
            }

            const rememberedEmail = getRememberedEmail();
            if (rememberedEmail) {
                loginEmailInput.value = rememberedEmail;
                rememberMeInput.checked = true;
            }

            rememberMeInput.addEventListener('change', () => {
                if (!rememberMeInput.checked) {
                    clearRememberedEmail();
                }
            });

            /* ------------------------------------------------------------------
               4. SENHAS: alternar visibilidade e ícone do campo
               ------------------------------------------------------------------ */
            toggleButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const targetId = button.getAttribute('data-target');
                    const passwordInput = document.getElementById(targetId);
                    const svgIcon = button.querySelector('svg');

                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        // Altera SVG para olho "fechado" / "cortado"
                        svgIcon.innerHTML = `
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                        `;
                    } else {
                        passwordInput.type = 'password';
                        // Retorna ao SVG de olho "aberto"
                        svgIcon.innerHTML = `
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        `;
                    }
                });
            });

            /* ------------------------------------------------------------------
               5. NOTIFICAÇÕES: criar, exibir e remover mensagens toast
               ------------------------------------------------------------------ */
            function showToast(message, type = 'success') {
                const toast = document.createElement('div');
                toast.className = `toast ${type}`;

                const iconSvg = type === 'success'
                    ? `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
                    : `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

                toast.innerHTML = iconSvg;
                const messageElement = document.createElement('span');
                messageElement.textContent = message;
                toast.append(messageElement);
                toastContainer.appendChild(toast);

                // Dispara animação de entrada
                requestAnimationFrame(() => {
                    toast.classList.add('show');
                });

                // Remove o toast após 4 segundos
                setTimeout(() => {
                    toast.classList.remove('show');
                    toast.addEventListener('transitionend', () => {
                        toast.remove();
                    });
                }, 4000);
            }

            /* ------------------------------------------------------------------
               6. SESSÃO: mostra o painel autenticado e consulta a sessão existente
               ------------------------------------------------------------------ */
            function showAuthenticatedAccount(user) {
                authShell.hidden = true;
                accountPanel.hidden = false;
                accountGreeting.textContent = `Olá, ${user.name}`;
            }

            // Restaura a área autenticada quando o cookie já representa uma sessão válida.
            apiRequest('/api/auth/me')
                .then(({ user }) => showAuthenticatedAccount(user))
                .catch(() => {
                    // A interface continua disponível sem sessão ativa ou sem API conectada.
                });

            // Pede ao backend para invalidar a sessão antes de voltar ao formulário.
            logoutButton.addEventListener('click', async () => {
                logoutButton.disabled = true;
                try {
                    await apiRequest('/api/auth/logout', { method: 'POST', body: '{}' });
                    accountPanel.hidden = true;
                    authShell.hidden = false;
                    showToast('Sessão encerrada.', 'success');
                } catch (error) {
                    showToast(error.message, 'error');
                } finally {
                    logoutButton.disabled = false;
                }
            });

            /* ------------------------------------------------------------------
               7. LOGIN: valida credenciais no backend e cria uma sessão SQL
               ------------------------------------------------------------------ */
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                // Lê os dados e a preferência de e-mail antes de enviar o login.
                const email = loginEmailInput.value.trim();
                const password = document.getElementById('login-password').value;
                const shouldRememberEmail = rememberMeInput.checked;
                const btnSubmit = loginForm.querySelector('.btn-submit');

                // Validações básicas
                if (!email || !password) {
                    showToast('Por favor, preencha todos os campos.', 'error');
                    return;
                }

                btnSubmit.classList.add('loading');
                try {
                    // O servidor verifica a senha e define o cookie HttpOnly da sessão.
                    const { user } = await apiRequest('/api/auth/login', {
                        method: 'POST',
                        body: JSON.stringify({
                            emailOrName: email,
                            password,
                            rememberMe: shouldRememberEmail,
                        }),
                    });
                    btnSubmit.classList.remove('loading');
                    if (shouldRememberEmail) {
                        saveRememberedEmail(email);
                    } else {
                        clearRememberedEmail();
                    }
                    showAuthenticatedAccount(user);
                    loginForm.reset();
                    if (shouldRememberEmail) {
                        loginEmailInput.value = email;
                        rememberMeInput.checked = true;
                    }
                    showToast('Login realizado com sucesso.', 'success');
                } catch (error) {
                    showToast(error.message, 'error');
                } finally {
                    btnSubmit.classList.remove('loading');
                }
            });

            /* ------------------------------------------------------------------
               8. CADASTRO: cria uma conta persistida no banco SQLite
               ------------------------------------------------------------------ */
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                // Lê os três campos que compõem a nova conta.
                const name = document.getElementById('signup-name').value.trim();
                const email = document.getElementById('signup-email').value.trim();
                const password = document.getElementById('signup-password').value;
                const btnSubmit = signupForm.querySelector('.btn-submit');

                if (!name || !email || !password) {
                    showToast('Por favor, preencha todos os campos.', 'error');
                    return;
                }

                if (password.length < 8) {
                    showToast('A senha deve ter pelo menos 8 caracteres.', 'error');
                    return;
                }

                btnSubmit.classList.add('loading');
                try {
                    // Persiste a conta no backend; depois direciona a pessoa ao login.
                    await apiRequest('/api/auth/register', {
                        method: 'POST',
                        body: JSON.stringify({ name, email, password }),
                    });
                    showToast('Conta criada. Faça login para continuar.', 'success');
                    signupForm.reset();
                    loginEmailInput.value = email;
                    showLoginForm();
                } catch (error) {
                    showToast(error.message, 'error');
                } finally {
                    btnSubmit.classList.remove('loading');
                }
            });

            /* ------------------------------------------------------------------
               9. RECUPERAÇÃO: informa que o envio de e-mail ainda não foi configurado
               ------------------------------------------------------------------ */
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('A recuperação por e-mail ainda não está configurada.', 'error');
            });

        });
