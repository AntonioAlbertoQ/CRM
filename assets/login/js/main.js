document.addEventListener('DOMContentLoaded', () => {

// Elementos DOM
            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');
            const gotoSignup = document.getElementById('goto-signup');
            const gotoLogin = document.getElementById('goto-login');
            const formTitle = document.getElementById('form-title');
            const formSubtitle = document.getElementById('form-subtitle');
            const forgotPasswordLink = document.getElementById('forgot-password-link');
            const toggleButtons = document.querySelectorAll('.toggle-password');
            const toastContainer = document.getElementById('toast-container');

            /* ------------------------------------------------------------------
               A. Alternância entre Login e Cadastro
               ------------------------------------------------------------------ */
            gotoSignup.addEventListener('click', () => {
                loginForm.classList.remove('active');
                loginForm.classList.add('exit-left');

                setTimeout(() => {
                    signupForm.classList.add('active');
                    formTitle.textContent = "Criar nova conta";
                    formSubtitle.textContent = "Preencha os dados abaixo para se cadastrar";
                }, 150);
            });

            gotoLogin.addEventListener('click', () => {
                signupForm.classList.remove('active');

                setTimeout(() => {
                    loginForm.classList.remove('exit-left');
                    loginForm.classList.add('active');
                    formTitle.textContent = "Bem-vindo de volta";
                    formSubtitle.textContent = "Insira suas credenciais para acessar sua conta";
                }, 150);
            });

            /* ------------------------------------------------------------------
               B. Alternar Visibilidade da Senha (Toggle Password)
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
               C. Sistema de Notificações Toast
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
               D. Simulação de Submissão e Validação do Login
               ------------------------------------------------------------------ */
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const email = document.getElementById('login-email').value.trim();
                const password = document.getElementById('login-password').value.trim();
                const btnSubmit = loginForm.querySelector('.btn-submit');

                // Validações básicas
                if (!email || !password) {
                    showToast('Por favor, preencha todos os campos.', 'error');
                    return;
                }

                // Iniciar estado de carregamento
                btnSubmit.classList.add('loading');

                // Simulação de chamada de API (delay de 1.8 segundos)
                setTimeout(() => {
                    btnSubmit.classList.remove('loading');

                    // Simulação simples de sucesso
                    if (password.length >= 6) {
                        showToast('Login realizado com sucesso! Redirecionando...', 'success');
                        loginForm.reset();
                    } else {
                        showToast('Senha incorreta (mínimo 6 caracteres).', 'error');
                    }
                }, 1800);
            });

            /* ------------------------------------------------------------------
               E. Simulação de Submissão do Cadastro
               ------------------------------------------------------------------ */
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const name = document.getElementById('signup-name').value.trim();
                const email = document.getElementById('signup-email').value.trim();
                const password = document.getElementById('signup-password').value.trim();
                const btnSubmit = signupForm.querySelector('.btn-submit');

                if (!name || !email || !password) {
                    showToast('Por favor, preencha todos os campos.', 'error');
                    return;
                }

                if (password.length < 6) {
                    showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
                    return;
                }

                btnSubmit.classList.add('loading');

                setTimeout(() => {
                    btnSubmit.classList.remove('loading');
                    showToast('Conta criada com sucesso! Faça login.', 'success');
                    signupForm.reset();

                    // Alterna automaticamente para o formulário de login
                    gotoLogin.click();
                }, 1800);
            });

            /* ------------------------------------------------------------------
               F. Evento Esqueceu a Senha
               ------------------------------------------------------------------ */
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value.trim();

                if (!email) {
                    showToast('Digite seu e-mail no campo acima para redefinir.', 'error');
                } else {
                    showToast(`Instruções enviadas para ${email}`, 'success');
                }
            });

        });
