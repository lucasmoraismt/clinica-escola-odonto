document.addEventListener('DOMContentLoaded', () => {
  showView('dashboard-view');
  document.getElementById('btn-buscar').addEventListener('click', handleBuscaPaciente);
  document.getElementById('form-cadastro').addEventListener('submit', handleCadastroPaciente);
  document.getElementById('form-settings').addEventListener('submit', handleUpdateUserSettings);
  document.getElementById('user-tema').addEventListener('change', handleThemeChange);
  document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);
  loadUserSettings();
  initializeTheme();
});

function showView(viewId) {
  document.querySelectorAll('.view').forEach(view => view.style.display = 'none');
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.style.display = 'block';
  }
  
  document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  const activeLink = document.querySelector(`.sidebar-nav .nav-link[onclick*="${viewId}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

  if (viewId === 'agenda-view') {
    loadAgenda();
  }
}

async function loadAgenda() {
  try {
    console.log('Carregando agenda...');
    const response = await fetch('/api/agenda');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const agendamentos = await response.json();
    console.log('Agendamentos recebidos:', agendamentos);
    
    const agendaLista = document.getElementById('agenda-lista');
    const agendaData = document.getElementById('agenda-data');
    
    if (!agendaLista || !agendaData) {
      console.error('Elementos da agenda não encontrados no DOM');
      return;
    }
    
    agendaData.textContent = new Date().toLocaleDateString('pt-BR');
    
    if (!Array.isArray(agendamentos) || agendamentos.length === 0) {
      agendaLista.innerHTML = '<div class="list-group-item text-center py-4">Nenhum agendamento para hoje</div>';
      return;
    }
    
    agendaLista.innerHTML = agendamentos.map(agendamento => {
      const statusClass = getStatusClass(agendamento.status);
      const statusIcon = getStatusIcon(agendamento.status);
      
      return `
        <a href="#" class="list-group-item list-group-item-action">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">${agendamento.horario} - ${agendamento.paciente}</h5>
            <small class="badge ${statusClass}">
              <i class="bi ${statusIcon} me-1"></i>
              ${agendamento.status}
            </small>
          </div>
          <p class="mb-1">Procedimento: ${agendamento.procedimento}</p>
          <small>Aluno: ${agendamento.aluno}</small>
        </a>
      `;
    }).join('');
    
    console.log('Agenda carregada com sucesso');
    
  } catch (error) {
    console.error('Erro ao carregar agenda:', error);
    const agendaLista = document.getElementById('agenda-lista');
    if (agendaLista) {
      agendaLista.innerHTML = 
        `<div class="list-group-item text-center py-4 text-danger">
          Erro ao carregar agenda: ${error.message}
        </div>`;
    }
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'Atendido': return 'bg-success';
    case 'Confirmado': return 'bg-primary';
    case 'Pendente': return 'bg-warning text-dark';
    default: return 'bg-secondary';
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'Atendido': return 'bi-check-circle-fill';
    case 'Confirmado': return 'bi-calendar-check';
    case 'Pendente': return 'bi-clock';
    default: return 'bi-question-circle';
  }
}

// LIDA COM A BUSCA DE PACIENTES (REATORADO PARA SER MAIS ROBUSTO)
async function handleBuscaPaciente() {
  const termo = document.getElementById('termo-busca').value;
  const tbody = document.getElementById('resultado-busca');
  tbody.innerHTML = '<tr><td colspan="4">Buscando...</td></tr>';

  try {
    const response = await fetch(`/api/pacientes?termo=${termo}`);
    const listaPacientes = await response.json();
    
    tbody.innerHTML = '';
    if (Array.isArray(listaPacientes) && listaPacientes.length > 0) {
      listaPacientes.forEach(paciente => {
        const tr = document.createElement('tr');
        const dataNasc = paciente.dateOfBirth || 'Não informada';

        // Cria as células da tabela
        const tdNome = document.createElement('td');
        tdNome.textContent = paciente.name;

        const tdCpf = document.createElement('td');
        tdCpf.textContent = paciente.cpf || 'Não informado';

        const tdDataNasc = document.createElement('td');
        tdDataNasc.textContent = dataNasc;

        const tdAcoes = document.createElement('td');
        
        // Cria o botão programaticamente
        const btnDetalhes = document.createElement('button');
        btnDetalhes.className = 'btn btn-sm btn-primary';
        btnDetalhes.innerHTML = `<i class="bi bi-file-earmark-text"></i> Ver Prontuário`;
        
        // *** AQUI ESTÁ A CORREÇÃO PRINCIPAL ***
        // Adiciona o evento de clique diretamente no elemento do botão
        btnDetalhes.addEventListener('click', () => {
          verDetalhes(paciente.id);
        });

        tdAcoes.appendChild(btnDetalhes);
        
        // Adiciona todas as células na linha
        tr.appendChild(tdNome);
        tr.appendChild(tdCpf);
        tr.appendChild(tdDataNasc);
        tr.appendChild(tdAcoes);
        
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="4">Nenhum paciente encontrado.</td></tr>';
    }
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    tbody.innerHTML = '<tr><td colspan="4">Erro ao carregar dados. Tente novamente.</td></tr>';
  }
}

async function handleCadastroPaciente(event) {
  event.preventDefault();
  const nome = document.getElementById('nome').value;
  const cpf = document.getElementById('cpf').value;
  const dataNascimento = document.getElementById('dataNascimento').value;
  
  const [ano, mes, dia] = dataNascimento.split('-');
  const dataFormatada = `${dia}/${mes}/${ano}`;

  const pacienteData = {
    name: nome,
    cpf: cpf,
    dateOfBirth: dataFormatada,
    cellphone: document.getElementById('celular').value,
  };

  try {
    const response = await fetch('/api/pacientes', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(pacienteData)
    });

    const result = await response.json();
    alert(result.message);

    if (response.status === 202) {
      document.getElementById('form-cadastro').reset();
      showView('paciente-search-view');
      handleBuscaPaciente();
    }
  } catch (error) {
    console.error('Erro ao cadastrar paciente:', error);
    alert('Falha na comunicação com o servidor.');
  }
}

async function verDetalhes(pacienteId) {
  try {
    const response = await fetch(`/api/pacientes/${pacienteId}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Não foi possível carregar os dados do paciente.');
    }
    const paciente = await response.json();
    
    document.getElementById('detalhes-header-nome').textContent = paciente.name || 'Prontuário do Paciente';
    document.getElementById('detalhes-nome-completo').textContent = paciente.name || 'Não informado';
    document.getElementById('detalhes-cpf').textContent = paciente.cpf || 'Não informado';
    document.getElementById('detalhes-celular').textContent = paciente.cellphone || 'Não informado';
    document.getElementById('detalhes-email').textContent = paciente.email || 'Não informado';
    document.getElementById('detalhes-id').textContent = paciente.idPatient || pacienteId;
    document.getElementById('detalhes-sexo').textContent = paciente.sex || 'Não informado';
    document.getElementById('detalhes-mae').textContent = paciente.motherName || 'Não informado';
    document.getElementById('detalhes-convenio').textContent = paciente.healthInsurance?.name || 'Particular';

    const statusEl = document.getElementById('detalhes-status');
    const statusText = paciente.status?.status || 'Indefinido';
    statusEl.textContent = statusText;
    statusEl.className = `badge ${statusText.toLowerCase() === 'ativo' ? 'bg-success' : 'bg-secondary'}`;
    
    if (paciente.dateOfBirth) {
      document.getElementById('detalhes-dataNascimento').textContent = paciente.dateOfBirth;
      const [dia, mes, ano] = paciente.dateOfBirth.split('/');
      const hoje = new Date();
      const nasc = new Date(ano, mes - 1, dia);
      let idade = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
        idade--;
      }
      document.getElementById('detalhes-idade').textContent = `${idade} anos`;
    } else {
      document.getElementById('detalhes-dataNascimento').textContent = 'Não informada';
      document.getElementById('detalhes-idade').textContent = 'Não informada';
    }

    showView('paciente-detail-view');
    
  } catch (error) {
    console.error(`Erro ao buscar detalhes do paciente ${pacienteId}:`, error);
    alert(error.message);
  }
}

