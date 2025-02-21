const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises; // Используем промисы для асинхронности
const cors = require('cors');
const session = require('express-session');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Для локального тестирования, в продакшене secure: true
}));

const USERS_FILE = './logins.json';
const POLLS_FILE = './polls.json';
const VOTES_FILE = './votes.json'; // Новый файл для хранения голосов

// Вспомогательные функции
async function readFile(file, defaultValue = []) {
    try {
        const data = await fs.readFile(file, 'utf8');
        return JSON.parse(data) || defaultValue;
    } catch (err) {
        return defaultValue;
    }
}

async function writeFile(file, data) {
    await fs.writeFile(file, JSON.stringify(data, null, 2));
}

function getVoteLabel(votes) {
    if (votes % 10 === 1 && votes % 100 !== 11) return `${votes} голос`;
    if ([2, 3, 4].includes(votes % 10) && ![12, 13, 14].includes(votes % 100)) return `${votes} голоса`;
    return `${votes} голосов`;
}

// Регистрация
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Имя пользователя и пароль обязательны' });

    const users = await readFile(USERS_FILE);
    if (users.some(u => u.username === username)) {
        return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    users.push({ username, password });
    await writeFile(USERS_FILE, users);
    res.json({ message: 'Регистрация успешна' });
});

// Вход
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Имя пользователя и пароль обязательны' });

    const users = await readFile(USERS_FILE);
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ message: 'Неверные учетные данные' });

    req.session.user = username;
    res.json({ message: 'Вход выполнен', username });
});

// Профиль
app.get('/profile', (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Не авторизован' });
    res.json({ username: req.session.user });
});

// Все опросы
app.get('/polls', async (req, res) => {
    const polls = await readFile(POLLS_FILE);
    res.json(polls);
});

// Создание опроса
app.post('/polls', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Не авторизован' });

    const { question, description, answers } = req.body;
    if (!question || !answers || !Array.isArray(answers) || answers.length < 2) {
        return res.status(400).json({ message: 'Вопрос и минимум 2 ответа обязательны' });
    }

    const polls = await readFile(POLLS_FILE);
    const newPoll = {
        question,
        description: description || '',
        answers: answers.map(text => ({ text, votes: 0, percentage: '0%' })),
        author: req.session.user
    };
    polls.push(newPoll);
    await writeFile(POLLS_FILE, polls);
    res.status(201).json({ message: 'Опрос добавлен', poll: newPoll });
});

// Голосование
app.post('/vote', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Не авторизован' });

    const { question, answer } = req.body;
    if (!question || !answer) return res.status(400).json({ message: 'Вопрос и ответ обязательны' });

    const polls = await readFile(POLLS_FILE);
    const votes = await readFile(VOTES_FILE);
    const poll = polls.find(p => p.question === question);
    if (!poll) return res.status(404).json({ message: 'Опрос не найден' });
    if (poll.author === req.session.user) return res.status(403).json({ message: 'Нельзя голосовать в своем опросе' });

    const hasVoted = votes.some(v => v.username === req.session.user && v.question === question);
    if (hasVoted) return res.status(403).json({ message: 'Вы уже проголосовали' });

    const option = poll.answers.find(a => a.text === answer);
    if (!option) return res.status(400).json({ message: 'Неверный вариант ответа' });

    option.votes += 1;
    const totalVotes = poll.answers.reduce((sum, a) => sum + a.votes, 0);
    poll.answers.forEach(a => {
        a.percentage = totalVotes ? ((a.votes / totalVotes) * 100).toFixed(1) + '%' : '0%';
    });

    votes.push({ id: `${req.session.user}-${question}-${Date.now()}`, username: req.session.user, question, choice: answer, hidden: false });
    await Promise.all([writeFile(POLLS_FILE, polls), writeFile(VOTES_FILE, votes)]);
    res.json({ message: `Голос учтен. Всего: ${getVoteLabel(totalVotes)}`, poll });
});

// Опросы пользователя
app.get('/user-polls', async (req, res) => {
    const username = req.query.username || req.session.user;
    if (!username) return res.status(401).json({ message: 'Не авторизован и имя пользователя не указано' });

    const polls = await readFile(POLLS_FILE);
    const userPolls = polls.filter(p => p.author === username);
    res.json(userPolls);
});

// Голоса пользователя
app.get('/user-votes', async (req, res) => {
    const username = req.query.username || req.session.user;
    if (!username) return res.status(401).json({ message: 'Не авторизован и имя пользователя не указано' });

    const votes = await readFile(VOTES_FILE);
    res.json(votes.filter(v => v.username === username));
});

// Переключение видимости голоса
app.post('/toggle-vote', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Не авторизован' });

    const { id } = req.body;
    const votes = await readFile(VOTES_FILE);
    const vote = votes.find(v => v.id === id && v.username === req.session.user);
    if (!vote) return res.status(404).json({ message: 'Голос не найден' });

    vote.hidden = !vote.hidden;
    await writeFile(VOTES_FILE, votes);
    res.json({ message: vote.hidden ? 'Голос скрыт' : 'Голос показан' });
});

// Выход
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'Ошибка выхода' });
        res.json({ message: 'Выход выполнен' });
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});