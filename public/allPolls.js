document.addEventListener('DOMContentLoaded', loadPolls);

async function loadPolls() {
    try {
        const res = await fetch('http://localhost:3000/polls');
        if (!res.ok) throw new Error('Ошибка загрузки опросов');
        const polls = await res.json();

        document.getElementById('polls').innerHTML = polls.map(poll => `
            <div class="poll">
                <h3>${poll.question}</h3>
                <p>${poll.description || 'Описание отсутствует'}</p>
                <p>Автор: <a href="/profile.html?user=${poll.author}">${poll.author}</a></p>
                <div class="poll-buttons">
                    ${poll.answers.map(a => `
                        <button onclick="vote('${poll.question}', '${a.text}')">
                            ${a.text} - ${a.votes} голос${a.votes === 1 ? '' : 'ов'} (${a.percentage})
                        </button>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch {
        alert('Ошибка загрузки опросов');
    }
}

async function vote(question, answer) {
    try {
        const res = await fetch('http://localhost:3000/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, answer })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Ошибка голосования');
        alert(data.message);
        loadPolls();
    } catch (err) {
        alert(err.message);
    }
}