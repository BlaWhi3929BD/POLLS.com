document.addEventListener('DOMContentLoaded', () => {
    const SERVER_URL = 'http://localhost:3000';

    // Проверка авторизации
    fetch(`${SERVER_URL}/profile`)
        .then(res => res.json())
        .then(data => {
            if (data.username) {
                document.getElementById('login-a').textContent = data.username;
                document.getElementById('login-a').href = `/profile.html?user=${data.username}`;
            }
        })
        .catch(() => {});

    // Форма входа
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!username || !password) return showError('loginError', 'Все поля обязательны');

        try {
            const res = await fetch(`${SERVER_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                alert(data.message);
                window.location.href = 'index.html';
            } else {
                showError('loginError', data.message);
            }
        } catch {
            showError('loginError', 'Ошибка сервера');
        }
    });

    // Форма регистрации
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signupUsername').value.trim();
        const password = document.getElementById('signupPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();

        if (!username || !password || !confirmPassword) return showError('signupError', 'Все поля обязательны');
        if (password !== confirmPassword) return showError('signupError', 'Пароли не совпадают');

        try {
            const res = await fetch(`${SERVER_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                alert(data.message);
                toggleForms('login');
                document.getElementById('signupForm').reset();
            } else {
                showError('signupError', data.message);
            }
        } catch {
            showError('signupError', 'Ошибка сервера');
        }
    });

    // Переключение форм
    document.getElementById('switchToSignup').addEventListener('click', () => toggleForms('signup'));
    document.getElementById('switchToLogin').addEventListener('click', () => toggleForms('login'));

    // Выход (добавим кнопку в HTML позже, если нужно)
    document.getElementById('logout')?.addEventListener('click', async () => {
        try {
            const res = await fetch(`${SERVER_URL}/logout`, { method: 'POST' });
            if (res.ok) window.location.reload();
        } catch {
            alert('Ошибка выхода');
        }
    });

    function showError(id, message) {
        const error = document.getElementById(id);
        error.textContent = message;
        error.style.display = 'block';
    }

    function toggleForms(form) {
        const loginContainer = document.getElementById('loginContainer');
        const signupContainer = document.getElementById('signupContainer');
        loginContainer.style.display = form === 'login' ? 'block' : 'none';
        signupContainer.style.display = form === 'signup' ? 'block' : 'none';
    }
});