// =======================================================================
//  FUNÇÕES DE CONFIGURAÇÕES DO USUÁRIO
// =======================================================================

async function loadUserSettings() {
  try {
    const response = await fetch('/api/user');
    if (!response.ok) {
      throw new Error('Falha ao carregar dados do usuário.');
    }
    
    const user = await response.json();
    
    document.getElementById('user-nome').value = user.nome || '';
    document.getElementById('user-email').value = user.email || '';
    document.getElementById('user-cro').value = user.cro || '';
    document.getElementById('user-especialidade').value = user.especialidade || '';
    document.getElementById('user-telefone').value = user.telefone || '';
    document.getElementById('user-funcao').value = user.funcao || 'Supervisor';
    document.getElementById('user-tema').value = user.tema || 'light';
    document.getElementById('user-notificacoes').checked = user.notificacoes || false;
    
    applyTheme(user.tema || 'light');
    
    document.getElementById('user-id').textContent = user.id || '-';
    document.getElementById('user-ultimo-login').textContent = user.ultimoLogin || '-';
    document.getElementById('user-data-criacao').textContent = user.dataCriacao || '-';
    document.getElementById('user-status').textContent = user.status || 'Ativo';
    
    const nomeExibido = user.nome ? user.nome.split(' ')[0] + ' ' + user.nome.split(' ')[user.nome.split(' ').length - 1] : 'Dr. João';
    document.querySelector('.sidebar-footer .fw-bold').textContent = nomeExibido;
    document.querySelector('.sidebar-footer .text-muted').textContent = user.funcao || 'Supervisor';
    
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    alert('Erro ao carregar dados da conta.');
  }
}

