const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Middleware для обработки PATCH запросов (лайков)
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
  
  if (req.body.avatar) {
    user.avatar = req.body.avatar;
    db.get('users').find({ id: "user1" }).assign(user).write();
    res.json(user);
  } else {
    res.status(400).json({ error: "Не указана ссылка на аватар" });
  }
});

const PORT = process.env.PORT || 8090;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`JSON Server запущен на http://0.0.0.0:${PORT}`);
});
