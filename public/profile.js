document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlUsername = urlParams.get('user');

    try {
        const res = await fetch('http://localhost:3000/profile');
        const data = await res.json();

        if (res.ok) {
            const username = data.username;
            document.getElementById('username').textContent = username;
            document.getElementById('login-a').textContent = username;
            document.getElementById('login-a').href = `/profile.html?user=${username}`;
            await Promise.all([loadUserPolls(username), loadUserVotes(username)]);
        } else if (urlUsername) {
            document.getElementById('username').textContent = urlUsername;
            await Promise.all([loadUserPolls(urlUsername), loadUserVotes(urlUsername)]);
        } else {
            window.location.href = 'SignInUp.html';
        }
    } catch {
        if (urlUsername) {
            document.getElementById('username').textContent = urlUsername;
            await Promise.all([loadUserPolls(urlUsername), loadUserVotes(urlUsername)]);
        } else {
            window.location.href = 'SignInUp.html';
        }
    }
});

async function loadUserPolls(username) {
    try {
        const res = await fetch(`http://localhost:3000/user-polls?username=${username}`);
        if (!res.ok) throw new Error('Ошибка загрузки опросов');
        const polls = await res.json();
        document.getElementById('created').innerHTML = polls.map(poll => `
            <div class="poll">
                <h3>${poll.question}</h3>
                <p>${poll.description || 'Описание отсутствует'}</p>
            </div>
        `).join('');
    } catch {
        alert('Ошибка загрузки созданных опросов');
    }
}

async function loadUserVotes(username) {
    try {
        const res = await fetch(`http://localhost:3000/user-votes?username=${username}`);
        if (!res.ok) throw new Error('Ошибка загрузки голосов');
        const votes = await res.json();
        document.getElementById('voted').innerHTML = votes.map(vote => `
            <div class="poll">
                <h3>${vote.question}</h3>
                <p>Проголосовано за: ${vote.choice}</p>
                <button onclick="toggleVote('${vote.id}', '${username}')">
                    ${vote.hidden ? 'Показать в профиле' : 'Скрыть из профиля'}
                </button>
            </div>
        `).join('');
    } catch {
        alert('Ошибка загрузки голосов');
    }
}

window.toggleVote = async (voteId, username) => {
    try {
        const res = await fetch('http://localhost:3000/toggle-vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: voteId })
        });
        if (!res.ok) throw new Error('Ошибка переключения');
        await loadUserVotes(username);
    } catch {
        alert('Не удалось переключить видимость голоса');
    }
};

window.showTab = (tab) => {
    const created = document.getElementById('created');
    const voted = document.getElementById('voted');
    if (tab === 'created') {
        created.style.display = 'block';
        voted.style.display = 'none';
    } else {
        created.style.display = 'none';
        voted.style.display = 'block';
    }
};