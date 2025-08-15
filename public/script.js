// Variável global para armazenar os resultados da última busca
let pacientesCache = {};

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

async function handleBuscaPaciente() {
  const termo = document.getElementById('termo-busca').value;
  const tbody = document.getElementById('resultado-busca');
  tbody.innerHTML = '<tr><td colspan="4">Buscando...</td></tr>';
  pacientesCache = {}; // Limpa o cache a cada nova busca

  try {
    const response = await fetch(`/api/pacientes?termo=${termo}`);
    const listaPacientes = await response.json();
    
    tbody.innerHTML = '';
    if (Array.isArray(listaPacientes) && listaPacientes.length > 0) {
      listaPacientes.forEach(paciente => {
        // Armazena o objeto completo do paciente no cache, usando o ID como chave
        pacientesCache[paciente.id] = paciente;

        const tr = document.createElement('tr');
        const dataNasc = paciente.dateOfBirth || 'Não informada';
        
        tr.innerHTML = `
          <td>${paciente.name}</td>
          <td>${paciente.cpf || 'Não informado'}</td>
          <td>${dataNasc}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="verDetalhes(${paciente.id})">
              <i class="bi bi-file-earmark-text"></i> Ver Prontuário
            </button>
          </td>
        `;
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

// LIDA COM A VISUALIZAÇÃO DOS DETALHES (AGORA USANDO O CACHE)
function verDetalhes(pacienteId) {
  // Busca o paciente no nosso cache em vez de fazer uma nova chamada de API
  const paciente = pacientesCache[pacienteId];

  if (!paciente) {
    alert('Erro: Não foi possível encontrar os dados do paciente. Tente buscar novamente.');
    return;
  }
  
  // Preenche a tela de detalhes com os dados do cache
  document.getElementById('detalhes-nome-paciente').textContent = paciente.name || 'Nome não informado';
  document.getElementById('detalhes-nome-completo').textContent = paciente.name || 'Nome não informado';
  document.getElementById('detalhes-cpf').textContent = paciente.cpf || 'Não informado';
  document.getElementById('detalhes-celular').textContent = paciente.cellphone || 'Não informado';
  document.getElementById('detalhes-id').textContent = paciente.id;
  document.getElementById('detalhes-idade').textContent = paciente.agePatient || 'Não informada';
  document.getElementById('detalhes-dataNascimento').textContent = paciente.dateOfBirth || 'Não informada';
  
  showView('paciente-detail-view');
}