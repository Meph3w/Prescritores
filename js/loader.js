class PrescricaoLoader {
    constructor() {
        this.prescricoes = { todas: [] };
        this.carregadas = false;
        this.categoriasUnicas = new Set();
        this.faixasUnicas = new Set();
        this.tiposUnicos = new Set();
        this.indice = null;
    }

    async carregarTodasPrescricoes() {
        if (this.carregadas) return;
        
        console.log('🔄 Iniciando carregamento de prescrições via índice...');
        
        try {
            // 1. Carrega o índice gerado pelo GitHub Actions
            this.indice = await this.carregarIndice();
            console.log(`📋 Índice carregado: ${this.indice.totalArquivos} arquivos`);
            
            // 2. Carrega cada prescrição listada no índice
            for (const item of this.indice.arquivos) {
                await this.carregarPrescricaoIndividual(item.caminho, item);
            }
            
            // 3. Extrai categorias, faixas e tipos DOS DADOS reais carregados
            this.extrairMetadadosDinamicamente();
            
            // 4. Atualiza a interface
            this.atualizarInterface();
            
            this.carregadas = true;
            console.log('🎉 Carregamento via índice concluído!', this.getEstatisticas());
            
        } catch (error) {
            console.error('❌ Erro ao carregar prescrições:', error);
            this.mostrarErroInterface();
            throw error;
        }
    }

    async carregarIndice() {
        try {
            const response = await fetch('./js/prescricoes/indice.json');
            
            if (!response.ok) {
                throw new Error(`Índice não encontrado (${response.status})`);
            }
            
            const indice = await response.json();
            
            if (!indice.arquivos || !Array.isArray(indice.arquivos)) {
                throw new Error('Índice inválido ou corrompido');
            }
            
            return indice;
            
        } catch (error) {
            console.error('❌ Erro ao carregar índice:', error);
            throw new Error('Execute o workflow para gerar o índice primeiro');
        }
    }

    async carregarPrescricaoIndividual(caminhoArquivo, metadadosIndice) {
        try {
            const response = await fetch(`./js/prescricoes/${caminhoArquivo}`);
            
            if (!response.ok) {
                throw new Error(`Arquivo não encontrado: ${response.status}`);
            }
            
            const prescricao = await response.json();
            
            // Validação básica dos dados
            if (!prescricao.id || !prescricao.nome || !prescricao.conteudo) {
                console.warn(`⚠️ Prescrição incompleta: ${caminhoArquivo}`);
                return;
            }
            
            // Adiciona metadados de arquivo
            const [categoriaArquivo] = caminhoArquivo.split('/');
            const prescricaoCompleta = {
                ...prescricao,
                categoriaArquivo: categoriaArquivo,
                arquivoOrigem: caminhoArquivo,
                carregadoEm: new Date().toISOString()
            };
            
            this.prescricoes.todas.push(prescricaoCompleta);
            console.log(`✅ Carregado: ${prescricao.nome}`);
            
        } catch (error) {
            console.warn(`⚠️ Erro ao carregar ${caminhoArquivo}:`, error.message);
            // Não propaga o erro para não parar o carregamento de outras prescrições
        }
    }

    extrairMetadadosDinamicamente() {
        // Limpa os sets antes de extrair
        this.categoriasUnicas.clear();
        this.faixasUnicas.clear();
        this.tiposUnicos.clear();
        
        // Extrai categorias, faixas e tipos DOS DADOS REAIS carregados
        this.prescricoes.todas.forEach(prescricao => {
            if (prescricao.categoria) this.categoriasUnicas.add(prescricao.categoria);
            if (prescricao.faixa) this.faixasUnicas.add(prescricao.faixa);
            if (prescricao.tipo) this.tiposUnicos.add(prescricao.tipo);
        });
        
        console.log('📊 Metadados extraídos dinamicamente:', {
            categorias: [...this.categoriasUnicas],
            faixas: [...this.faixasUnicas], 
            tipos: [...this.tiposUnicos]
        });
    }

    atualizarInterface() {
        this.popularSelectPrescricoes();
        this.popularFiltros();
        this.atualizarContadores();
    }

    popularSelectPrescricoes() {
        const select = document.getElementById('prescription-select');
        if (!select) {
            console.warn('⚠️ Elemento prescription-select não encontrado');
            return;
        }
        
        select.innerHTML = '<option value="">Selecione uma prescrição...</option>';
        
        // Agrupa por categoria dos dados reais
        const prescricoesPorCategoria = {};
        this.prescricoes.todas.forEach(prescricao => {
            const categoria = prescricao.categoria || 'Geral';
            if (!prescricoesPorCategoria[categoria]) {
                prescricoesPorCategoria[categoria] = [];
            }
            prescricoesPorCategoria[categoria].push(prescricao);
        });
        
        // Cria os grupos
        Object.entries(prescricoesPorCategoria).forEach(([categoria, prescricoes]) => {
            const group = document.createElement('optgroup');
            group.label = categoria.toUpperCase();
            
            prescricoes.forEach(prescricao => {
                const option = document.createElement('option');
                option.value = prescricao.id;
                option.textContent = prescricao.nome;
                option.setAttribute('data-categoria', categoria);
                option.setAttribute('data-faixa', prescricao.faixa || '');
                option.setAttribute('data-tipo', prescricao.tipo || '');
                group.appendChild(option);
            });
            
            select.appendChild(group);
        });
        
        // Adiciona evento de change
        select.addEventListener('change', (e) => {
            this.onPrescricaoSelecionada(e.target.value);
        });
        
        console.log(`📝 Select populado: ${this.prescricoes.todas.length} opções`);
    }

    onPrescricaoSelecionada(idPrescricao) {
        if (!idPrescricao) return;
        
        const prescricao = this.buscarPorId(idPrescricao);
        if (prescricao) {
            console.log(`🎯 Prescrição selecionada: ${prescricao.nome}`);
            
            // Chama a função global para preencher o formulário
            if (window.fillPrescriptionForm) {
                window.fillPrescriptionForm(prescricao);
            } else {
                console.warn('⚠️ Função fillPrescriptionForm não encontrada');
            }
        }
    }

    popularFiltros() {
        this.popularSelectFiltro('filter-category', [...this.categoriasUnicas], 'Todas as Categorias');
        this.popularSelectFiltro('filter-age', [...this.faixasUnicas], 'Todas as Idades');
        this.popularSelectFiltro('filter-type', [...this.tiposUnicos], 'Todos os Tipos');
        
        // Adiciona eventos aos filtros
        this.configurarEventosFiltros();
    }

    popularSelectFiltro(id, opcoes, textoPadrao) {
        const select = document.getElementById(id);
        if (!select) return;
        
        select.innerHTML = `<option value="">${textoPadrao}</option>`;
        opcoes.sort().forEach(opcao => {
            const option = document.createElement('option');
            option.value = opcao;
            option.textContent = opcao;
            select.appendChild(option);
        });
    }

    configurarEventosFiltros() {
        const filtros = ['filter-category', 'filter-age', 'filter-type'];
        
        filtros.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.addEventListener('change', () => this.aplicarFiltros());
            }
        });
    }

    aplicarFiltros() {
        const categoria = document.getElementById('filter-category')?.value || '';
        const faixa = document.getElementById('filter-age')?.value || '';
        const tipo = document.getElementById('filter-type')?.value || '';
        
        const select = document.getElementById('prescription-select');
        if (!select) return;
        
        // Mostra/oculta opções baseado nos filtros
        const options = select.querySelectorAll('option');
        options.forEach(option => {
            if (!option.value) return; // Pula a opção padrão
            
            const matchCategoria = !categoria || option.getAttribute('data-categoria') === categoria;
            const matchFaixa = !faixa || option.getAttribute('data-faixa') === faixa;
            const matchTipo = !tipo || option.getAttribute('data-tipo') === tipo;
            
            option.style.display = (matchCategoria && matchFaixa && matchTipo) ? '' : 'none';
        });
        
        // Reseta a seleção se a opção atual ficou oculta
        if (select.value && select.options[select.selectedIndex].style.display === 'none') {
            select.value = '';
        }
        
        console.log(`🔍 Filtros aplicados: Categoria=${categoria}, Faixa=${faixa}, Tipo=${tipo}`);
    }

    atualizarContadores() {
        // Atualiza contadores na interface se existirem
        const elementosContador = {
            'total-prescriptions': this.prescricoes.todas.length,
            'total-categories': this.categoriasUnicas.size,
            'total-age-groups': this.faixasUnicas.size
        };
        
        Object.entries(elementosContador).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = valor;
            }
        });
    }

    mostrarErroInterface() {
        const select = document.getElementById('prescription-select');
        if (select) {
            select.innerHTML = '<option>Erro ao carregar prescrições. Execute o workflow para gerar o índice.</option>';
        }
    }

    // Métodos de consulta
    getPrescricoes() {
        return this.prescricoes;
    }

    buscarPorId(id) {
        return this.prescricoes.todas.find(p => p.id === id);
    }

    buscarPorNome(termo) {
        const termoLower = termo.toLowerCase();
        return this.prescricoes.todas.filter(p => 
            p.nome.toLowerCase().includes(termoLower) ||
            p.conteudo.toLowerCase().includes(termoLower)
        );
    }

    getPrescricoesPorCategoria(categoria) {
        return this.prescricoes.todas.filter(p => p.categoria === categoria);
    }

    getPrescricoesPorFaixa(faixa) {
        return this.prescricoes.todas.filter(p => p.faixa === faixa);
    }

    getPrescricoesPorTipo(tipo) {
        return this.prescricoes.todas.filter(p => p.tipo === tipo);
    }

    getEstatisticas() {
        return {
            total: this.prescricoes.todas.length,
            categorias: this.categoriasUnicas.size,
            faixas: this.faixasUnicas.size,
            tipos: this.tiposUnicos.size,
            ultimaAtualizacao: this.indice?.geradoEm || 'N/A'
        };
    }

    // Método para debug
    debugInfo() {
        return {
            indice: this.indice,
            prescricoes: this.prescricoes.todas.map(p => ({
                id: p.id,
                nome: p.nome,
                categoria: p.categoria,
                faixa: p.faixa,
                tipo: p.tipo
            })),
            metadados: {
                categorias: [...this.categoriasUnicas],
                faixas: [...this.faixasUnicas],
                tipos: [...this.tiposUnicos]
            }
        };
    }
}

// Instância global e inicialização automática
const loader = new PrescricaoLoader();

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Inicializando sistema de prescrições...');
    
    try {
        await loader.carregarTodasPrescricoes();
        console.log('✅ Sistema de prescrições inicializado com sucesso!');
    } catch (error) {
        console.error('❌ Falha na inicialização:', error);
    }
});

// Exportar para uso global
window.PrescricaoLoader = PrescricaoLoader;
window.loader = loader;
