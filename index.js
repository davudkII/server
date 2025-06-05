const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_URL = `https://${GITHUB_TOKEN}@github.com/davudkII/server.git`;
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const fs = require('fs');
const { execSync } = require('child_process');

// Настройка CORS
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Конфигурация Git
const GIT_USERNAME = 'Render Server';
const GIT_EMAIL = 'render@example.com';
const GIT_REMOTE = process.env.REPO_URL || 'origin';
const GIT_BRANCH = 'main';

// Функция для коммита изменений в GitHub
function gitCommitAndPush() {
  try {
    // Проверяем есть ли изменения в db.json
    const gitStatus = execSync('git status --porcelain db.json').toString();
    if (!gitStatus) return;

    console.log('Обнаружены изменения в db.json, делаем коммит...');
    
    
    execSync(`git config --global user.name "${GIT_USERNAME}"`);
    execSync(`git config --global user.email "${GIT_EMAIL}"`);
    
    
    execSync('git add db.json');
    execSync(`git commit -m "Auto-update db.json [${new Date().toISOString()}]"`);
    
   
    execSync(`git push ${GIT_REMOTE} ${GIT_BRANCH}`);
    
    console.log('Изменения успешно запушены в GitHub');
  } catch (error) {
    console.error('Ошибка при коммите в GitHub:', error.message);
  }
}

// Middleware для автоматического коммита после изменений
server.use((req, res, next) => {
  const oldWrite = res.write;
  const oldEnd = res.end;
  const chunks = [];

  res.write = (...args) => {
    chunks.push(Buffer.from(args[0]));
    oldWrite.apply(res, args);
  };

  res.end = (...args) => {
    if (args[0]) {
      chunks.push(Buffer.from(args[0]));
    }
    
    // Если это PATCH/POST/PUT/DELETE запрос - делаем коммит
    if (['PATCH', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
      setTimeout(gitCommitAndPush, 1000); // Даем время на запись в файл
    }
    
    oldEnd.apply(res, args);
  };

  next();
});

// Кастомные роуты
server.patch('/cards/:id', (req, res) => {
  const db = router.db;
  const card = db.get('cards').find({ id: Number(req.params.id) }).value();
  
  if (req.body.likes) {
    card.likes = req.body.likes;
  }
  
  db.get('cards').find({ id: Number(req.params.id) }).assign(card).write();
  res.json(card);
});

server.patch('/users/user1', (req, res) => {
  const db = router.db;
  const user = db.get('users').find({ id: "user1" }).value();

  // Обновляем только те поля, которые были переданы в теле запроса
  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.about !== undefined) user.about = req.body.about;
  if (req.body.avatar !== undefined) user.avatar = req.body.avatar;

  db.get('users').find({ id: "user1" }).assign(user).write();
  res.json(user);
});

// Основной роутинг
server.use(router);

// Запуск сервера
const PORT = process.env.PORT || 8090;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`JSON Server запущен на http://0.0.0.0:${PORT}`);
  
  // Первоначальная синхронизация с GitHub
  try {
    execSync('git checkout main && git pull origin main');
    console.log('Синхронизировано с GitHub');
  } catch (error) {
    console.error('Ошибка при синхронизации с GitHub:', error.message);
  }
});
