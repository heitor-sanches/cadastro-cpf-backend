require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Definição do Schema e do Model do MongoDB
const CadastroSchema = new mongoose.Schema({
  cpf: { type: String, unique: true },
  senha: String,
});
const Cadastro = mongoose.model('Cadastro', CadastroSchema);

// Conexão com MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Erro ao conectar MongoDB:', err));

// NOVA ROTA - Verificar CPF
app.get('/verificar-cpf', async (req, res) => {
  const { cpf } = req.query;

  if (!cpf) {
    return res.status(400).json({ message: 'CPF é obrigatório.' });
  }

  try {
    // Consulta API externa de verificação de CPF
    const resposta = await axios.get(`https://test-nuvem.onrender.com/verificar-cpf?cpf=${cpf}`);
    const { valido } = resposta.data;

    res.json({ valido });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao verificar CPF.' });
  }
});

// ROTA PARA CADASTRAR CPF E SENHA
app.post('/cadastrar', async (req, res) => {
  const { cpf, senha } = req.body;

  if (!cpf || !senha) {
    return res.status(400).json({ message: 'CPF e senha obrigatórios.' });
  }

  try {
    // Verifica CPF antes de cadastrar
    const resposta = await axios.get(`https://test-nuvem.onrender.com/verificar-cpf?cpf=${cpf}`);
    const { valido } = resposta.data;

    if (!valido) {
      return res.status(400).json({ message: 'CPF inválido.' });
    }

    const existente = await Cadastro.findOne({ cpf });

    if (existente) {
      return res.status(409).json({ message: 'CPF já cadastrado.' });
    }

    const novoCadastro = new Cadastro({ cpf, senha });
    await novoCadastro.save();

    res.status(201).json({ message: 'Cadastro realizado com sucesso.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});

// Inicializa o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
