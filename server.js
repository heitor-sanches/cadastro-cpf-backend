require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const app = express();

app.use(express.json());

const CadastroSchema = new mongoose.Schema({
  cpf: { type: String, unique: true },
  senha: String,
});
const Cadastro = mongoose.model('Cadastro', CadastroSchema);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Erro ao conectar MongoDB:', err));

app.post('/cadastrar', async (req, res) => {
  const { cpf, senha } = req.body;

  if (!cpf || !senha) {
    return res.status(400).json({ message: 'CPF e senha obrigatórios.' });
  }

  try {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
