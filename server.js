// 1. Importar as bibliotecas
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const EventEmitter = require('events');

// 2. Inicializar o Express e o Middleware de Mensagens
const app = express();
const messageQueue = new EventEmitter();
const PORT = 3000;

// 3. Configurar os Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- DADOS "MARRETADOS" ---
const TISAUDE_BASE_URL = 'https://api.tisaude.com';
const AUTH_TOKEN = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwaS50aXNhdWRlLmNvbSIsImlhdCI6MTc1NTIwOTcyOSwiZXhwIjoxNzU3ODAxNzI5LCJuYmYiOjE3NTUyMDk3MjksImp0aSI6IjFRTDZ1ZEwzYmxsdmpDZXMiLCJzdWIiOiI4Nzk2MyIsInBydiI6IjU4NzA4NjNkNGE2MmQ3OTE0NDNmYWY5MzZmYzM2ODAzMWQxMTBjNGYifQ.PT5m9YRmrMz4MNwgR7ib49WFVLOL6pxPNv3bMER0U8c'; 
// -------------------------

// =======================================================================
//  "CONSUMERS" / "WORKERS" - Nenhuma alteração aqui
// =======================================================================

messageQueue.on('CADASTRAR_PACIENTE', async (pacienteData) => {
  console.log('[WORKER] Recebido evento CADASTRAR_PACIENTE:', pacienteData.name);
  try {
    //
    await axios.post(`${TISAUDE_BASE_URL}/api/patients/create`, pacienteData, {
      headers: { 'Authorization': AUTH_TOKEN }
    });
    console.log(`[WORKER] Paciente ${pacienteData.name} cadastrado com sucesso!`);
  } catch (error) {
    console.error(`[WORKER] Falha ao cadastrar paciente:`, error.response ? error.response.data : error.message);
  }
});

messageQueue.on('AGENDAR_CONSULTA', async (agendamentoData) => {
  console.log('[WORKER] Recebido evento AGENDAR_CONSULTA para o paciente ID:', agendamentoData.idPatient);
  try {
    //
    await axios.post(`${TISAUDE_BASE_URL}/api/schedule/new`, agendamentoData, {
      headers: { 'Authorization': AUTH_TOKEN }
    });
    console.log(`[WORKER] Consulta para o paciente ID ${agendamentoData.idPatient} agendada!`);
  } catch (error) {
    console.error(`[WORKER] Falha ao agendar consulta:`, error.response ? error.response.data : error.message);
  }
});


// =======================================================================
//  ROTAS DA API (ENDPOINT) - "PRODUCERS"
// =======================================================================

// --- ROTA DE CADASTRO (ASSÍNCRONA) --- (Nenhuma alteração aqui)
app.post('/api/pacientes', (req, res) => {
  const pacienteData = req.body;
  console.log('[PRODUCER] Recebida requisição para cadastrar paciente:', pacienteData.name);
  messageQueue.emit('CADASTRAR_PACIENTE', pacienteData);
  res.status(202).json({ message: 'Solicitação de cadastro recebida e sendo processada.' });
});
// server.js

// --- ROTA DE BUSCA (SÍNCRONA) --- (*** CÓDIGO CORRIGIDO ***)
app.get('/api/pacientes', async (req, res) => {
  const termoBusca = req.query.termo || '';

  try {
    const response = await axios.get(`${TISAUDE_BASE_URL}/api/patients`, {
      headers: { 'Authorization': AUTH_TOKEN },
      params: { search: termoBusca }
    });

    // CORREÇÃO: A API retorna a lista dentro da chave "data"
    const listaExterna = response.data.data; 
    
    // CORREÇÃO: O ID do paciente é "id" na lista
    const pacientesSimplificados = listaExterna.map(paciente => ({
      id: paciente.id, 
      name: paciente.name,
      cpf: paciente.cpf,
      dateOfBirth: paciente.dateOfBirth
    }));

    res.json(pacientesSimplificados);

  } catch (error) {
    console.error('Erro ao buscar pacientes:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Falha ao buscar pacientes.' });
  }
});

// --- ROTA PARA BUSCAR DETALHES DE UM ÚNICO PACIENTE --- (*** CÓDIGO CORRIGIDO ***)
app.get('/api/pacientes/:id', async (req, res) => {
  const pacienteId = req.params.id;

  try {
    // CORREÇÃO: Adicionado o "#" antes do ID do paciente na URL da API externa
    const response = await axios.get(`${TISAUDE_BASE_URL}/api/patients/#${pacienteId}`, {
      headers: { 'Authorization': AUTH_TOKEN }
    });

    const dadosPaciente = response.data.data;
    const pacienteSimplificado = {
      idPatient: dadosPaciente.idPatient,
      name: dadosPaciente.name,
      cpf: dadosPaciente.cpf,
      dateOfBirth: dadosPaciente.dateOfBirth,
      cellphone: dadosPaciente.cellphone,
      email: dadosPaciente.email
    };

    res.json(pacienteSimplificado);

  } catch (error) {
    console.error(`Erro ao buscar detalhes do paciente ${pacienteId}:`, error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Falha ao buscar detalhes do paciente.' });
  }
});

// --- ROTA DE AGENDAMENTO (ASSÍNCRONA) --- (Nenhuma alteração aqui)
app.post('/api/agendamentos', (req, res) => {
  const agendamentoData = req.body;
  console.log('[PRODUCER] Recebida requisição para agendar consulta:', agendamentoData);
  messageQueue.emit('AGENDAR_CONSULTA', agendamentoData);
  res.status(202).json({ message: 'Solicitação de agendamento recebida e sendo processada.' });
});


// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('Workers de mensageria estão ouvindo por eventos...');
});