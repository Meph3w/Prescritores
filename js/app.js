// App principal
let prescricoes = { todas: [] };

// Função para formatar categorias
function formatarCategoria(categoria) {
    const categorias = {
        'respiratoria': '🫁 Respiratórias',
        'cardiovascular': '❤️ Cardiovasculares',
        'neurologica': '🧠 Neurológicas',
        'gastrointestinal': '🫀 Gastrointestinais',
        'otorrinolaringologica': '👂 Otorrinolaringológicas',
        'alergica': '🤧 Alérgicas',
        'dermatologica': '🦠 Dermatológicas',
        'infecciosa': '🦠 Infecciosas',
        'endocrina': '⚖️ Endócrinas',
        'reumatologica': '🦵 Reumatológicas',
        'psiquiatrica': '🧠 Psiquiátricas',
        'ortopedica': '🦴 Ortopédicas',
        'renal': '💧 Renais',
        'oftalmologica': '👁️ Oftalmológicas',
        'neonatal': '👶 Neonatal',
        'geriatria': '🧓 Geriatria'
    };
    return categorias[categoria] || categoria;
}

// Função principal de filtro
function filtrarPrescricoes() {
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
    
    // Agrupar por categoria
    const categorias = {};
    filtradas.forEach(presc => {
        if (!categorias[presc.categoria]) {
            categorias[presc.categoria] = [];
        }
        categorias[presc.categoria].push(presc);
    });
    
    // Adicionar ao select agrupado
    Object.keys(categorias).forEach(categoria => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = formatarCategoria(categoria);
        categorias[categoria].forEach(presc => {
            const option = document.createElement('option');
            option.value = presc.id;
            option.textContent = presc.nome;
            optgroup.appendChild(option);
        });
        selectPrescricao.appendChild(optgroup);
    });
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
        }
    } else {
        secaoEditor.classList.add('hidden');
    }
}

// Inicialização da aplicação
async function inicializarApp() {
    try {
        // Carrega prescrições automaticamente
        await loader.carregarTodasPrescricoes();
        prescricoes = loader.getPrescricoes();
        
        // Configura data atual
        document.getElementById('dataPrescricao').value = new Date().toISOString().split('T')[0];
        
        // Atualiza interface
        filtrarPrescricoes();
        
        console.log('🚀 Aplicação iniciada com sucesso!');
        console.log(`📊 Total de prescrições: ${loader.getTotalPrescricoes()}`);
        
    } catch (error) {
        console.error('❌ Erro ao inicializar aplicação:', error);
        alert('Erro ao carregar prescrições. Verifique o console para detalhes.');
    }
}

// Inicialização quando a página carregar
window.onload = inicializarApp;
