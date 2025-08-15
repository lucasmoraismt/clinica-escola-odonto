// 1. Carregar variáveis de ambiente e importar bibliotecas
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const EventEmitter = require('events');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 2. Inicializar o Express e o Middleware de Mensagens
const app = express();
const messageQueue = new EventEmitter();
const PORT = 3000;

// Testar se as rotas básicas funcionam
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// 3. Configurar os Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- DADOS "MARRETADOS" ---
const TISAUDE_BASE_URL = 'https://api.tisaude.com';
const AUTH_TOKEN = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwaS50aXNhdWRlLmNvbSIsImlhdCI6MTc1NTIwOTcyOSwiZXhwIjoxNzU3ODAxNzI5LCJuYmYiOjE3NTUyMDk3MjksImp0aSI6IjFRTDZ1ZEwzYmxsdmpDZXMiLCJzdWIiOiI4Nzk2MyIsInBydiI6IjU4NzA4NjNkNGE2MmQ3OTE0NDNmYWY5MzZmYzM2ODAzMWQxMTBjNGYifQ.PT5m9YRmrMz4MNwgR7ib49WFVLOL6pxPNv3bMER0U8c'; 

// Configuração do Google Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAAr8Wx_1uOEu2gjdd3AagWzdQSUayaUsk';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Base de dados local simulada para dados do usuário
let userData = {
  id: 'user001',
  nome: 'Dr. João Santos',
  email: 'joao.santos@clinica.com',
  cro: 'CRO-SP 12345',
  especialidade: 'Clínica Geral',
  telefone: '(11) 99999-9999',
  funcao: 'Supervisor',
  senha: 'senha123',
  ultimoLogin: '2025-08-15 09:30:00',
  dataCriacao: '2024-01-15',
  status: 'Ativo',
  tema: 'light',
  notificacoes: true
};

// Base de dados simulada para agendamentos
let agendamentosHoje = [
  {
    id: 1,
    horario: '08:00',
    paciente: 'Maria da Silva',
    status: 'Atendido',
    procedimento: 'Consulta de Avaliação',
    aluno: 'Carlos Andrade',
    pacienteId: 1001
  },
  {
    id: 2,
    horario: '09:00',
    paciente: 'José Oliveira',
    status: 'Atendido',
    procedimento: 'Restauração Dente 26',
    aluno: 'Ana Beatriz',
    pacienteId: 1002
  },
  {
    id: 3,
    horario: '10:30',
    paciente: 'Ana Costa',
    status: 'Atendido',
    procedimento: 'Limpeza Dental',
    aluno: 'Pedro Silva',
    pacienteId: 1003
  },
  {
    id: 4,
    horario: '14:00',
    paciente: 'Carlos Santos',
    status: 'Pendente',
    procedimento: 'Extração Dente 18',
    aluno: 'Mariana Lopes',
    pacienteId: 1004
  },
  {
    id: 5,
    horario: '15:30',
    paciente: 'Fernanda Lima',
    status: 'Confirmado',
    procedimento: 'Canal Dente 36',
    aluno: 'Roberto Mendes',
    pacienteId: 1005
  },
  {
    id: 6,
    horario: '16:00',
    paciente: 'Roberto Silva',
    status: 'Confirmado',
    procedimento: 'Prótese Parcial',
    aluno: 'Julia Santos',
    pacienteId: 1006
  }
];
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

// =======================================================================
//  ROTAS DA AGENDA
// =======================================================================

