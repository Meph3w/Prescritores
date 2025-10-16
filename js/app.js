// App principal - Controle da aplicação
let prescricoes = { todas: [] };
let carregamentoConcluido = false;

// Função para formatar categorias
function formatarCategoria(categoria) {
    const categorias = { 
        'alergica': '🤧 Alérgicas',
        'alergologica': '🤧 Alérgicas',
        'cardiologica': '❤️ Cardiovasculares', 
        'dermatologica': '🦠 Dermatológicas',
        'endocrina': '⚖️ Endócrinas',
        'geriatria': '🧓 Geriatria',
        'geriatrica': '🧓 Geriatria',
        'gastrointestinal': '🫀 Gastrointestinais',
        'ginecologica': '🦞 Ginecologia',
        'hematologica': '🩸 Hematologia',
        'infecciosa': '🦠 Infecciosas',
        'infectologica': '🦠 Infecciosas',
        'neonatal': '👶 Neonatal',
        'neurologica': '🧠 Neurológicas',
        'oftalmologica': '👁️ Oftalmológicas',
        'oncologica': '🤧 Oncologia',
        'ortopedica': '🦴 Ortopédicas',
        'otorrinolaringologica': '👂 Otorrinolaringológicas',
        'pediatrica': '👶 Pediatria',
        'psiquiatrica': '🧠 Psiquiátricas',
        'renal': '💧 Renais',
        'reumatologica': '🦵 Reumatológicas',
        'respiratoria': '🫁 Respiratórias',
        'urologica': '💧 Urologia'
};
    return categorias[categoria] || categoria;
}

// Função principal de filtro
function filtrarPrescricoes() {
    if (!carregamentoConcluido) return;
    
    const faixa = document.getElementById('faixaEtaria').value;
    const tipo = document.getElementById('tipoAtendimento').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectPrescricao = document.getElementById('prescricao');
    
    selectPrescricao.innerHTML = '<option value="">Selecione uma prescrição</option>';
    
    const filtradas = prescricoes.todas.filter(presc => {
        const matchFaixa = faixa === 'todas' || presc.faixa === faixa;
        const matchTipo = tipo === 'todos' || presc.tipo === tipo;
        const matchSearch = presc.nome.toLowerCase().includes(searchTerm);
        
        return matchFaixa && matchTipo && matchSearch;
    });
    
    if (filtradas.length === 0) {
        selectPrescricao.innerHTML = '<option value="">Nenhuma prescrição encontrada</option>';
        return;
    }
    
    // Agrupar por categoria
    const categorias = {};
    filtradas.forEach(presc => {
        if (!categorias[presc.categoria]) {
            categorias[presc.categoria] = [];
        }
        categorias[presc.categoria].push(presc);
    });
    
    // Adicionar ao select agrupado
    Object.keys(categorias).sort().forEach(categoria => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = formatarCategoria(categoria);
        
        categorias[categoria].sort((a, b) => a.nome.localeCompare(b.nome))
            .forEach(presc => {
                const option = document.createElement('option');
                option.value = presc.id;
                option.textContent = presc.nome;
                optgroup.appendChild(option);
            });
            
        selectPrescricao.appendChild(optgroup);
    });
    
    // Atualizar contador
    atualizarContador(filtradas.length);
}

function atualizarContador(total) {
    let contador = document.getElementById('contador-prescricoes');
    if (!contador) {
        contador = document.createElement('div');
        contador.id = 'contador-prescricoes';
        contador.className = 'contador';
        document.querySelector('.filtros').appendChild(contador);
    }
    contador.textContent = `${total} prescrições encontradas`;
}

// Função para carregar conteúdo da prescrição selecionada
function carregarConteudo() {
    const prescricaoId = document.getElementById('prescricao').value;
    const secaoEditor = document.getElementById('secao-editor');
    
    if (prescricaoId) {
        const prescricao = loader.buscarPorId(prescricaoId);
        if (prescricao) {
            document.getElementById('editor').innerHTML = prescricao.conteudo;
            
            // Configurar data atual como padrão
            const hoje = new Date();
            document.getElementById('dataPrescricao').value = hoje.toISOString().split('T')[0];
            
            // Mostrar seção do editor
            secaoEditor.classList.remove('hidden');
            
            // Scroll suave para o editor
            secaoEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            console.log(`📝 Carregada: ${prescricao.nome}`);
        }
    } else {
        secaoEditor.classList.add('hidden');
    }
}

// Mostrar loading
function mostrarLoading() {
    const select = document.getElementById('prescricao');
    select.innerHTML = '<option value="">🔄 Carregando prescrições...</option>';
    select.disabled = true;
}

// Esconder loading
function esconderLoading() {
    const select = document.getElementById('prescricao');
    select.disabled = false;
}

// Inicialização da aplicação
async function inicializarApp() {
    console.log('🚀 Iniciando aplicação...');
    
    try {
        mostrarLoading();
        
        // Carrega prescrições automaticamente
        await loader.carregarTodasPrescricoes();
        prescricoes = loader.getPrescricoes();
        carregamentoConcluido = true;
        
        // Configura data atual
        document.getElementById('dataPrescricao').value = new Date().toISOString().split('T')[0];
        
        // Atualiza interface
        esconderLoading();
        filtrarPrescricoes();
        
        // Mostra estatísticas no console
        const stats = loader.getEstatisticas();
        console.log('📊 Estatísticas:', stats);
        
        console.log('✅ Aplicação iniciada com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar aplicação:', error);
        esconderLoading();
        
        const select = document.getElementById('prescricao');
        select.innerHTML = '<option value="">❌ Erro ao carregar prescrições</option>';
        
        alert('Erro ao carregar prescrições. Verifique o console para detalhes.');
    }
}

// Inicialização quando a página carregar
window.onload = inicializarApp;
