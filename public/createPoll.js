document.getElementById('addOption').addEventListener('click', () => {
    const moreOptions = document.getElementById('moreOptions');
    const count = document.querySelectorAll('.answer').length + 1;
    moreOptions.insertAdjacentHTML('beforeend', `
        <input type="text" class="answer" name="answer" placeholder="Вариант ${count}" required>
    `);
});

document.getElementById('pollForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const question = document.getElementById('question').value.trim();
    const description = document.getElementById('description').value.trim();
    const answers = [...document.querySelectorAll('.answer')]
        .map(input => input.value.trim())
        .filter(Boolean);

    if (!question) return alert('Вопрос обязателен');
    if (answers.length < 2) return alert('Добавьте минимум 2 варианта ответа');

    try {
        const res = await fetch('http://localhost:3000/polls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, description, answers })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Ошибка создания опроса');
        alert(data.message);
        window.location.href = 'allPolls.html';
    } catch (err) {
        alert(err.message);
    }
});