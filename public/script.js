document.addEventListener('DOMContentLoaded', () => {
  showView('dashboard-view');
  document.getElementById('btn-buscar').addEventListener('click', handleBuscaPaciente);
  document.getElementById('form-cadastro').addEventListener('submit', handleCadastroPaciente);
});

function showView(viewId) {
  document.querySelectorAll('.view').forEach(view => view.style.display = 'none');
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.style.display = 'block';
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