const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost/Banco')
  .then(() => {
    console.log('Conectado ao MongoDB');
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
  });

// Adicionar uma chave secreta para assinar o token JWT
const secretKey = 'Brendda';

// Middleware para validar o token JWT
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Esquema para usuários
const usuariosSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const Usuario = mongoose.model('Usuario', usuariosSchema);

// Rota para registrar um novo usuário
app.post('/usuarios/registrar', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Verifique se o usuário já existe
    const usuarioExistente = await Usuario.findOne({ username });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Usuário já registrado' });
    }

    // Crie um novo usuário
    const novoUsuario = new Usuario({
      username,
      password,
    });

    // Salve o novo usuário no banco de dados
    await novoUsuario.save();

    // Responda com sucesso
    res.send('Novo usuário registrado com sucesso.');
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
});

// Rota para autenticar usuário e gerar token JWT
app.post('/usuarios/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const usuario = await Usuario.findOne({ username });

    if (!usuario || usuario.password !== password) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ username }, secretKey);
    res.json({ token });
  } catch (err) {
    console.error('Erro ao autenticar usuário:', err);
    res.status(500).json({ error: 'Erro ao autenticar usuário.' });
  }
});

// Definir um esquema para os serviços
const servicosSchema = new mongoose.Schema({
  nome: String,
  descricao: String,
  dataCriacao: { type: Date, default: Date.now },
  status: String,
});

const Servico = mongoose.model('Servico', servicosSchema);

// Definir um esquema para os clientes
const clientesSchema = new mongoose.Schema({
  nome: String,
  email: String,
  telefone: String,
  endereco: String,
});

const Cliente = mongoose.model('Cliente', clientesSchema);

// Definir um esquema para os projetos
const projetosSchema = new mongoose.Schema({
  nome: String,
  descricao: String,
  dataInicio: Date,
  dataFim: Date,
  status: String,
});

const Projeto = mongoose.model('Projeto', projetosSchema);

// Rota para adicionar um novo serviço
app.post('/servicos/adicionar', authenticateToken, async (req, res) => {
  const { nome, descricao, status } = req.body;

  // Verificar se todos os campos necessários estão presentes
  if (!nome || !descricao || !status) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const novoServico = new Servico({
      nome,
      descricao,
      status,
    });

    await novoServico.save();
    res.send('Novo serviço adicionado com sucesso.');
  } catch (err) {
    console.error('Erro ao adicionar serviço:', err);
    res.status(500).json({ error: 'Erro ao adicionar serviço.' });
  }
});

// Rota para listar serviços
app.get('/servicos/listar', authenticateToken, async (req, res) => {
  try {
    const servicos = await Servico.find();
    res.json({ servicos });
  } catch (err) {
    console.error('Erro ao listar serviços:', err);
    res.status(500).json({ error: 'Erro ao listar serviços.' });
  }
});

// Rota para adicionar um novo cliente
app.post('/clientes/adicionar', authenticateToken, async (req, res) => {
  const { nome, email, telefone, endereco } = req.body;

  // Verificar se todos os campos necessários estão presentes
  if (!nome || !email || !telefone || !endereco) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const novoCliente = new Cliente({
      nome,
      email,
      telefone,
      endereco,
    });

    await novoCliente.save();
    res.send('Novo cliente adicionado com sucesso.');
  } catch (err) {
    console.error('Erro ao adicionar cliente:', err);
    res.status(500).json({ error: 'Erro ao adicionar cliente.' });
  }
});

// Rota para criar um novo projeto
app.post('/projetos/criar', authenticateToken, async (req, res) => {
  const { nome, descricao, dataInicio, dataFim, status } = req.body;

  // Verificar se todos os campos necessários estão presentes
  if (!nome || !descricao || !dataInicio || !dataFim || !status) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const novoProjeto = new Projeto({
      nome,
      descricao,
      dataInicio,
      dataFim,
      status,
    });

    await novoProjeto.save();
    res.send('Novo projeto criado com sucesso.');
  } catch (err) {
    console.error('Erro ao criar projeto:', err);
    res.status(500).json({ error: 'Erro ao criar projeto.' });
  }
});

// Rota padrão na raiz do servidor
app.get('/', (req, res) => {
  res.send('Bem-vindo à API!');
});

const port = process.env.PORT || 3000;

app.listen(3000, () => {
  console.log(`API rodando na porta ${port}`);
});