async function handleUpdateUserSettings(event) {
  event.preventDefault();
  
  const formData = {
    nome: document.getElementById('user-nome').value,
    email: document.getElementById('user-email').value,
    cro: document.getElementById('user-cro').value,
    especialidade: document.getElementById('user-especialidade').value,
    telefone: document.getElementById('user-telefone').value,
    funcao: document.getElementById('user-funcao').value,
    tema: document.getElementById('user-tema').value,
    notificacoes: document.getElementById('user-notificacoes').checked
  };
  
  const senhaAtual = document.getElementById('user-senha-atual').value;
  const novaSenha = document.getElementById('user-nova-senha').value;
  
  if (senhaAtual && novaSenha) {
    if (novaSenha.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    formData.senhaAtual = senhaAtual;
    formData.novaSenha = novaSenha;
  }
  
  try {
    const response = await fetch('/api/user', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert(result.message);
      
      document.getElementById('user-senha-atual').value = '';
      document.getElementById('user-nova-senha').value = '';
      
      const nomeExibido = formData.nome ? formData.nome.split(' ')[0] + ' ' + formData.nome.split(' ')[formData.nome.split(' ').length - 1] : 'Dr. João';
      document.querySelector('.sidebar-footer .fw-bold').textContent = nomeExibido;
      document.querySelector('.sidebar-footer .text-muted').textContent = formData.funcao;
      
      loadUserSettings();
    } else {
      alert(result.message || 'Erro ao atualizar dados.');
    }
    
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    alert('Erro de comunicação com o servidor.');
  }
}

// =======================================================================
//  FUNÇÕES DE TEMA
// =======================================================================

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    root.removeAttribute('data-theme');
  } else if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }
  
  localStorage.setItem('theme', theme);
}

function handleThemeChange(event) {
  const selectedTheme = event.target.value;
  applyTheme(selectedTheme);
  
  const updateData = { tema: selectedTheme };
  
  fetch('/api/user', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  }).catch(error => {
    console.error('Erro ao salvar tema:', error);
  });
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'auto') {
    applyTheme('auto');
  }
});

// =======================================================================
//  FUNÇÕES DO CHAT/SECRETÁRIO IA
// =======================================================================

async function handleChatSubmit(event) {
  event.preventDefault();
  
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  addUserMessage(message);
  input.value = '';
  
  showTypingIndicator();
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    
    const result = await response.json();
    
    hideTypingIndicator();
    addBotMessage(result.response, result.timestamp);
    
  } catch (error) {
    console.error('Erro no chat:', error);
    hideTypingIndicator();
    addBotMessage('Desculpe, ocorreu um erro. Tente novamente.', getCurrentTime());
  }
}

function addUserMessage(text) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user-message';
  
  messageDiv.innerHTML = `
    <div class="message-avatar">
      <i class="bi bi-person-fill"></i>
    </div>
    <div class="message-content">
      <div class="message-text">${escapeHtml(text)}</div>
      <div class="message-time">${getCurrentTime()}</div>
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  scrollToBottom();
}

function addBotMessage(text, timestamp) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message bot-message';
  
  // Renderizar Markdown para HTML
  let formattedText;
  if (typeof marked !== 'undefined') {
    // Configurar marked para ser seguro
    marked.setOptions({
      breaks: true,
      sanitize: false,
      smartypants: true
    });
    formattedText = marked.parse(text);
  } else {
    // Fallback se marked não estiver disponível
    formattedText = text.replace(/\n/g, '<br>');
  }
  
  messageDiv.innerHTML = `
    <div class="message-avatar">
      <i class="bi bi-robot"></i>
    </div>
    <div class="message-content">
      <div class="message-text markdown-content">${formattedText}</div>
      <div class="message-time">${timestamp}</div>
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  scrollToBottom();
}

function showTypingIndicator() {
  const messagesContainer = document.getElementById('chat-messages');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot-message';
  typingDiv.id = 'typing-indicator';
  
  typingDiv.innerHTML = `
    <div class="message-avatar">
      <i class="bi bi-robot"></i>
    </div>
    <div class="message-content">
      <div class="typing-indicator">
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(typingDiv);
  scrollToBottom();
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

function scrollToBottom() {
  const messagesContainer = document.getElementById('chat-messages');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function getCurrentTime() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function sendQuickQuestion(question) {
  document.getElementById('chat-input').value = question;
  document.getElementById('chat-form').dispatchEvent(new Event('submit'));
}

function clearChat() {
  const messagesContainer = document.getElementById('chat-messages');
  messagesContainer.innerHTML = `
    <div class="message bot-message">
      <div class="message-avatar">
        <i class="bi bi-robot"></i>
      </div>
      <div class="message-content">
        <div class="message-text">
          Olá! Sou o secretário da Clínica Escola Odonto. Posso ajudá-lo com:
          <ul class="mt-2 mb-0">
            <li>Informações sobre pacientes</li>
            <li>Procedimentos odontológicos</li>
            <li>Agendamentos e consultas</li>
            <li>Dúvidas administrativas</li>
          </ul>
          Como posso ajudá-lo hoje?
        </div>
        <div class="message-time">Agora</div>
      </div>
    </div>
  `;
}