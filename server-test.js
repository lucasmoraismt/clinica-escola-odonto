require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.static('public'));

// Configuração do Google Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Contexto da clínica para o Gemini
const clinicContext = `
Você é um assistente IA especializado em odontologia para a Clínica Escola Odonto.

INFORMAÇÕES DA CLÍNICA:
- Nome: Clínica Escola Odonto
- Tipo: Clínica escola de odontologia
- Hoje temos 8 consultas agendadas (6 confirmadas, 2 pendentes)
- Próximo paciente: Ana Silva às 14:00 (Restauração dente 16, Aluno: Carlos Andrade)

SUAS ESPECIALIDADES:
1. Procedimentos odontológicos (restauração, canal, extração, limpeza, etc.)
2. Protocolos clínicos (anamnese, emergências, biossegurança)
3. Gestão de pacientes e agendamentos
4. Orientações para estudantes de odontologia
5. Dúvidas administrativas da clínica

INSTRUÇÕES DE FORMATAÇÃO:
- SEMPRE formate sua resposta em Markdown
- Use cabeçalhos (##, ###) para organizar tópicos
- Use listas numeradas (1., 2., 3.) para procedimentos sequenciais
- Use listas com marcadores (-, *) para itens relacionados
- Use **negrito** para termos importantes
- Use \`codigo\` para nomes de medicamentos ou materiais específicos
- Use > citações para protocolos importantes
- Use tabelas quando apropriado

INSTRUÇÕES DE CONTEÚDO:
- Responda de forma clara e didática
- Use linguagem técnica quando apropriado, mas explique termos complexos
- Para procedimentos, liste os passos principais organizados
- Seja específico sobre protocolos de segurança
- Mantenha o foco em odontologia e gestão clínica
- Se não souber algo específico da clínica, seja honesto
- Limite suas respostas a aproximadamente 250 palavras
`;

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Servidor funcionando!', timestamp: new Date() });
});

// Rota do chat
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
    if (!GEMINI_API_KEY) {
      return res.json({
        response: '🔑 Para usar o assistente IA, configure sua API key do Google Gemini no arquivo .env',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    }

    console.log(`[CHAT] Pergunta recebida: ${message}`);

    // Configurar o modelo Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Criar prompt completo com contexto
    const fullPrompt = `${clinicContext}\n\nPergunta do usuário: ${message}`;

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

app.listen(PORT, () => {
  console.log(`Servidor de teste rodando em http://localhost:${PORT}`);
  console.log(`API Key Gemini configurada: ${GEMINI_API_KEY ? 'SIM' : 'NÃO'}`);
});