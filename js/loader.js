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
        
        console.log('🔄 Carregando prescrições...');
        
        try {
            await this.carregarViaIndice();
        } catch (error) {
            console.warn('❌ Índice não disponível, usando fallback...');
            await this.carregarViaFallback();
        }
        
        this.extrairMetadados();
        this.atualizarInterface();
        this.carregadas = true;
        
        console.log('🎉 Sistema carregado!', this.getEstatisticas());
    }

    async carregarViaIndice() {
        const response = await fetch('./js/prescricoes/indice.json');
        if (!response.ok) throw new Error('Índice não encontrado');
        
        this.indice = await response.json();
        console.log(`📋 Índice: ${this.indice.totalArquivos} arquivos`);
        
        for (const item of this.indice.arquivos) {
            await this.carregarArquivo(item.caminho);
        }
    }

    async carregarViaFallback() {
        const arquivos = [
            'urgencia/crise-respiratoria.json',
            'urgencia/asma-aguda.json',
            'consulta/rinossinusite.json'
        ];
        
        for (const caminho of arquivos) {
            await this.carregarArquivo(caminho);
        }
    }

    async carregarArquivo(caminho) {
        try {
            const response = await fetch(`./js/prescricoes/${caminho}`);
            if (!response.ok) return;
            
            const prescricao = await response.json();
            
            // PREVENÇÃO DE DUPLICAÇÃO - verifica se já existe
            if (!this.prescricoes.todas.find(p => p.id === prescricao.id)) {
                const prescricaoCompleta = {
                    ...prescricao,
                    categoriaArquivo: caminho.split('/')[0],
                    arquivoOrigem: caminho
                };
                
                this.prescricoes.todas.push(prescricaoCompleta);
                console.log(`✅ ${prescricao.nome}`);
            }
            
        } catch (error) {
            console.warn(`⚠️ ${caminho}:`, error.message);
        }
    }

    extrairMetadados() {
        this.categoriasUnicas.clear();
        this.faixasUnicas.clear();
        this.tiposUnicos.clear();
        
        this.prescricoes.todas.forEach(prescricao => {
            if (prescricao.categoria) this.categoriasUnicas.add(prescricao.categoria);
            if (prescricao.faixa) this.faixasUnicas.add(prescricao.faixa);
            if (prescricao.tipo) this.tiposUnicos.add(prescricao.tipo);
        });
    }

    atualizarInterface() {
        this.popularSelectPrescricoes();
        this.popularFiltros();
        this.atualizarContadores();
    }

    popularSelectPrescricoes() {
        const select = document.getElementById('prescription-select');
        if (!select) return;
        
        // Limpa completamente para evitar duplicação
        select.innerHTML = '<option value="">Selecione uma prescrição...</option>';
        
        // AGRUPAMENTO POR CATEGORIA
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
            group.label = this.formatarCategoria(categoria);
            
            prescricoes.forEach(prescricao => {
                const option = document.createElement('option');
                option.value = prescricao.id;
                option.textContent = prescricao.nome;
                option.setAttribute('data-categoria', prescricao.categoria || '');
                option.setAttribute('data-faixa', prescricao.faixa || '');
                option.setAttribute('data-tipo', prescricao.tipo || '');
                group.appendChild(option);
            });
            
            select.appendChild(group);
        });
        
        // EVENTOS FUNCIONAIS - apenas uma vez
        if (!select._hasChangeEvent) {
            select.addEventListener('change', (e) => {
                this.onPrescricaoSelecionada(e.target.value);
            });
            select._hasChangeEvent = true;
        }
    }

    formatarCategoria(categoria) {
        const formatos = {
            'respiratoria': 'Respiratórias',
            'cardiologica': 'Cardiológicas',
            'pediatria': 'Pediatria',
            'adulto': 'Adulto',
            'urgencia': 'Urgências',
            'consulta': 'Consultas'
        };
        return formatos[categoria] || categoria;
    }

    onPrescricaoSelecionada(idPrescricao) {
        if (!idPrescricao) return;
        
        const prescricao = this.buscarPorId(idPrescricao);
        if (prescricao && window.fillPrescriptionForm) {
            window.fillPrescriptionForm(prescricao);
        }
    }

    popularFiltros() {
        this.popularSelectFiltro('filter-category', [...this.categoriasUnicas], 'Todas as Categorias');
        this.popularSelectFiltro('filter-age', [...this.faixasUnicas], 'Todas as Idades');
        this.popularSelectFiltro('filter-type', [...this.tiposUnicos], 'Todos os Tipos');
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
        ['filter-category', 'filter-age', 'filter-type'].forEach(id => {
            const select = document.getElementById(id);
            if (select && !select._hasChangeEvent) {
                select.addEventListener('change', () => this.aplicarFiltros());
                select._hasChangeEvent = true;
            }
        });
    }

    aplicarFiltros() {
        const categoria = document.getElementById('filter-category')?.value || '';
        const faixa = document.getElementById('filter-age')?.value || '';
        const tipo = document.getElementById('filter-type')?.value || '';
        
        const select = document.getElementById('prescription-select');
        if (!select) return;
        
        const options = select.querySelectorAll('option');
        options.forEach(option => {
            if (!option.value) return;
            
            const matchCategoria = !categoria || option.getAttribute('data-categoria') === categoria;
            const matchFaixa = !faixa || option.getAttribute('data-faixa') === faixa;
            const matchTipo = !tipo || option.getAttribute('data-tipo') === tipo;
            
            option.style.display = (matchCategoria && matchFaixa && matchTipo) ? '' : 'none';
        });
        
        if (select.value && select.options[select.selectedIndex].style.display === 'none') {
            select.value = '';
        }
    }

    atualizarContadores() {
        const elementos = {
            'total-prescriptions': this.prescricoes.todas.length,
            'total-categories': this.categoriasUnicas.size,
            'total-age-groups': this.faixasUnicas.size
        };
        
        Object.entries(elementos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.textContent = valor;
        });
    }

    // MÉTODOS DE CONSULTA
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

    // MÉTODOS DE DEBUG
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

    verificarDuplicatas() {
        const ids = this.prescricoes.todas.map(p => p.id);
        const duplicatas = ids.filter((id, index) => ids.indexOf(id) !== index);
        
        if (duplicatas.length > 0) {
            console.warn('⚠️ Duplicatas:', duplicatas);
            return false;
        }
        console.log('✅ Sem duplicatas');
        return true;
    }
}

// Instância global
const loader = new PrescricaoLoader();

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando sistema...');
    await loader.carregarTodasPrescricoes();
    loader.verificarDuplicatas(); // Debug
});

window.PrescricaoLoader = PrescricaoLoader;
window.loader = loader;
