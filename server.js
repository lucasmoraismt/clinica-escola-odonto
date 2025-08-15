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
//  "CONSUMERS" / "WORKERS"
// =======================================================================
messageQueue.on('CADASTRAR_PACIENTE', async (pacienteData) => {
  console.log('[WORKER] Recebido evento CADASTRAR_PACIENTE:', pacienteData.name);
  try {
    await axios.post(`${TISAUDE_BASE_URL}/api/patients/create`, pacienteData, {
      headers: { 'Authorization': AUTH_TOKEN }
    });
    console.log(`[WORKER] Paciente ${pacienteData.name} cadastrado com sucesso!`);
  } catch (error) {
    console.error(`[WORKER] Falha ao cadastrar paciente:`, error.response ? error.response.data : error.message);
  }
});

// =======================================================================
//  ROTAS DA API (ENDPOINT) - "PRODUCERS"
// =======================================================================
app.post('/api/pacientes', (req, res) => {
  const pacienteData = req.body;
  console.log('[PRODUCER] Recebida requisição para cadastrar paciente:', pacienteData.name);
  messageQueue.emit('CADASTRAR_PACIENTE', pacienteData);
  res.status(202).json({ message: 'Solicitação de cadastro recebida e sendo processada.' });
});

app.get('/api/pacientes', async (req, res) => {
  const termoBusca = req.query.termo || '';
  try {
    const response = await axios.get(`${TISAUDE_BASE_URL}/api/patients`, {
      headers: { 'Authorization': AUTH_TOKEN },
      params: { search: termoBusca }
    });
    const listaExterna = response.data.data;
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

// --- ROTA PARA BUSCAR DADOS DE IDENTIFICAÇÃO DO PACIENTE ---
app.get('/api/pacientes/:id', async (req, res) => {
  const pacienteId = req.params.id;
  try {
    const response = await axios.get(`${TISAUDE_BASE_URL}/api/patients/${pacienteId}`, {
      headers: { 'Authorization': AUTH_TOKEN }
    });
    // Apenas repassamos a resposta completa, pois o frontend irá tratá-la
    res.json(response.data);
  } catch (error) {
    console.error(`Erro ao buscar detalhes do paciente ${pacienteId}:`, error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Falha ao buscar detalhes do paciente.' });
  }
});

// --- NOVA ROTA: BUSCAR HISTÓRICO (TIMELINE) DO PACIENTE ---
app.get('/api/pacientes/:id/timeline', async (req, res) => {
  const pacienteId = req.params.id;
  try {
    const response = await axios.get(`${TISAUDE_BASE_URL}/api/patients/${pacienteId}/timeline/detailed`, {
      headers: { 'Authorization': AUTH_TOKEN }
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Erro ao buscar timeline do paciente ${pacienteId}:`, error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Falha ao buscar timeline do paciente.' });
  }
});

// --- NOVA ROTA: BUSCAR FICHAS (ANAMNESE) DO PACIENTE ---
app.get('/api/pacientes/:id/fichas', async (req, res) => {
  const pacienteId = req.params.id;
  try {
    const response = await axios.get(`${TISAUDE_BASE_URL}/api/patients/${pacienteId}/ehr/list`, {
      headers: { 'Authorization': AUTH_TOKEN },
      params: { tab: 'fichas' }
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Erro ao buscar fichas do paciente ${pacienteId}:`, error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Falha ao buscar fichas do paciente.' });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('Workers de mensageria estão ouvindo por eventos...');
});