// Buscar agendamentos do dia
app.get('/api/agenda', (req, res) => {
  try {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const agendamentosComData = agendamentosHoje.map(agendamento => ({
      ...agendamento,
      data: hoje
    }));
    res.json(agendamentosComData);
  } catch (error) {
    console.error('Erro ao buscar agenda:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Buscar próximo paciente
app.get('/api/agenda/proximo', (req, res) => {
  try {
    const agora = new Date();
    const horaAtual = agora.getHours() * 60 + agora.getMinutes();
    
    const proximosAgendamentos = agendamentosHoje
      .filter(ag => {
        const [hora, minuto] = ag.horario.split(':').map(Number);
        const horarioMinutos = hora * 60 + minuto;
        return horarioMinutos >= horaAtual && ag.status !== 'Reagendado';
      })
      .sort((a, b) => {
        const [horaA, minutoA] = a.horario.split(':').map(Number);
        const [horaB, minutoB] = b.horario.split(':').map(Number);
        return (horaA * 60 + minutoA) - (horaB * 60 + minutoB);
      });

    if (proximosAgendamentos.length > 0) {
      res.json(proximosAgendamentos[0]);
    } else {
      res.json({ message: 'Não há mais agendamentos hoje.' });
    }
  } catch (error) {
    console.error('Erro ao buscar próximo paciente:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// =======================================================================
//  ROTAS DE USUÁRIO/CONFIGURAÇÕES
// =======================================================================

// Buscar dados do usuário atual
app.get('/api/user', (req, res) => {
  try {
    const userDataResponse = {
      ...userData,
      senha: undefined
    };
    res.json(userDataResponse);
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Atualizar dados do usuário
app.put('/api/user', (req, res) => {
  try {
    const { nome, email, cro, especialidade, telefone, funcao, senhaAtual, novaSenha, tema, notificacoes } = req.body;
    
    if (senhaAtual && novaSenha) {
      if (userData.senha !== senhaAtual) {
        return res.status(400).json({ message: 'Senha atual incorreta.' });
      }
      userData.senha = novaSenha;
    }
    
    if (nome) userData.nome = nome;
    if (email) userData.email = email;
    if (cro) userData.cro = cro;
    if (especialidade) userData.especialidade = especialidade;
    if (telefone) userData.telefone = telefone;
    if (funcao) userData.funcao = funcao;
    if (tema) userData.tema = tema;
    if (typeof notificacoes === 'boolean') userData.notificacoes = notificacoes;
    
    userData.ultimoLogin = new Date().toLocaleString('pt-BR');
    
    console.log('Dados do usuário atualizados:', userData.nome);
    
    const responseData = {
      ...userData,
      senha: undefined
    };
    
    res.json({ 
      message: 'Dados atualizados com sucesso!', 
      user: responseData 
    });
    
  } catch (error) {
    console.error('Erro ao atualizar dados do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Worker para atualização de dados do usuário
messageQueue.on('ATUALIZAR_USUARIO', async (dadosUsuario) => {
  console.log('[WORKER] Processando atualização de usuário:', dadosUsuario.nome);
  try {
    console.log(`[WORKER] Usuário ${dadosUsuario.nome} atualizado com sucesso!`);
  } catch (error) {
    console.error(`[WORKER] Falha ao atualizar usuário:`, error.message);
  }
});

// =======================================================================
//  API DO SECRETÁRIO IA COM GOOGLE GEMINI
// =======================================================================

// Função para obter resumo da agenda
function getAgendaResumo() {
  const total = agendamentosHoje.length;
  const atendidos = agendamentosHoje.filter(ag => ag.status === 'Atendido').length;
  const confirmados = agendamentosHoje.filter(ag => ag.status === 'Confirmado').length;
  const pendentes = agendamentosHoje.filter(ag => ag.status === 'Pendente').length;
  
  const agora = new Date();
  const horaAtual = agora.getHours() * 60 + agora.getMinutes();
  
  const proximoAgendamento = agendamentosHoje
    .filter(ag => {
      const [hora, minuto] = ag.horario.split(':').map(Number);
      const horarioMinutos = hora * 60 + minuto;
      return horarioMinutos >= horaAtual && ag.status !== 'Atendido';
    })
    .sort((a, b) => {
      const [horaA, minutoA] = a.horario.split(':').map(Number);
      const [horaB, minutoB] = b.horario.split(':').map(Number);
      return (horaA * 60 + minutoA) - (horaB * 60 + minutoB);
    })[0];

  return {
    total,
    atendidos,
    confirmados,
    pendentes,
    proximoPaciente: proximoAgendamento ? 
      `${proximoAgendamento.paciente} às ${proximoAgendamento.horario} (${proximoAgendamento.procedimento}, Aluno: ${proximoAgendamento.aluno})` : 
      'Não há mais agendamentos hoje'
  };
}

// Contexto da clínica para o Gemini
function getClinicContext() {
  const resumo = getAgendaResumo();
  
  return `
Você é um secretário IA especializado em odontologia para a Clínica Escola Odonto.

INFORMAÇÕES DA CLÍNICA:
- Nome: Clínica Escola Odonto
- Tipo: Clínica escola de odontologia
- Data: ${new Date().toLocaleDateString('pt-BR')}

AGENDA DE HOJE:
- Total de consultas: ${resumo.total}
- Pacientes atendidos: ${resumo.atendidos}
- Confirmados: ${resumo.confirmados}
- Pendentes: ${resumo.pendentes}
- Próximo paciente: ${resumo.proximoPaciente}

SUAS ESPECIALIDADES:
1. Procedimentos odontológicos (restauração, canal, extração, limpeza, etc.)
2. Protocolos clínicos (anamnese, emergências, biossegurança)
3. Gestão de pacientes e agendamentos
4. Orientações para estudantes de odontologia
5. Dúvidas administrativas da clínica

INSTRUÇÕES:
- Responda de forma clara e didática
- Use linguagem técnica quando apropriado, mas explique termos complexos
- Para procedimentos, liste os passos principais
- Seja específico sobre protocolos de segurança
- Mantenha o foco em odontologia e gestão clínica
- Se não souber algo específico da clínica, seja honesto
- Limite suas respostas a aproximadamente 200 palavras
`;
}

// Rota de teste simples
app.get('/api/test', (req, res) => {
  res.json({ message: 'Rota funcionando!' });
});

// Rota do chat do secretário com Gemini
console.log('Registrando rota /api/chat...');
app.post('/api/chat', async (req, res) => {
  console.log('Rota /api/chat chamada com:', req.body);
  try {
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        response: 'Por favor, digite uma mensagem.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    }

    // Verificar se a API key está configurada
    if (GEMINI_API_KEY === 'SUA_API_KEY_AQUI') {
      return res.json({
        response: '🔑 Para usar o secretário IA, configure sua API key do Google Gemini:\n\n1. Obtenha uma chave em: https://makersuite.google.com/app/apikey\n2. No servidor, substitua "SUA_API_KEY_AQUI" pela sua chave\n3. Ou defina a variável de ambiente GEMINI_API_KEY',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    }

    console.log(`[CHAT] Pergunta recebida: ${message}`);

    // Configurar o modelo Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Criar prompt completo com contexto dinâmico
    const fullPrompt = `${getClinicContext()}\n\nPergunta do usuário: ${message}`;

    // Gerar resposta
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    console.log(`[CHAT] Resposta gerada com sucesso`);

    res.json({ 
      response: text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
    
  } catch (error) {
    console.error('Erro no chat com Gemini:', error);
    
    let errorMessage = 'Desculpe, ocorreu um erro. Tente novamente.';
    
    if (error.message.includes('API_KEY')) {
      errorMessage = '🔑 Erro de autenticação. Verifique se a API key do Gemini está correta.';
    } else if (error.message.includes('quota')) {
      errorMessage = '⚠️ Limite de uso da API atingido. Tente novamente mais tarde.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = '🌐 Erro de conexão. Verifique sua internet e tente novamente.';
    }
    
    res.status(500).json({ 
      response: errorMessage,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('Workers de mensageria estão ouvindo por eventos...');
  console.log(`API Key Gemini configurada: ${GEMINI_API_KEY ? 'SIM' : 'NÃO'}`);
});